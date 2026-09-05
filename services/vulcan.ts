// Vulcan (eduVULCAN / UONET+) integration service.
//
// This module wraps the official `vulcan-api-js` SDK so the rest of the app
// can call plain async functions without knowing about keystores, RSA
// certificates, or the underlying REST endpoints.
//
// The login flow is intentionally three-step from the user's perspective:
//   1. The user opens the modal and enters their eduVULCAN security token
//      plus the school symbol required by the mobile device registration API.
//      The backend validates the security token against Vulcan's routing table.
//   2. eduVULCAN sends a 4-digit PIN to the phone number linked to the
//      account. The user enters it in the modal. The backend uses it to
//      register the device (RSA key pair + Firebase token).
//   3. For parent accounts, the backend returns a list of students and
//      the modal asks the user to pick one.
//
// The resulting session (account + student + VulcanHebe) is stored in an
// in-memory cache keyed by a random session id, and that session id is
// the value of the `vulcan_token` httpOnly cookie. The cookie itself is
// the only thing the browser ever sees.

// `vulcan-api-js` declares a `getBaseUrl` helper in its .d.ts but
// doesn't actually re-export it from the bundle. Looking at the SDK
// source reveals what it really does:
//   1. Download `http://komponenty.vulcan.net.pl/UonetPlusMobile/RoutingRules.txt`
//      - a flat text file with one `<prefix>,<restUrl>` per line.
//   2. Take the first 3 characters of the user's security token.
//   3. Look up the prefix in the table to get the school's REST URL.
// The "token" the SDK takes is therefore the *application security
// token* minted by eduVULCAN for a logged-in account (the same one
// you see in the mobile app's settings), NOT the school subdomain.
import fs from "node:fs";
import path from "node:path";
import {
  Keystore,
  Account,
  VulcanHebe,
  registerAccount as sdkRegisterAccount,
  type Student,
} from "vulcan-api-js";

// Memoize the routing table so we don't hit komponenty.vulcan.net.pl
// on every login. The file is updated server-side when new schools
// come online, but the cadence is slow (weeks/months) so a 1h TTL
// is more than enough.
let routingTable: { expiresAt: number; map: Map<string, string> } | null = null;
const ROUTING_TTL_MS = 60 * 60 * 1000;

async function loadRoutingTable(): Promise<Map<string, string>> {
  if (routingTable && routingTable.expiresAt > Date.now()) {
    return routingTable.map;
  }
  const res = await fetch(
    "http://komponenty.vulcan.net.pl/UonetPlusMobile/RoutingRules.txt",
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(
      `Nie udało się pobrać tablicy routingu (HTTP ${res.status}).`
    );
  }
  const text = await res.text();
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const comma = trimmed.indexOf(",");
    if (comma < 0) continue;
    const prefix = trimmed.slice(0, comma).trim().toUpperCase();
    const url = trimmed.slice(comma + 1).trim();
    if (prefix && url) map.set(prefix, url);
  }
  routingTable = { expiresAt: Date.now() + ROUTING_TTL_MS, map };
  return map;
}

/**
 * Resolve a school's REST URL from the user's security token. The
 * token is what eduVULCAN's mobile app (Dzienniczek+, HEBE) stores
 * locally after the user logs in - the same value is visible in the
 * app's settings under "Token bezpieczeństwa".
 *
 * The first 3 characters of the token are the routing prefix.
 */
async function sdkGetBaseUrl(securityToken: string): Promise<string> {
  const cleaned = securityToken.trim().toUpperCase();
  if (cleaned.length < 3) {
    throw new Error("Token bezpieczeństwa jest za krótki.");
  }
  const prefix = cleaned.slice(0, 3);
  const table = await loadRoutingTable();
  const url = table.get(prefix);
  if (!url) {
    throw new Error(
      `Nieznany prefix "${prefix}". Sprawdź token bezpieczeństwa.`
    );
  }
  return url;
}

