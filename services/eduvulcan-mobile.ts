import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { decodeJwt } from "jose";
import { Keypair, RestUrlManager, VulcanHebeCe, VulcanJwtRegister } from "hebece";

const DATA_DIR = path.join(process.cwd(), ".data");
const SESSIONS_FILE = path.join(DATA_DIR, "eduvulcan-mobile-sessions.json");

type MobileSession = {
  id: string;
  keypair: { fingerprint: string; privateKey: string; certificate: string };
  restUrl: string;
  student: any;
  account: { fullName: string; studentId?: number };
  createdAt: string;
};

async function readSessions(): Promise<Record<string, MobileSession>> {
  try {
    return JSON.parse(await readFile(SESSIONS_FILE, "utf8")) as Record<string, MobileSession>;
  } catch {
    return {};
  }
}

async function saveSession(session: MobileSession) {
  await mkdir(DATA_DIR, { recursive: true });
  const sessions = await readSessions();
  sessions[session.id] = session;
  await writeFile(SESSIONS_FILE, JSON.stringify(sessions), "utf8");
}

export async function getMobileSession(id: string) {
  const sessions = await readSessions();
  return sessions[id] ?? null;
}

export async function connectWithMobileJwt(jwtToken: string) {
  const token = jwtToken.trim();
  if (!token) throw new Error("Brak tokenu JWT.");

  const decoded = decodeJwt(token) as { tenant?: string; name?: string };
  if (!decoded.tenant) throw new Error("Token nie zawiera tenant. Użyj tokenu eduVULCAN z /api/ap.");

  const keypair = await new Keypair();
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
  const apHtml = `<input id="ap" value="${apJson.replaceAll("&", "&amp;").replaceAll(""", "&quot;")}" />`;

  const registration = new VulcanJwtRegister(keypair, apHtml, false);
  const registered = await registration.init();
  const restUrl = registered[0]?.RestURL;
  if (!restUrl) throw new Error("EduVULCAN nie zwrócił adresu REST API.");

  const restManager = new RestUrlManager();
  await restManager.setRestUrls([restUrl]);
  const api = new VulcanHebeCe(keypair);
  await api.connect();
  const students = await api.listStudents();
  if (!students.length) throw new Error("Nie znaleziono ucznia na tym koncie.");
  await api.selectStudent(students[0].PupilId);

  const selected = api.selectedStudent;
  const session: MobileSession = {
    id: randomUUID(),
    keypair,
    restUrl,
    student: selected,
    account: {
      fullName: decoded.name ?? `${selected.FirstName} ${selected.LastName}`.trim(),
      studentId: selected.PupilId,
    },
    createdAt: new Date().toISOString(),
  };
  await saveSession(session);
  return session;
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

  const [grades, lessons, homework] = await Promise.all([
    api.getGrades(),
    api.getLessons(from, to),
    api.getHomework(from, to),
  ]);

  const gradeRows = grades.Envelope ?? [];
  const lessonRows = lessons.Envelope ?? [];
  const homeworkRows = homework.Envelope ?? [];

  const subjectMap = new Map<string, { id: string; name: string; values: number[]; count: number }>();
  const normalizedGrades = gradeRows.flatMap((grade: any) => {
    const subject = grade.Column?.Subject?.Name ?? "Inne";
    const value = Number(grade.Value);
    if (!Number.isFinite(value)) return [];
    const key = String(grade.Column?.Subject?.Id ?? subject);
    const current = subjectMap.get(key) ?? { id: key, name: subject, values: [], count: 0 };
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
    schedule: lessonRows.map((lesson: any) => ({
      id: String(lesson.Id),
      subject: lesson.Subject?.Name ?? "Lekcja",
      teacher: lesson.TeacherPrimary?.DisplayName,
      room: lesson.Room?.Code,
      startsAt: new Date(lesson.Date?.Timestamp ?? Date.now()).toISOString(),
      endsAt: lesson.TimeSlot?.End ? new Date(`${lesson.Date?.Date ?? ""}T${lesson.TimeSlot.End}` ).toISOString() : undefined,
    })),
    assignments: homeworkRows.map((item: any) => ({
      id: String(item.Id),
      title: item.Content ?? "Zadanie",
      subject: item.Subject?.Name,
      dueDate: item.Deadline?.Timestamp ? new Date(item.Deadline.Timestamp).toISOString() : undefined,
      completed: false,
    })),
  };
}