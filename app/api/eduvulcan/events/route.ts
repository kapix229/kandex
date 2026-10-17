import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEduVulcanSnapshot, EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const snapshot = await getEduVulcanSnapshot(
      cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value,
    );

    // Do not report a successful empty calendar when EduVULCAN failed to load
    // lessons or homework. Keep partial data available when one source works.
    if (!snapshot.syncStatus.lessons && !snapshot.syncStatus.homework) {
      throw new Error("EduVULCAN nie zwrócił ani planu lekcji, ani zadań.");
    }
    if (!snapshot.syncStatus.lessons || !snapshot.syncStatus.homework) {
      console.warn("[eduvulcan] calendar returned partial data", {
        lessonsAvailable: snapshot.syncStatus.lessons,
        homeworkAvailable: snapshot.syncStatus.homework,
        lessonsCount: snapshot.schedule.length,
        homeworkCount: snapshot.assignments.length,
      });
    }

    const lessons = snapshot.schedule.map((lesson) => ({
      id: `lesson-${lesson.id}`,
      title: lesson.subject || "Lekcja",
      description: [lesson.teacher, lesson.room ? `Sala ${lesson.room}` : ""]
        .filter(Boolean)
        .join(" · "),
      type: "event" as const,
      subject: lesson.subject,
      date: lesson.startsAt,
      dueDate: lesson.endsAt,
      completed: false,
      priority: "normal" as const,
    }));

    const assignments = snapshot.assignments
      .filter((assignment) => Boolean(assignment.dueDate))
      .map((assignment) => ({
        id: `assignment-${assignment.id}`,
        title: assignment.title || "Zadanie",
        type: "assignment" as const,
        subject: assignment.subject,
        date: assignment.dueDate as string,
        dueDate: assignment.dueDate,
        completed: assignment.completed,
        priority: "normal" as const,
      }));

    const events = [...lessons, ...assignments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return NextResponse.json({ success: true, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const expired = message.includes("SESSION_EXPIRED");
    console.error("[eduvulcan] calendar import failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message,
    });
    return NextResponse.json(
      {
        success: false,
        error: expired
          ? "Sesja EduVULCAN wygasła. Połącz dziennik ponownie."
          : "Nie udało się pobrać kalendarza z EduVULCAN. Spróbuj ponownie za chwilę.",
      },
      { status: expired ? 401 : 502 },
    );
  }
}
