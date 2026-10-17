import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { decodeJwt } from "jose";
import { load } from "cheerio";
import { Keypair, RestUrlManager, VulcanHebeCe, VulcanJwtRegister } from "hebece";

const DATA_DIR = path.join(process.cwd(), ".data");
const SESSIONS_FILE = path.join(DATA_DIR, "eduvulcan-mobile-sessions.json");

/** Normalize EduVULCAN timestamps without allowing invalid dates to crash an entire import. */
function dateFromTimestamp(timestamp: number | undefined): Date | null {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return null;
  // Some EduVULCAN responses use Unix seconds, while others use milliseconds.
  const milliseconds = Math.abs(timestamp) < 100_000_000_000 ? timestamp * 1000 : timestamp;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseCalendarDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Vulcan dates can be ISO strings or Polish dates (DD.MM.YYYY / DD-MM-YYYY).
  const polish = trimmed.match(/^(\\d{1,2})[.\\/-](\\d{1,2})[.\\/-](\\d{4})$/);
  if (polish) {
    const day = Number(polish[1]);
    const month = Number(polish[2]);
    const year = Number(polish[3]);
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day) {
      return candidate.toISOString().slice(0, 10);
    }
    return null;
  }
  const isoDate = trimmed.match(/^(\\d{4}-\\d{2}-\\d{2})/);
  if (isoDate) {
    const candidate = new Date(`${isoDate[1]}T12:00:00Z`);
    return Number.isNaN(candidate.getTime()) ? null : isoDate[1];
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function lessonStartDate(lesson: MobileLesson): Date | null {
  return dateFromTimestamp(lesson.Date?.Timestamp) ?? (() => {
    const calendarDate = parseCalendarDate(lesson.Date?.Date);
    return calendarDate ? new Date(`${calendarDate}T12:00:00Z`) : null;
  })();
}

function lessonEndDate(lesson: MobileLesson, start: Date): string | undefined {
  const rawTime = lesson.TimeSlot?.End?.trim();
  if (!rawTime) return undefined;
  const match = rawTime.match(/^(\\d{1,2}):(\\d{2})(?::(\\d{2}))?$/);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined;

  const date = parseCalendarDate(lesson.Date?.Date) ?? start.toISOString().slice(0, 10);
  const result = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}Z`);
  return Number.isNaN(result.getTime()) ? undefined : result.toISOString();
}

async function step<T>(name: string, action: () => T | Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error: unknown) {
    const e = error instanceof Error ? error : new Error("Unknown error");

    console.error(`[eduvulcan] step failed: ${name}`, {
      name: e.name,
      message: e.message,
      stack: e.stack,
    });

    throw error;
  }
}

type MobileKeypair = {
  fingerprint: string;
  privateKey: string;
  certificate: string;
};

type MobileStudent = {
  PupilId: number;
  FirstName: string;
  LastName: string;
  Pupil?: {
    ClassDisplay?: string;
    ConstituentUnit?: { Name?: string };
    Unit?: { Name?: string };
  };
};

type MobileGrade = {
  Id: string | number;
  Value: string | number;
  Column?: {
    Subject?: { Id?: string | number; Name?: string };
    Weight?: string | number;
    Name?: string;
  };
  DateCreated?: { Timestamp?: number };
  Creator?: { DisplayName?: string };
};

type MobileLesson = {
  Id: string | number;
  Subject?: { Name?: string };
  TeacherPrimary?: { DisplayName?: string };
  Room?: { Code?: string } | null;
  Date?: { Timestamp?: number; Date?: string };
  TimeSlot?: { End?: string };
};

type MobileHomework = {
  Id: string | number;
  Content?: string;
  Subject?: { Name?: string };
  Deadline?: { Timestamp?: number };
};

type MobileAttendance = {
  Id: string | number;
  LessonId?: string | number;
  Day?: { Timestamp?: number; Date?: string };
  LessonNumber?: number;
  Subject?: { Name?: string };
  PresenceType?: {
    Name?: string;
    Presence?: boolean;
    Absence?: boolean;
    Late?: boolean;
    AbsenceJustified?: boolean;
    Removed?: boolean;
  };
};

type MobileSession = {
  id: string;
  keypair: MobileKeypair;
  restUrl: string;
  student: MobileStudent;
  account: { fullName: string; studentId?: number };
  createdAt: string;
};

type ApiApPayload = {
  Success?: boolean;
  Tokens?: string[];
  Alias?: string;
  GivenName?: string;
  Surname?: string;
  AccessToken?: string;
  IsConsentAccepted?: boolean;
  CanAcceptConsent?: boolean;
  ErrorMessage?: string | null;
};

const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SESSION_TABLE = "eduvulcan_mobile_sessions";

function getSessionStoreConfig() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

async function supabaseRequest<T>(
  pathAndQuery: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getSessionStoreConfig();
  if (!config) {
    throw new Error(
      "Brak konfiguracji Supabase. Ustaw SUPABASE_URL i SUPABASE_SECRET_KEY (lub SUPABASE_SERVICE_ROLE_KEY) w Vercel.",
    );
  }

  // New Supabase secret keys (sb_secret_...) are API keys, not JWTs.
  // Sending one as a Bearer token causes HTTP 401; only legacy JWT keys
  // (anon/service_role, typically starting with eyJ) belong in Authorization.
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Content-Type", "application/json");
  // Make it explicit that this request originates from our server backend.
  // Supabase secret keys are rejected when the request looks browser-originated.
  headers.set("User-Agent", "kandex-backend/1.0");
  if (config.key.startsWith("eyJ")) {
    headers.set("Authorization", `Bearer ${config.key}`);
  } else {
    headers.delete("Authorization");
  }

  const response = await fetch(
    `${config.url}/rest/v1/${pathAndQuery}`,
    {
      ...init,
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("[eduvulcan] Supabase session store request failed", {
      status: response.status,
      details: details.slice(0, 500),
    });
    throw new Error(
      `Magazyn sesji Supabase zwrócił HTTP ${response.status}. Sprawdź konfigurację klucza i tabeli.`,
    );
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function saveSession(session: MobileSession) {
  if (getSessionStoreConfig()) {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + SESSION_TTL_SECONDS * 1000,
    ).toISOString();

    await supabaseRequest<unknown>(
      `${SESSION_TABLE}?on_conflict=session_id`,
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          session_id: session.id,
          payload: session,
          expires_at: expiresAt,
          created_at: session.createdAt,
        }),
      },
    );
    return;
  }

  if (process.env.VERCEL === "1") {
    throw new Error(
      "Brak konfiguracji Supabase. Ustaw SUPABASE_URL i SUPABASE_SECRET_KEY (lub SUPABASE_SERVICE_ROLE_KEY) w środowisku Vercel.",
    );
  }

  await mkdir(DATA_DIR, { recursive: true });
  let sessions: Record<string, MobileSession> = {};
  try {
    sessions = JSON.parse(await readFile(SESSIONS_FILE, "utf8")) as Record<string, MobileSession>;
  } catch {
    // A missing local development file starts with an empty session map.
  }
  sessions[session.id] = session;
  await writeFile(SESSIONS_FILE, JSON.stringify(sessions), "utf8");
}

export async function getMobileSession(id: string) {
  if (getSessionStoreConfig()) {
    const query = new URLSearchParams({
      select: "payload",
      session_id: `eq.${id}`,
      expires_at: `gt.${new Date().toISOString()}`,
      limit: "1",
    });

    const rows = await supabaseRequest<Array<{ payload: MobileSession }>>(
      `${SESSION_TABLE}?${query.toString()}`,
      { method: "GET" },
    );
    return rows[0]?.payload ?? null;
  }

  if (process.env.VERCEL === "1") {
    throw new Error(
      "Brak konfiguracji Supabase. Ustaw SUPABASE_URL i SUPABASE_SECRET_KEY (lub SUPABASE_SERVICE_ROLE_KEY) w środowisku Vercel.",
    );
  }

  try {
    const sessions = JSON.parse(await readFile(SESSIONS_FILE, "utf8")) as Record<string, MobileSession>;
    return sessions[id] ?? null;
  } catch {
    return null;
  }
}

export async function deleteMobileSession(id: string) {
  if (!id) return;

  if (getSessionStoreConfig()) {
    const query = new URLSearchParams({ session_id: `eq.${id}` });
    await supabaseRequest<unknown>(`${SESSION_TABLE}?${query.toString()}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    return;
  }

  if (process.env.VERCEL === "1") {
    throw new Error("Brak konfiguracji Supabase dla unieważnienia sesji.");
  }

  try {
    const sessions = JSON.parse(
      await readFile(SESSIONS_FILE, "utf8"),
    ) as Record<string, MobileSession>;
    if (sessions[id]) {
      delete sessions[id];
      await writeFile(SESSIONS_FILE, JSON.stringify(sessions), "utf8");
    }
  } catch {
    // A missing local session file means there is no local session to remove.
  }
}

