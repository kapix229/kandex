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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[eduvulcan] grades import failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message,
    });
    const expired = message.includes("SESSION_EXPIRED");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: expired ? "SESSION_EXPIRED" : "IMPORT_FAILED",
          message: expired
            ? "Sesja EduVULCAN wygasła. Połącz dziennik ponownie."
            : "Nie udało się pobrać ocen z EduVULCAN. Spróbuj ponownie za chwilę.",
        },
      },
      { status: expired ? 401 : 502 },
    );
  }
}