// ---------------------------------------------------------------------------
// Public types - re-used by route handlers and the React client
// ---------------------------------------------------------------------------

export type VulcanStudent = {
  id: number;
  fullName: string;
  className: string;
  schoolName: string;
};

export type VulcanAccount = {
  fullName: string;
  studentId?: number;
};

export type VulcanLoginStep1Response = {
  // Parent accounts have to pick a student.
  requiresStudentSelection: boolean;
  // Opaque session token - required for step 2 (PIN) and step 3 (student).
  pendingToken?: string;
  students?: VulcanStudent[];
  // Single-student accounts skip student selection.
  success?: boolean;
  token?: string;
  account?: VulcanAccount;
  error?: string;
};

export type VulcanLoginStep2Response = {
  success: boolean;
  requiresStudentSelection?: boolean;
  pendingToken?: string;
  students?: VulcanStudent[];
  token?: string;
  account?: VulcanAccount;
  error?: string;
};

// ---------------------------------------------------------------------------
// Session store - keyed by the random session id stored in the cookie
// ---------------------------------------------------------------------------

type CachedSession = {
  // Step 1 state (security token resolved).
  schoolSymbol: string;
  securityToken: string;
  expiresAt: number;
  // The Keystore that was generated during step 2 - it owns the RSA
  // private key and Firebase token needed by the SDK for every call.
  // We keep it in memory keyed by the session id. In production you'd
  // persist it encrypted, but for a dev demo the in-memory map is fine.
  keystore?: Keystore;
  // After registerAccount (step 2).
  account?: Account;
  // After student selection (step 3).
  student?: Student;
  // Final VulcanHebe instance - lazily created on first use.
  hebe?: VulcanHebe;
  // Snapshot import from exported HTML pages in the dziennik UI.
  imported?: {
    students: VulcanStudent[];
    events: VulcanCalendarEvent[];
    summaries: VulcanGradeSummary[];
  };
};

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_FILE = path.join(process.cwd(), ".data", "vulcan-sessions.json");
const sessions = new Map<string, CachedSession>();

function ensureSessionStore(): void {
  const dir = path.dirname(SESSION_FILE);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SESSION_FILE)) {
    fs.writeFileSync(SESSION_FILE, JSON.stringify({}), "utf8");
  }
}

function persistSessionStore(): void {
  ensureSessionStore();
  const serializable = Object.fromEntries(
    Array.from(sessions.entries()).map(([key, value]) => {
      const { keystore: _keystore, hebe: _hebe, ...rest } = value as CachedSession & {
        keystore?: unknown;
        hebe?: unknown;
      };
      return [key, rest];
    })
  );
  fs.writeFileSync(SESSION_FILE, JSON.stringify(serializable, null, 2), "utf8");
}

function loadSessionStore(): void {
  ensureSessionStore();
  try {
    const raw = fs.readFileSync(SESSION_FILE, "utf8");
    if (!raw.trim()) return;
    const parsed = JSON.parse(raw) as Record<string, Partial<CachedSession>>;
    for (const [key, value] of Object.entries(parsed)) {
      if (!value) continue;
      sessions.set(key, {
        schoolSymbol: value.schoolSymbol ?? "",
        securityToken: value.securityToken ?? "",
        expiresAt: Number(value.expiresAt ?? Date.now() + SESSION_TTL_MS),
        account: value.account,
        student: value.student,
        imported: value.imported,
      });
    }
  } catch {
    // Ignore invalid or partially-written session files and start from an empty map.
  }
}

loadSessionStore();