function parseApiAp(apiApHtml: string): ApiApPayload {
  const value = load(apiApHtml)("input[id='ap']").attr("value");
  if (!value) throw new Error("Nie znaleziono danych #ap w odpowiedzi EduVULCAN.");

  let payload: ApiApPayload;
  try {
    payload = JSON.parse(value) as ApiApPayload;
  } catch {
    throw new Error("Nie udało się odczytać danych uwierzytelniających EduVULCAN.");
  }

  if (!payload.Success) {
    throw new Error(payload.ErrorMessage ?? "EduVULCAN odrzucił logowanie.");
  }
  if (!payload.IsConsentAccepted) {
    throw new Error("EduVULCAN wymaga zaakceptowania wymaganych zgód na stronie konta.");
  }
  if (!payload.Tokens?.length) {
    throw new Error("EduVULCAN nie zwrócił tokenu ucznia.");
  }

  return payload;
}

export async function connectWithMobileApiAp(
  apiApHtml: string,
  account?: { fullName?: string; studentId?: number },
) {
  console.info("[eduvulcan] runtime", {
    node: process.version,
    openssl: process.versions.openssl,
  });

  const ap = parseApiAp(apiApHtml);
  const keypair = await step(
    "new Keypair",
    async () => (await new Keypair().init()) as unknown as MobileKeypair,
  );

  const registration = new VulcanJwtRegister(keypair, apiApHtml, false);
  const registered = await step("registration.init", () => registration.init());
  const restUrl = registered[0]?.RestURL;
  if (!restUrl) throw new Error("EduVULCAN nie zwrócił adresu REST API.");

  const restManager = new RestUrlManager();
  await step("restUrls", () => restManager.setRestUrls([restUrl]));

  const api = await step(
    "construct VulcanHebeCe",
    async () => new VulcanHebeCe(keypair),
  );
  await step("api.connect", () => api.connect());

  const students = await api.listStudents();
  if (!students.length) throw new Error("Nie znaleziono ucznia na tym koncie.");

  const requestedStudent = account?.studentId;
  await api.selectStudent(requestedStudent ?? students[0].PupilId);

  const selected = api.selectedStudent as MobileStudent;
  const fullName =
    account?.fullName?.trim() ||
    (ap.GivenName || ap.Surname
      ? `${ap.GivenName ?? ""} ${ap.Surname ?? ""}`.trim()
      : `${selected.FirstName} ${selected.LastName}`.trim());

  const session: MobileSession = {
    id: randomUUID(),
    keypair,
    restUrl,
    student: selected,
    account: {
      fullName,
      studentId: selected.PupilId,
    },
    createdAt: new Date().toISOString(),
  };

  await saveSession(session);
  return session;
}

