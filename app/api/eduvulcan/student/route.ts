import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanStudent, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const student = await getEduVulcanStudent(
      cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value,
    );
    return NextResponse.json({ success: true, data: student });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "SESSION_EXPIRED", message: "Brak aktywnej sesji." } },
      { status: 401 },
    );
  }
}
