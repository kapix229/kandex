import { cookies } from "next/headers";
import { fetchVulcanEvents, getSession, createSession, setSession } from "@/services/vulcan";
import { consumeLatestHtmlTemporaryImport, parseHtmlExport } from "@/services/html-import";

export const dynamic = "force-dynamic";

/**
 * GET /api/vulcan/events
 * Returns the student's calendar events (homework, tests, exams, notes).
 * Requires a valid `vulcan_token` cookie set by the login endpoint.
 *
 * The cookie value is the in-memory session id, not the actual Vulcan
 * REST token - the REST token lives inside the session and is reused
 * for every SDK call.
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
      return Response.json({ success: true, events: data.events });
    }

    return Response.json({ success: true, events: [] });
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
      return Response.json({ success: true, events: data.events });
    }

    return Response.json({ success: true, events: [] });
  }

  try {
    const events = await fetchVulcanEvents(tokenCookie.value);
    return Response.json({ success: true, events });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return Response.json(
      { success: false, error: `Nie udało się pobrać wydarzeń: ${message}` },
      { status: 500 }
    );
  }
}
