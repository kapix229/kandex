import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMobileSession, fetchMobileSnapshot } from "@/services/eduvulcan-mobile";
import {
  getEduVulcanGrades,
  getEduVulcanAttendance,
  getEduVulcanTimetable,
  getEduVulcanSubjects,
  EDUVULCAN_SESSION_COOKIE,
} from "@/services/eduvulcan-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestMap.get(ip);
  if (!record || now > record.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

function getSecurityHeaders() {
  const headers = new Headers();
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  return headers;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_req: Request) {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  return NextResponse.json({}, { status: 204, headers });
}

export async function POST(req: Request) {
  const headers = getSecurityHeaders();
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Zbyt wiele żądań synchronizacji. Spróbuj ponownie za chwilę.",
        },
      },
      { status: 429, headers },
    );
  }

  try {
    let bodySessionId: string | undefined;
    try {
      const body = (await req.json()) as { sessionId?: unknown };
      if (body && typeof body.sessionId === "string") {
        bodySessionId = body.sessionId;
      }
    } catch {
      // Body is optional if session cookie is present
    }

    const cookieStore = await cookies();
    const sessionId = bodySessionId || cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SESSION_EXPIRED",
            message: "Brak aktywnej sesji EduVULCAN. Połącz dziennik ponownie.",
          },
        },
        { status: 401, headers },
      );
    }

    const session = await getMobileSession(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SESSION_EXPIRED",
            message: "Sesja EduVULCAN wygasła lub jest nieprawidłowa. Połącz dziennik ponownie.",
          },
        },
        { status: 401, headers },
      );
    }

    // Run parallel fetches for snapshot and specialized structured returns
    const [snapshot, grades, attendance, timetable, subjects] = await Promise.all([
      fetchMobileSnapshot(sessionId),
      getEduVulcanGrades(sessionId).catch((err) => {
        console.error("[eduvulcan-sync] grades fetch failed", err);
        return [];
      }),
      getEduVulcanAttendance(sessionId).catch((err) => {
        console.error("[eduvulcan-sync] attendance fetch failed", err);
        return { summary: { present: 0, absent: 0, late: 0, excused: 0, unknown: 0 }, entries: [] };
      }),
      getEduVulcanTimetable(sessionId).catch((err) => {
        console.error("[eduvulcan-sync] timetable fetch failed", err);
        return [];
      }),
      getEduVulcanSubjects(sessionId).catch((err) => {
        console.error("[eduvulcan-sync] subjects fetch failed", err);
        return [];
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: snapshot,
        grades,
        attendance,
        timetable,
        subjects,
        syncStatus: snapshot.syncStatus,
      },
      { status: 200, headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany błąd synchronizacji";
    const expired = message.includes("SESSION_EXPIRED") || message.includes("wygasła");
    console.error("[eduvulcan-sync] sync failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
      message,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: expired ? "SESSION_EXPIRED" : "SYNC_FAILED",
          message: expired ? "Sesja EduVULCAN wygasła. Połącz dziennik ponownie." : message,
        },
      },
      { status: expired ? 401 : 502, headers },
    );
  }
}
