import { getMobileSession, fetchMobileSnapshot } from "@/services/eduvulcan-mobile";
import type {
  AttendanceData,
  Grade,
  Lesson,
  Student,
  Subject,
} from "@/src/types/journals";

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
  const snapshot = await getEduVulcanSnapshot(sessionId);
  return snapshot.grades.map((grade) => ({
    id: grade.id,
    subjectId: snapshot.subjects.find((subject) => subject.name === grade.subject)?.id ?? grade.subject,
    subjectName: grade.subject,
    value: String(grade.value),
    type: grade.title ?? "ocena",
    date: grade.date,
    weight: Number(grade.weight || 1),
  }));
}

export async function getEduVulcanAttendance(sessionId: string | undefined): Promise<AttendanceData> {
  const snapshot = await getEduVulcanSnapshot(sessionId);
  const entries = snapshot.attendance ?? [];
  return {
    summary: {
      present: entries.filter((entry) => entry.status === "present").length,
      absent: entries.filter((entry) => entry.status === "absent").length,
      late: entries.filter((entry) => entry.status === "late").length,
      excused: entries.filter((entry) => entry.status === "excused").length,
    },
    entries,
  };
}

export async function getEduVulcanTimetable(sessionId: string | undefined): Promise<Lesson[]> {
  const snapshot = await getEduVulcanSnapshot(sessionId);
  return snapshot.schedule.map((lesson) => ({
    date: lesson.startsAt.slice(0, 10),
    lessonNumber: 0,
    start: lesson.startsAt.slice(11, 16),
    end: lesson.endsAt?.slice(11, 16) ?? "",
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
