import { cookies } from "next/headers";
import { createSession, getSession, setSession } from "@/services/vulcan";
import { consumeLatestHtmlTemporaryImport, parseHtmlExport, saveHtmlTemporaryImport } from "@/services/html-import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let html = "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      html = typeof body?.html === "string" ? body.html : "";
    } else {
      const formData = await request.formData();
      const htmlField = formData.get("html");
      if (typeof htmlField === "string") {
        html = htmlField;
      } else if (htmlField instanceof File) {
        html = await htmlField.text();
      }

      const fileField = formData.get("file");
      if (!html && fileField instanceof File) {
        html = await fileField.text();
      }
    }

    if (!html || !html.trim()) {
      return Response.json({ success: false, error: "Brak danych HTML do importu." }, { status: 400 });
    }

    const data = parseHtmlExport(html);
    const cookieStore = await cookies();
    const existingToken = cookieStore.get("vulcan_token")?.value;
    const sessionId = existingToken && getSession(existingToken) ? existingToken : createSession();

    const student = data.students[0] ?? { id: 1, fullName: "Uczeń z eksportu HTML", className: "Eksport HTML", schoolName: "Dziennik" };
    const normalizedFullName = student.fullName
      .replace(/^(uczeń|uczen|student|uczennica|uczenica)\s*[:\-]?\s*/i, "")
      .trim();
    const fullName = normalizedFullName || student.fullName;
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || "Uczeń";
    const surname = nameParts.slice(1).join(" ");

    setSession(sessionId, {
      account: {
        userName: fullName,
        userLogin: "html-import",
        studentId: student.id,
      },
      student: {
        pupil: {
          firstName,
          surname,
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

    saveHtmlTemporaryImport(html);
    consumeLatestHtmlTemporaryImport();

    return Response.json({
      success: true,
      account: { fullName: student.fullName, studentId: student.id },
      imported: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return Response.json({ success: false, error: `Nie udało się zaimportować HTML: ${message}` }, { status: 500 });
  }
}
