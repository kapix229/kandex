import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMobileSession } from "@/services/eduvulcan-mobile";
import { EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value;

  if (!sessionId) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const session = await getMobileSession(sessionId);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    student: {
      id: String(session.student.PupilId),
      name: session.student.FirstName,
      surname: session.student.LastName,
      class: session.student.Pupil?.ClassDisplay ?? "",
      school:
        session.student.Pupil?.ConstituentUnit?.Name ??
        session.student.Pupil?.Unit?.Name ??
        "",
    },
  });
}
