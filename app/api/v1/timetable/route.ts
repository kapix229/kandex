import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanTimetable, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";
import type { APIResponse, Lesson } from "@/src/types/shared";

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

export async function GET() {
  const headers = getSecurityHeaders();
  try {
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

    const lessons = await getEduVulcanTimetable(sessionId);
    const response: APIResponse<Lesson[]> = {
      success: true,
      data: lessons,
    };
    return NextResponse.json(response, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const expired = message.includes("SESSION_EXPIRED") || message.includes("wygasła");
    console.error("[api/v1/timetable] import failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message,
    });

    const response: APIResponse<never> = {
      success: false,
      error: {
        code: expired ? "SESSION_EXPIRED" : "EDUVULCAN_UNAVAILABLE",
        message: expired
          ? "Sesja EduVULCAN wygasła. Połącz dziennik ponownie."
          : "Serwer EduVULCAN jest niedostępny.",
      },
    };
    return NextResponse.json(response, { status: expired ? 401 : 502, headers });
  }
}