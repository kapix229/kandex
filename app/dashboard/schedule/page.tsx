"use client";

import { useEffect, useState, useCallback } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import Link from "next/link";

type Lesson = {
  date: string;
  lessonNumber: number;
  start: string;
  end: string;
  subject: string;
  teacher: string;
  room: string;
};

const DAYS = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

export default function DashboardSchedulePage() {
  const { account, signOut } = useVulcanSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const loadSchedule = async (signal?: AbortSignal): Promise<Lesson[]> => {
    const res = await fetch("/api/eduvulcan/timetable", { cache: "no-store", signal });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message ?? "Nie udało się pobrać planu lekcji.");
    }
    return data.data?.lessons ?? [];
  };

  const handleSync = useCallback(async () => {
    await loadSchedule();
  }, [loadSchedule]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialLoad) return;
    const controller = new AbortController();
    let cancelled = false;

    loadSchedule(controller.signal)
      .then((lessonsData) => {
        if (!cancelled) {
          setLessons(lessonsData);
        }
      })
      .catch((err) => {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Błąd sieci");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setInitialLoad(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [initialLoad]);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const lessonsByDay = lessons.reduce((acc, lesson) => {
    const day = lesson.date.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  // Sort lessons within each day by lesson number
  Object.values(lessonsByDay).forEach((dayLessons) => {
    dayLessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
  });

  const sortedDays = Object.entries(lessonsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Kandex / EduVULCAN</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text)]">Plan lekcji</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">Twój tydzień zajęć zsynchronizowany z dziennikiem.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SyncButton onSync={handleSync} label="Synchronizuj" disabled={loading} />
          {account && (
            <button
              onClick={async () => {
                try {
                  await fetch("/api/eduvulcan/login", { method: "DELETE" });
                } catch (err) {
                  console.error("logout failed:", err);
                } finally {
                  signOut();
                }
              }}
              className="bg-[var(--surface-muted)] border border-[var(--border-strong)] text-[var(--text)] px-3 py-1.5 rounded-2xl text-sm hover:bg-white/[0.08]"
            >
              Wyloguj
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="workspace-card rounded-2xl p-12 text-center text-sm text-[var(--text-muted)]">
          Pobieranie planu lekcji z EduVULCAN…
        </div>
      ) : lessons.length === 0 ? (
        <div className="workspace-card rounded-2xl p-12 text-center">
          <p className="font-semibold text-[var(--text)] mb-2">Brak planu lekcji</p>
          <p className="text-sm text-[var(--text-muted)]">Dziennik nie zwrócił danych o planie. Spróbuj zsynchronizować ponownie.</p>
        </div>
      ) : (
        <div className="workspace-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                <tr>
                  <th className="px-5 py-3.5 font-semibold w-36">Dzień</th>
                  <th className="px-5 py-3.5 font-semibold">Lekcja</th>
                  <th className="px-5 py-3.5 font-semibold">Przedmiot</th>
                  <th className="px-5 py-3.5 font-semibold w-40">Nauczyciel</th>
                  <th className="px-5 py-3.5 font-semibold w-28">Sala</th>
                  <th className="px-5 py-3.5 font-semibold w-36">Godziny</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedDays.map(([dayStr, dayLessons]) => {
                  const dayDate = new Date(`${dayStr}T12:00:00`);
                  const isToday = dayStr === todayStr;
                  return (
                    <tbody key={dayStr} className={isToday ? "bg-[var(--accent-primary-muted)]" : ""}>
                      <tr>
                        <td className="px-5 py-3.5 font-semibold text-[var(--text)] whitespace-nowrap">
                          {DAYS[dayDate.getDay()]}
                          <span className="ml-2 text-xs text-[var(--text-muted)]">{dayDate.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" })}</span>
                          {isToday && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-[var(--accent-primary)] text-[var(--text-inverse)]">Dzisiaj</span>}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)]">{dayLessons[0]?.lessonNumber ?? "—"}</td>
                        <td className="px-5 py-3.5 font-medium text-[var(--text)]">{dayLessons[0]?.subject ?? "—"}</td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)]">{dayLessons[0]?.teacher ?? "—"}</td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)]">{dayLessons[0]?.room ?? "—"}</td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)]">
                          {dayLessons[0]?.start ?? "—"} – {dayLessons[0]?.end ?? "—"}
                        </td>
                      </tr>
                      {dayLessons.slice(1).map((lesson, idx) => (
                        <tr key={`${dayStr}-${lesson.lessonNumber}`} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3"></td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">{lesson.lessonNumber}</td>
                          <td className="px-5 py-3 font-medium text-[var(--text)]">{lesson.subject}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">{lesson.teacher}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">{lesson.room}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">{lesson.start} – {lesson.end}</td>
                        </tr>
                      ))}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Link
            href="/calendar"
            className="block mt-4 text-center py-2 text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Zobacz w kalendarzu →
          </Link>
        </div>
      )}
    </div>
  );
}