import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanTimetable, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value;
    const lessons = await getEduVulcanTimetable(sessionId);
    return NextResponse.json({ success: true, data: { lessons } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const expired = message.includes("SESSION_EXPIRED");
    console.error("[eduvulcan] timetable import failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message,
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: expired ? "SESSION_EXPIRED" : "IMPORT_FAILED",
          message: expired
            ? "Sesja EduVULCAN wygasła. Połącz dziennik ponownie."
            : message,
        },
      },
      { status: expired ? 401 : 502 },
    );
  }
}
