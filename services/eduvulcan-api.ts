import { getMobileSession, fetchMobileGrades, fetchMobileSnapshot } from "@/services/eduvulcan-mobile";
import type {
  AttendanceData,
  Grade,
  Lesson,
  Student,
  Subject,
} from "@/src/types/shared";

export const EDUVULCAN_SESSION_COOKIE = "eduvulcan_mobile_session";

type Snapshot = Awaited<ReturnType<typeof fetchMobileSnapshot>>;

function normalizeStudent(student: Snapshot["student"]): Student {
  return {
    id: student?.id ?? "",
    name: student?.fullName?.split(" ")[0] ?? "",
    surname: student?.fullName?.split(" ").slice(1).join(" ") ?? "",
    class: student?.className ?? "",
    school: student?.schoolName ?? "",
  };
}

function requireSession(sessionId: string | undefined) {
  if (!sessionId) throw new Error("SESSION_EXPIRED");
  return getMobileSession(sessionId).then((session) => {
    if (!session) throw new Error("SESSION_EXPIRED");
    return session;
  });
}

export async function getEduVulcanSnapshot(sessionId: string | undefined) {
  await requireSession(sessionId);
  return fetchMobileSnapshot(sessionId!);
}

export async function getEduVulcanStudent(sessionId: string | undefined): Promise<Student> {
  const snapshot = await getEduVulcanSnapshot(sessionId);
  return normalizeStudent(snapshot.student);
}

export async function getEduVulcanGrades(sessionId: string | undefined): Promise<Grade[]> {
  if (!sessionId) throw new Error("SESSION_EXPIRED");
  const rawGrades = await fetchMobileGrades(sessionId);
  return rawGrades.map((grade) => {
    // Raw grade data already contains displayValue and value from fetchMobileGrades
    return {
      id: grade.id,
      subjectId: grade.subjectId,
      subjectName: grade.subject ?? "Inne",
      displayValue: grade.displayValue ?? String(grade.value ?? ""),
      value: Number.isFinite(grade.value) ? grade.value : NaN,
      type: grade.title ?? "Ocena",
      date: grade.date,
      weight: Number(grade.weight ?? 1),
    };
  }).filter((grade) => Number.isFinite(grade.value)); // Filter out invalid grades
}

export async function getEduVulcanAttendance(sessionId: string | undefined): Promise<AttendanceData> {
  const snapshot = await getEduVulcanSnapshot(sessionId);
  if (!snapshot.syncStatus.attendance) {
    throw new Error(snapshot.syncErrors?.attendance ?? "EduVULCAN nie zwrócił danych frekwencji.");
  }
  const entries = snapshot.attendance ?? [];
  return {
    summary: {
      present: entries.filter((entry) => entry.status === "present").length,
      absent: entries.filter((entry) => entry.status === "absent").length,
      late: entries.filter((entry) => entry.status === "late").length,
      excused: entries.filter((entry) => entry.status === "excused").length,
      unknown: entries.filter((entry) => entry.status === "unknown").length,
    },
    entries,
  };
}

export async function getEduVulcanTimetable(sessionId: string | undefined): Promise<Lesson[]> {
  const snapshot = await getEduVulcanSnapshot(sessionId);
  if (!snapshot.syncStatus.lessons) {
    throw new Error(snapshot.syncErrors?.lessons ?? "EduVULCAN nie zwrócił planu lekcji.");
  }
  return snapshot.schedule.map((lesson) => ({
    date: lesson.date,
    lessonNumber: lesson.lessonNumber,
    start: lesson.startTime,
    end: lesson.endTime,
    subject: lesson.subject,
    teacher: lesson.teacher ?? "",
    room: lesson.room ?? "",
  }));
}

export async function getEduVulcanSubjects(sessionId: string | undefined): Promise<Subject[]> {
  const snapshot = await getEduVulcanSnapshot(sessionId);
  return snapshot.subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    teacher: "",
  }));
}