function newSessionId(): string {
  // 24 random bytes hex-encoded - more than enough entropy for a session id.
  const bytes = new Uint8Array(24);
  // `globalThis.crypto` is available on both Node 19+ and the Edge runtime
  // used by Next.js route handlers, so we don't need to import `node:crypto`.
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createSession(): string {
  loadSessionStore();
  const id = newSessionId();
  const now = Date.now();
  sessions.set(id, {
    schoolSymbol: "",
    securityToken: "",
    expiresAt: now + SESSION_TTL_MS,
  });
  persistSessionStore();
  return id;
}

export function getSession(id: string): CachedSession | undefined {
  loadSessionStore();
  const current = sessions.get(id);
  if (!current) return undefined;
  if (current.expiresAt <= Date.now()) {
    sessions.delete(id);
    persistSessionStore();
    return undefined;
  }
  return current;
}

export function setSession(
  id: string,
  patch: Partial<CachedSession>
): CachedSession | undefined {
  loadSessionStore();
  const current = getSession(id);
  if (!current) return undefined;
  const next = {
    ...current,
    ...patch,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(id, next);
  persistSessionStore();
  return next;
}

export function deleteSession(id: string) {
  loadSessionStore();
  sessions.delete(id);
  persistSessionStore();
}

// ---------------------------------------------------------------------------
// Step 1 - security token + school symbol
// ---------------------------------------------------------------------------

/**
 * Validates the security token against Vulcan's routing table and stores
 * the school symbol used by the mobile device registration endpoint.
 */
export async function loginStep1(
  securityToken: string,
  schoolSymbol: string
): Promise<VulcanLoginStep1Response> {
  const cleanedToken = securityToken.trim().toUpperCase();
  if (cleanedToken.length < 3) {
    return {
      requiresStudentSelection: false,
      error: "Podaj poprawny token bezpieczeństwa z eduVULCAN.",
    };
  }

  const cleanedSymbol = schoolSymbol.trim().toLowerCase();
  if (!cleanedSymbol) {
    return {
      requiresStudentSelection: false,
      error: "Podaj symbol szkoły/jednostki, np. olsztyn.",
    };
  }

  if (!/^[a-z0-9_-]+$/.test(cleanedSymbol)) {
    return {
      requiresStudentSelection: false,
      error: "Symbol szkoły może zawierać tylko litery, cyfry, _ oraz -.",
    };
  }

  try {
    await sdkGetBaseUrl(cleanedToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return {
      requiresStudentSelection: false,
      error: `Nie udało się zweryfikować tokena bezpieczeństwa: ${message}`,
    };
  }

  const sessionId = createSession();
  setSession(sessionId, {
    schoolSymbol: cleanedSymbol,
    securityToken: cleanedToken,
  });

  // We can't tell single-student vs parent accounts from the SDK alone -
  // we have to register the device first (step 2 with PIN) and then call
  // getStudents(). So step 1 always returns success: true with a pending
  // session id. The UI then asks for the PIN.
  return {
    requiresStudentSelection: false,
    success: true,
    pendingToken: sessionId,
  };
}

// ---------------------------------------------------------------------------
// Step 2 - PIN (device registration) + (optional) student selection
// ---------------------------------------------------------------------------

export async function loginStep2(
  pendingToken: string,
  pin: string
): Promise<VulcanLoginStep2Response> {
  const session = getSession(pendingToken);
  if (!session) {
    return { success: false, error: "Sesja wygasła. Zaloguj się ponownie." };
  }

  if (!/^\d{4}$/.test(pin)) {
    return {
      success: false,
      error: "PIN musi składać się z 4 cyfr.",
    };
  }

  // 1. Generate a new keystore (RSA key pair + Firebase token).
  const keystore = new Keystore();
  try {
    await keystore.init();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return {
      success: false,
      error: `Nie udało się zainicjować urządzenia: ${message}`,
    };
  }

  // 2. Register the device with Vulcan using the PIN.
  let account: Account;
  try {
    account = await sdkRegisterAccount(
      keystore,
      session.securityToken,
      session.schoolSymbol,
      pin
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return {
      success: false,
      error: `Nie udało się zarejestrować urządzenia: ${message}`,
    };
  }

  // 3. Persist the keystore + account on the session so subsequent
  //    calls don't have to repeat the PIN flow.
  setSession(pendingToken, { keystore, account });

  // 4. Fetch the list of students. Parents will get more than one.
  const hebe = new VulcanHebe(keystore, account);
  let students: Student[];
  try {
    students = await hebe.getStudents();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return {
      success: false,
      error: `Nie udało się pobrać listy uczniów: ${message}`,
    };
  }

  if (students.length === 0) {
    return {
      success: false,
      error: "Nie znaleziono uczniów przypisanych do tego konta.",
    };
  }

  // 5. Single-student account: log them in immediately and persist the
  //    VulcanHebe instance for later use.
  if (students.length === 1) {
    await hebe.selectStudent(students[0]);
    setSession(pendingToken, { student: students[0], hebe });
    return {
      success: true,
      token: pendingToken,
      account: mapAccount(students[0], account),
    };
  }

  // 6. Parent account: hand the student list back to the UI.
  return {
    success: false, // not "logged in" yet, still need step 3
    requiresStudentSelection: true,
    pendingToken,
    students: students.map(mapStudentForUi),
  };
}

// ---------------------------------------------------------------------------
// Step 3 - parent account: pick a student
// ---------------------------------------------------------------------------

export async function loginStep3(
  pendingToken: string,
  studentId: number
): Promise<VulcanLoginStep2Response> {
  const session = getSession(pendingToken);
  if (!session || !session.account || !session.keystore) {
    return { success: false, error: "Sesja wygasła. Zaloguj się ponownie." };
  }

  // Reuse the keystore + account we already have from step 2.
  const hebe = new VulcanHebe(session.keystore, session.account);
  let students: Student[];
  try {
    students = await hebe.getStudents();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return {
      success: false,
      error: `Nie udało się pobrać listy uczniów: ${message}`,
    };
  }

  const student = students.find(
    (s) => Number(s.pupil.id) === Number(studentId)
  );
  if (!student) {
    return { success: false, error: "Wybrany uczeń nie został znaleziony." };
  }

  await hebe.selectStudent(student);
  setSession(pendingToken, { student, hebe });

  return {
    success: true,
    token: pendingToken,
    account: mapAccount(student, session.account),
  };
}

// ---------------------------------------------------------------------------
// Data fetchers - called by /api/vulcan/events and /api/vulcan/grades
// ---------------------------------------------------------------------------

export type VulcanCalendarEvent = {
  id: string;
  title: string;
  description?: string;
  type: "assignment" | "test" | "exam" | "grade" | "note" | "event";
  subject?: string;
  date: string; // ISO 8601
  dueDate?: string;
  completed: boolean;
  priority: "low" | "normal" | "high";
};

export type VulcanGradeSummary = {
  subject: string;
  average: number;
  count: number;
  grades: Array<{
    id: string;
    subject: string;
    title: string;
    value: number;
    weight: number;
    teacher: string;
    date: string; // ISO 8601
    comment?: string;
  }>;
};

/**
 * Returns the student's calendar events: exams, homework, and the next
 * 60 days of lessons. Lessons are filtered to only show ones with
 * subject info (i.e. actual classes, not free periods).
 */
export async function fetchVulcanEvents(
  sessionId: string
): Promise<VulcanCalendarEvent[]> {
  const session = getSession(sessionId);
  if (session?.imported?.events) {
    return session.imported.events;
  }

  const hebe = await ensureHebe(sessionId);
  if (!hebe) throw new Error("Nie udało się odtworzyć sesji.");

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  // 60-day window covers the current month plus a bit of context on
  // either side, which is what the calendar UI needs.
  const to = new Date(from.getTime() + 60 * 86400000);

  const [examsResult, homeworkResult, lessonsResult] = await Promise.allSettled([
    hebe.getExams(),
    hebe.getHomework(),
    hebe.getLessons(from, to),
  ]);

  const exams = examsResult.status === "fulfilled" ? examsResult.value : [];
  const homework =
    homeworkResult.status === "fulfilled" ? homeworkResult.value : [];
  const lessons = lessonsResult.status === "fulfilled" ? lessonsResult.value : [];

  if (examsResult.status === "rejected") {
    console.error("fetchVulcanEvents: getExams failed", examsResult.reason);
  }
  if (homeworkResult.status === "rejected") {
    console.error("fetchVulcanEvents: getHomework failed", homeworkResult.reason);
  }
  if (lessonsResult.status === "rejected") {
    console.error("fetchVulcanEvents: getLessons failed", lessonsResult.reason);
  }

  const events: VulcanCalendarEvent[] = [];

  // Exams -> "exam" events
  for (const e of exams) {
    const deadline = toDate(e.deadline);
    if (!deadline) continue;
    events.push({
      id: `exam-${e.id}`,
      title: e.topic || "Egzamin",
      description: e.subject?.name,
      type: "exam",
      subject: e.subject?.name,
      date: deadline.toISOString(),
      dueDate: deadline.toISOString(),
      completed: false,
      priority: "high",
    });
  }

  // Homework -> "assignment" events. Some homework is already past its
  // deadline; we still show it so the user can see what they missed.
  for (const h of homework) {
    const deadline = toDate(h.deadline);
    if (!deadline) continue;
    events.push({
      id: `hw-${h.id}`,
      title: h.content || "Zadanie domowe",
      description: h.subject?.name,
      type: "assignment",
      subject: h.subject?.name,
      date: deadline.toISOString(),
      dueDate: deadline.toISOString(),
      completed: Boolean(h.answerDate),
      priority: "normal",
    });
  }

  // Lessons -> "event" markers. We only keep the ones with a real
  // subject to keep the calendar readable.
  for (const l of lessons) {
    const when = toDate(l.date);
    if (!when) continue;
    if (!l.subject?.name) continue;
    events.push({
      id: `lesson-${l.id ?? `${when.getTime()}-${l.subject.id}`}`,
      title: l.subject.name,
      description: l.teacherPrimary
        ? l.teacherPrimary.displayName
        : undefined,
      type: "event",
      subject: l.subject.name,
      date: when.toISOString(),
      completed: false,
      priority: "low",
    });
  }

  // Sort by date ascending - the UI expects chronological order.
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

/**
 * Returns the student's grade book, aggregated per subject.
 */
export async function fetchVulcanGrades(
  sessionId: string
): Promise<VulcanGradeSummary[]> {
  const session = getSession(sessionId);
  if (session?.imported?.summaries) {
    return session.imported.summaries;
  }

  const hebe = await ensureHebe(sessionId);
  if (!hebe) throw new Error("Nie udało się odtworzyć sesji.");

  type GradeLike = {
    id?: string | number;
    value?: number | string | null;
    column?: {
      subject?: { name?: string };
      name?: string;
      weight?: number;
    };
    creator?: { displayName?: string };
    modifier?: { displayName?: string };
    content?: string;
    comment?: string;
    dateCreated?: unknown;
  };

  // `lastSync = new Date(0)` -> fetch all grades, not just deltas.
  let grades: GradeLike[] = [];
  try {
    grades = await hebe.getGrades(new Date(0));
  } catch (err) {
    console.error("fetchVulcanGrades: getGrades failed", err);
    return [];
  }

  // Group by subject, computing a weighted average (Vulcan's columns
  // already carry a weight: 1, 2, 3...).
  type Bucket = {
    subject: string;
    total: number;
    weightSum: number;
    count: number;
    items: Array<{
      id: string;
      subject: string;
      title: string;
      value: number;
      weight: number;
      teacher: string;
      date: string;
      comment?: string;
    }>;
  };

  const bySubject = new Map<string, Bucket>();

  for (const g of grades) {
    const subjectName = g.column?.subject?.name ?? "Nieznany przedmiot";
    const value = typeof g.value === "number" ? g.value : null;
    if (value === null) continue; // skip "+/-", "nieklasyfikacja" etc.
    const weight = typeof g.column?.weight === "number" && g.column.weight > 0
      ? g.column.weight
      : 1;
    const teacherName = g.creator?.displayName
      ?? g.modifier?.displayName
      ?? "—";
    const date = toDate(g.dateCreated) ?? new Date();
    const title = g.column?.name ?? g.content ?? "Ocena";

    const item = {
      id: `grade-${g.id}`,
      subject: subjectName,
      title,
      value,
      weight,
      teacher: teacherName,
      date: date.toISOString(),
      comment: g.comment,
    };

    const bucket = bySubject.get(subjectName) ?? {
      subject: subjectName,
      total: 0,
      weightSum: 0,
      count: 0,
      items: [],
    };
    bucket.total += value * weight;
    bucket.weightSum += weight;
    bucket.count += 1;
    bucket.items.push(item);
    bySubject.set(subjectName, bucket);
  }

  // Materialize the map into a sorted array. Sorted by average descending
  // - the UI likes best subjects on top.
  const summaries: VulcanGradeSummary[] = Array.from(bySubject.values())
    .map((b) => ({
      subject: b.subject,
      average: b.weightSum > 0 ? b.total / b.weightSum : 0,
      count: b.count,
      grades: b.items.sort((x, y) => y.date.localeCompare(x.date)),
    }))
    .sort((a, b) => b.average - a.average);

  return summaries;
}

// ---------------------------------------------------------------------------
// Backwards-compat shim - the old `fetchVulcanData` endpoint is still wired
// to /api/vulcan/data and is kept as a no-op for callers that may still
// hit it (e.g. third-party widgets). New code should not use it.
// ---------------------------------------------------------------------------

export type VulcanDataResponse = {
  url: string;
  data: unknown;
}[];

export async function fetchVulcanData(
  sessionId: string
): Promise<VulcanDataResponse> {
  void sessionId;
  return [];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the VulcanHebe instance for a session, lazily creating one from
 * the persisted Keystore + Account when needed.
 */
async function ensureHebe(sessionId: string): Promise<VulcanHebe | null> {
  const session = getSession(sessionId);
  if (!session) return null;
  if (session.hebe) return session.hebe;
  if (!session.keystore || !session.account) return null;

  const hebe = new VulcanHebe(session.keystore, session.account);

  if (session.student) {
    try {
      await hebe.selectStudent(session.student);
    } catch (err) {
      console.warn("ensureHebe: selectStudent failed", err);
    }
  }

  setSession(sessionId, { hebe });
  return hebe;
}

/**
 * Convert a `DateTime` (or `Date`, or `null`/`undefined`) from the SDK
 * into a JS `Date` we can serialize. Returns `null` for missing data.
 */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // Vulcan's DateTime has a `timestamp` field (epoch millis) and a
  // `date` field (ISO yyyy-mm-dd). Prefer the timestamp when present.
  if (typeof value === "object" && value !== null) {
    const v = value as { timestamp?: number; date?: string };
    if (typeof v.timestamp === "number" && v.timestamp > 0) {
      return new Date(v.timestamp);
    }
    if (typeof v.date === "string" && v.date) {
      const d = new Date(v.date);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "number") {
    return new Date(value);
  }
  return null;
}

function mapAccount(student: Student, account: Account): VulcanAccount {
  return {
    fullName: student.pupil
      ? `${student.pupil.firstName ?? ""} ${student.pupil.surname ?? ""}`.trim() ||
        account.userName ||
        account.userLogin
      : account.userName || account.userLogin,
    studentId: Number(student.pupil.id),
  };
}

function mapStudentForUi(s: Student): VulcanStudent {
  const fullName = s.pupil
    ? `${s.pupil.firstName ?? ""} ${s.pupil.surname ?? ""}`.trim()
    : "Uczeń";
  const className = s.unit?.short || s.unit?.displayName || s.unit?.name || "—";
  const schoolName = s.school?.short || s.school?.name || "—";
  return {
    id: Number(s.pupil.id),
    fullName: fullName || "Uczeń",
    className,
    schoolName,
  };
}
