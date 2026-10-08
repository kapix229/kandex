import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanTimetable, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const lessons = await getEduVulcanTimetable(
      cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value,
    );
    return NextResponse.json({ success: true, data: { lessons } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "SESSION_EXPIRED", message: "Brak aktywnej sesji." } },
      { status: 401 },
    );
  }
}
