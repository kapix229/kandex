import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanGrades, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const grades = await getEduVulcanGrades(
      cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value,
    );
    return NextResponse.json({ success: true, data: { grades } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "SESSION_EXPIRED", message: "Brak aktywnej sesji." } },
      { status: 401 },
    );
  }
}
