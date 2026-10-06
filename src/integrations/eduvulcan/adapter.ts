import { cookies } from "next/headers";
import { fetchVulcanEvents, fetchVulcanGrades, getSession } from "@/services/vulcan";
import { fetchMobileSnapshot } from "@/services/eduvulcan-mobile";
import type { JournalSnapshot } from "@/src/types/journal";
import type { JournalAdapter, JournalCredentials, JournalConnectionResult } from "@/src/integrations/types";
import { loginWithCredentials } from "./credentials";

export const eduvulcanAdapter: JournalAdapter = {
  provider: "eduvulcan",
  async login(credentials: JournalCredentials): Promise<JournalConnectionResult> {
    return loginWithCredentials(credentials);
  },
  async getSnapshot(): Promise<JournalSnapshot> {
    const cookieStore = await cookies();
    const mobileSession = cookieStore.get("eduvulcan_mobile_session")?.value;
    if (mobileSession) return fetchMobileSnapshot(mobileSession);

    const token = cookieStore.get("vulcan_token")?.value;
    if (!token) throw new Error("Brak aktywnej sesji EduVULCAN.");
    const session = getSession(token);
    if (!session?.account) throw new Error("Sesja EduVULCAN wygasła.");

    const [summaries, events] = await Promise.all([fetchVulcanGrades(token), fetchVulcanEvents(token)]);
    const student = session.student?.pupil
      ? { id: String(session.student.pupil.id), fullName: `${session.student.pupil.firstName ?? ""} ${session.student.pupil.surname ?? ""}`.trim(), className: session.student.unit?.short ?? session.student.unit?.displayName, schoolName: session.student.school?.short ?? session.student.school?.name }
      : null;

    return {
      provider: "eduvulcan",
      importedAt: new Date().toISOString(),
      student,
      subjects: summaries.map((s) => ({ id: s.subject.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, "-"), name: s.subject, average: s.average, gradeCount: s.count })),
      grades: summaries.flatMap((s) => s.grades.map((g) => ({ id: String(g.id), subject: s.subject, value: g.value, date: new Date(g.date).toISOString(), weight: g.weight, teacher: g.teacher, title: g.title }))),
      schedule: events.filter((e) => e.type === "event").map((e) => ({ id: String(e.id), subject: e.subject ?? e.title, startsAt: new Date(e.date).toISOString(), endsAt: e.dueDate ? new Date(e.dueDate).toISOString() : undefined })),
      assignments: events.filter((e) => e.type === "assignment" || e.type === "test" || e.type === "exam").map((e) => ({ id: String(e.id), title: e.title, subject: e.subject, dueDate: e.dueDate ? new Date(e.dueDate).toISOString() : new Date(e.date).toISOString(), completed: e.completed })),
    };
  },
};
