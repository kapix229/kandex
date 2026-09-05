import { cookies } from "next/headers";
import { fetchVulcanGrades, getSession, createSession, setSession } from "@/services/vulcan";
import { consumeLatestHtmlTemporaryImport, parseHtmlExport } from "@/services/html-import";

export const dynamic = "force-dynamic";

/**
 * GET /api/vulcan/grades
 * Returns the student's grade book aggregated per subject,
 * with a weighted average and a per-subject list of individual grades.
 * Requires a valid `vulcan_token` cookie set by the login endpoint.
 */
export async function GET() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("vulcan_token");

  if (!tokenCookie?.value) {
    const latest = consumeLatestHtmlTemporaryImport();
    if (latest) {
      const data = parseHtmlExport(latest.html);
      const sessionId = createSession();
      const student = data.students[0] ?? { id: 1, fullName: "Uczeń z eksportu HTML", className: "Eksport HTML", schoolName: "Dziennik" };
      const nameParts = student.fullName.split(/\s+/).filter(Boolean);
      setSession(sessionId, {
        account: {
          userName: student.fullName,
          userLogin: "html-import",
          studentId: student.id,
        },
        student: {
          pupil: {
            firstName: nameParts[0] || "Uczeń",
            surname: nameParts.slice(1).join(" ") || "",
            id: student.id,
          },
        },
        imported: {
          students: data.students,
          events: data.events,
          summaries: data.summaries,
        },
      } as any);
      cookieStore.set("vulcan_token", sessionId, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return Response.json({ success: true, summaries: data.summaries });
    }

    return Response.json({ success: true, summaries: [] });
  }

  const session = getSession(tokenCookie.value);
  if (!session || !session.account) {
    const latest = consumeLatestHtmlTemporaryImport();
    if (latest) {
      const data = parseHtmlExport(latest.html);
      const sessionId = createSession();
      const student = data.students[0] ?? { id: 1, fullName: "Uczeń z eksportu HTML", className: "Eksport HTML", schoolName: "Dziennik" };
      const nameParts = student.fullName.split(/\s+/).filter(Boolean);
      setSession(sessionId, {
        account: {
          userName: student.fullName,
          userLogin: "html-import",
          studentId: student.id,
        },
        student: {
          pupil: {
            firstName: nameParts[0] || "Uczeń",
            surname: nameParts.slice(1).join(" ") || "",
            id: student.id,
          },
        },
        imported: {
          students: data.students,
          events: data.events,
          summaries: data.summaries,
        },
      } as any);
      cookieStore.set("vulcan_token", sessionId, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return Response.json({ success: true, summaries: data.summaries });
    }

    return Response.json({ success: true, summaries: [] });
  }

  try {
    const summaries = await fetchVulcanGrades(tokenCookie.value);
    return Response.json({ success: true, summaries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return Response.json(
      { success: false, error: `Nie udało się pobrać ocen: ${message}` },
      { status: 500 }
    );
  }
}
