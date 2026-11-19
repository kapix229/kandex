import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanSnapshot, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";
import type { APIResponse, VulcanEvent } from "@/src/types/shared";

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

    const snapshot = await getEduVulcanSnapshot(sessionId);

    // Do not report a successful empty calendar if every source failed.
    if (!snapshot.syncStatus.lessons && !snapshot.syncStatus.homework && !snapshot.syncStatus.exams) {
      const response: APIResponse<never> = {
        success: false,
        error: {
          code: "EDUVULCAN_UNAVAILABLE",
          message:
            snapshot.syncErrors?.lessons ??
            snapshot.syncErrors?.homework ??
            snapshot.syncErrors?.exams ??
            "EduVULCAN nie zwrócił planu lekcji, zadań ani sprawdzianów.",
        },
      };
      return NextResponse.json(response, { status: 502, headers });
    }

    if (!snapshot.syncStatus.lessons || !snapshot.syncStatus.homework || !snapshot.syncStatus.exams) {
      console.warn("[api/v1/events] calendar returned partial data", {
        lessonsAvailable: snapshot.syncStatus.lessons,
        homeworkAvailable: snapshot.syncStatus.homework,
        examsAvailable: snapshot.syncStatus.exams,
        lessonsCount: snapshot.schedule.length,
        homeworkCount: snapshot.assignments.length,
        examsCount: snapshot.exams?.length ?? 0,
      });
    }

    const events: VulcanEvent[] = [];

    // Lessons as events
    for (const lesson of snapshot.schedule) {
      const date = lesson.date;
      if (!date) continue;
      events.push({
        id: `lesson-${lesson.id}`,
        title: lesson.subject || "Lekcja",
        description: [lesson.teacher, lesson.room ? `Sala ${lesson.room}` : ""]
          .filter(Boolean)
          .join(" · "),
        type: "event",
        subject: lesson.subject,
        date: new Date(lesson.startsAt),
        dueDate: lesson.endsAt ? new Date(lesson.endsAt) : undefined,
        completed: false,
        priority: "normal",
      });
    }

    // Assignments as events
    for (const assignment of snapshot.assignments) {
      if (!assignment.dueDate) continue;
      events.push({
        id: `assignment-${assignment.id}`,
        title: assignment.title || "Zadanie",
        type: "assignment",
        subject: assignment.subject,
        date: new Date(assignment.dueDate),
        dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
        completed: assignment.completed,
        priority: "normal",
      });
    }

    // Exams as events
    for (const exam of snapshot.exams ?? []) {
      if (!exam.date) continue;
      events.push({
        id: `exam-${exam.id}`,
        title: exam.title || "Sprawdzian",
        type: "exam",
        subject: exam.subject,
        date: new Date(exam.date),
        dueDate: exam.date ? new Date(exam.date) : undefined,
        completed: false,
        priority: "high",
      });
    }

    // Sort by date ascending
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    const response: APIResponse<VulcanEvent[]> = {
      success: true,
      data: events,
    };
    return NextResponse.json(response, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const expired = message.includes("SESSION_EXPIRED");
    console.error("[api/v1/events] calendar import failed", {
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