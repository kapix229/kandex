import { cookies } from "next/headers";
import { fetchVulcanGrades, getSession, createSession, setSession } from "@/services/vulcan";
import { consumeLatestHtmlTemporaryImport, parseHtmlExport } from "@/services/html-import";

export const dynamic = "force-dynamic";

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
        account: { userName: student.fullName, userLogin: "html-import", studentId: student.id } as any,
        student: { pupil: { firstName: nameParts[0] || "Uczeń", surname: nameParts.slice(1).join(" ") || "", id: student.id } } as any,
        imported: { students: data.students, events: data.events, summaries: data.summaries },
      } as any);
      cookieStore.set("vulcan_token", sessionId, { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
      return Response.json({ success: true, summaries: data.summaries });
    }
    return Response.json({ success: true, summaries: [] });
  }

  const session = getSession(tokenCookie.value);
  if (!session || !session.account) {
    return Response.json({ success: true, summaries: [] });
  }

  try {
    return Response.json({ success: true, summaries: await fetchVulcanGrades(tokenCookie.value) });
  } catch (err) {
    return Response.json({ success: false, error: `Nie udało się pobrać ocen: ${err instanceof Error ? err.message : "Nieznany błąd"}` }, { status: 500 });
  }
}