export async function connectWithMobileJwt(jwtToken: string) {
  const token = jwtToken.trim();
  if (!token) throw new Error("Brak tokenu JWT.");

  const decoded = decodeJwt(token) as { tenant?: string; name?: string };
  if (!decoded.tenant) {
    throw new Error("Token nie zawiera tenant. Użyj tokenu eduVULCAN z /api/ap.");
  }

  const apJson = JSON.stringify({
    Tokens: [token],
    Alias: "",
    Email: "",
    EmailCandidate: null,
    GivenName: "",
    Surname: "",
    IsConsentAccepted: true,
    CanAcceptConsent: false,
    AccessToken: token,
    Capabilities: [],
    Success: true,
    ErrorMessage: null,
  });
  const escaped = apJson.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const apHtml = `<input id="ap" value="${escaped}" />`;

  return connectWithMobileApiAp(apHtml, { fullName: decoded.name });
}

function parseGradeValue(raw: string | number | null | undefined): number {
  const normalized = String(raw ?? "").trim().replace(",", ".");
  const match = normalized.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

export async function fetchMobileGrades(sessionId: string) {
  const session = await getMobileSession(sessionId);
  if (!session) throw new Error("SESSION_EXPIRED");

  const restManager = new RestUrlManager();
  await restManager.setRestUrls([session.restUrl]);

  const api = new VulcanHebeCe(session.keypair);
  await api.connect();
  await api.selectStudent(session.student.PupilId);

  // Pobieramy oceny niezależnie, aby błąd kalendarza lub frekwencji
  // nie blokował widoku ocen.
  const response = await api.getGrades();
  const rows = response.Envelope ?? [];

  return rows.flatMap((grade: MobileGrade) => {
    const value = parseGradeValue(grade.Value);
    if (!Number.isFinite(value)) return [];

    return [{
      id: String(grade.Id),
      subject: grade.Column?.Subject?.Name ?? "Inne",
      subjectId: String(grade.Column?.Subject?.Id ?? grade.Column?.Subject?.Name ?? "Inne"),
      value,
      date: (dateFromTimestamp(grade.DateCreated?.Timestamp) ?? new Date()).toISOString(),
      weight: Number(grade.Column?.Weight ?? 1),
      teacher: grade.Creator?.DisplayName ?? "",
      title: grade.Column?.Name ?? "Ocena",
    }];
  });
}

export async function fetchMobileSnapshot(sessionId: string) {
  const session = await getMobileSession(sessionId);
  if (!session) throw new Error("Sesja mobilna nie istnieje lub wygasła.");

  const restManager = new RestUrlManager();
  await restManager.setRestUrls([session.restUrl]);

  const api = new VulcanHebeCe(session.keypair);
  await api.connect();
  await api.selectStudent(session.student.PupilId);

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 7);
  const to = new Date(today);
  to.setDate(today.getDate() + 35);

  // Każdy obszar pobieramy niezależnie. Awaria kalendarza, zadań lub
  // frekwencji nie może wyłączyć całego widoku danych dziennika.
  const [grades, lessons, homework, attendance] = await Promise.all([
    api.getGrades().catch((error: unknown) => {
      console.error("[eduvulcan] snapshot grades failed", error instanceof Error ? error.message : "Unknown error");
      return null;
    }),
    api.getLessons(from, to).catch((error: unknown) => {
      console.error("[eduvulcan] snapshot timetable failed", error instanceof Error ? error.message : "Unknown error");
      return null;
    }),
    api.getHomework(from, to).catch((error: unknown) => {
      console.error("[eduvulcan] snapshot homework failed", error instanceof Error ? error.message : "Unknown error");
      return null;
    }),
    api.getAttendance(from, to).catch((error: unknown) => {
      console.error("[eduvulcan] snapshot attendance failed", error instanceof Error ? error.message : "Unknown error");
      return null;
    }),
  ]);

  const gradeRows = grades?.Envelope ?? [];
  const lessonRows = lessons?.Envelope ?? [];
  const homeworkRows = homework?.Envelope ?? [];
  const attendanceRows = attendance?.Envelope ?? [];

  const subjectMap = new Map<string, { id: string; name: string; values: number[]; count: number }>();
  const normalizedGrades = gradeRows.flatMap((grade: MobileGrade) => {
    const subject = grade.Column?.Subject?.Name ?? "Inne";
    const value = parseGradeValue(grade.Value);
    if (!Number.isFinite(value)) return [];

    const key = String(grade.Column?.Subject?.Id ?? subject);
    const current = subjectMap.get(key) ?? { id: key, name: subject, values: [] as number[], count: 0 };
    current.values.push(value);
    current.count += 1;
    subjectMap.set(key, current);

    return [{
      id: String(grade.Id),
      subject,
      value,
      date: new Date(grade.DateCreated?.Timestamp ?? Date.now()).toISOString(),
      weight: Number(grade.Column?.Weight ?? 1),
      teacher: grade.Creator?.DisplayName,
      title: grade.Column?.Name,
    }];
  });

  return {
    provider: "eduvulcan" as const,
    importedAt: new Date().toISOString(),
    student: {
      id: String(session.student.PupilId),
      fullName: `${session.student.FirstName} ${session.student.LastName}`.trim(),
      className: session.student.Pupil?.ClassDisplay,
      schoolName: session.student.Pupil?.ConstituentUnit?.Name ?? session.student.Pupil?.Unit?.Name,
    },
    subjects: [...subjectMap.values()].map((subject) => ({
      id: subject.id,
      name: subject.name,
      average: subject.values.reduce((sum, value) => sum + value, 0) / subject.values.length,
      gradeCount: subject.count,
    })),
    grades: normalizedGrades,
    schedule: lessonRows.flatMap((lesson: MobileLesson) => {
      const start = lessonStartDate(lesson);
      if (!start) {
        console.warn("[eduvulcan] skipped lesson with invalid date", { lessonId: String(lesson.Id) });
        return [];
      }
      return [{
        id: String(lesson.Id),
        subject: lesson.Subject?.Name ?? "Lekcja",
        teacher: lesson.TeacherPrimary?.DisplayName,
        room: lesson.Room?.Code,
        startsAt: start.toISOString(),
        endsAt: lessonEndDate(lesson, start),
      }];
    }),
    assignments: homeworkRows.map((item: MobileHomework) => ({
      id: String(item.Id),
      title: item.Content ?? "Zadanie",
      subject: item.Subject?.Name,
      dueDate: dateFromTimestamp(item.Deadline?.Timestamp)?.toISOString(),
      completed: false,
    })),
    attendance: attendanceRows.map((item: MobileAttendance) => {
      const presence = item.PresenceType;
      let status: "present" | "absent" | "late" | "excused" | "unknown" = "unknown";
      if (presence?.AbsenceJustified) status = "excused";
      else if (presence?.Late) status = "late";
      else if (presence?.Absence) status = "absent";
      else if (presence?.Presence) status = "present";

      return {
        date:
          dateFromTimestamp(item.Day?.Timestamp)?.toISOString().slice(0, 10) ??
          parseCalendarDate(item.Day?.Date) ??
          "",
        lesson: Number(item.LessonNumber ?? 0),
        subject: item.Subject?.Name ?? "Lekcja",
        status,
      };
    }),
  };
}
