import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanAttendance, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const attendance = await getEduVulcanAttendance(
      cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value,
    );
    return NextResponse.json({ success: true, data: attendance });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "SESSION_EXPIRED", message: "Brak aktywnej sesji." } },
      { status: 401 },
    );
  }
}
