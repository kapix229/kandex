import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanGrades, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";
import type { APIResponse, Grade } from "@/src/types/shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSecurityHeaders() {
  const headers = new Headers();
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  headers.set("X-Request-Id", crypto.randomUUID());
  return headers;
}

export async function GET(req: Request) {
  const headers = getSecurityHeaders();
  try {
    const { searchParams } = new URL(req.url);
    const subjectFilter = searchParams.get("subject")?.toLowerCase();
    const subjectIdFilter = searchParams.get("subjectId");
    const fromFilter = searchParams.get("from");
    const toFilter = searchParams.get("to");

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json<APIResponse<never>>(
        {
          success: false,
          error: { code: "SESSION_EXPIRED", message: "Sesja EduVULCAN wygasła. Połącz dziennik ponownie." },
        },
        { status: 401, headers }
      );
    }

    let grades = await getEduVulcanGrades(sessionId);

    // Apply filters
    if (subjectFilter) {
      grades = grades.filter((g) => g.subjectName.toLowerCase().includes(subjectFilter));
    }
    if (subjectIdFilter) {
      grades = grades.filter((g) => g.subjectId === subjectIdFilter);
    }
    if (fromFilter) {
      const fromDate = new Date(fromFilter).getTime();
      if (!isNaN(fromDate)) {
        grades = grades.filter((g) => new Date(g.date).getTime() >= fromDate);
      }
    }
    if (toFilter) {
      const toDate = new Date(toFilter).getTime();
      if (!isNaN(toDate)) {
        grades = grades.filter((g) => new Date(g.date).getTime() <= toDate);
      }
    }

    const response: APIResponse<{ grades: Grade[] }> = {
      success: true,
      data: { grades },
    };
    return NextResponse.json(response, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/v1/grades] import failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message,
    });

    const expired = message.includes("SESSION_EXPIRED") || message.includes("wygasła");
    const response: APIResponse<never> = {
      success: false,
      error: {
        code: expired ? "SESSION_EXPIRED" : "IMPORT_FAILED",
        message: expired
          ? "Sesja EduVULCAN wygasła. Połącz dziennik ponownie."
          : "Nie udało się pobrać ocen. Spróbuj ponownie później.",
      },
    };
    return NextResponse.json(response, { status: expired ? 401 : 502, headers });
  }
}