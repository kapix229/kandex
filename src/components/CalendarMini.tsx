"use client";

import React, { useEffect, useState } from "react";

type VulcanEvent = {
  id: string;
  title: string;
  description?: string;
  type: "assignment" | "test" | "exam" | "grade" | "note" | "event";
  subject?: string;
  date: string; // ISO 8601
  completed: boolean;
  priority: "low" | "normal" | "high";
};

type DayBucket = {
  date: Date;
  weekday: string;
  events: VulcanEvent[];
};

const WEEKDAYS = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

/**
 * Compact calendar widget shown on the dashboard. It fetches upcoming
 * events from the EduVULCAN API the same way the full calendar page does.
 * Until the user logs in to Vulcan and a sync runs, the widget stays
 * empty - we never show hardcoded sample events.
 */
export default function CalendarMini() {
  const [buckets, setBuckets] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/eduvulcan/events", { cache: "no-store" });
        if (!res.ok) {
          // 401 (not logged in) is expected - just render an empty state.
          if (!cancelled) {
            setBuckets([]);
            setLoading(false);
          }
          return;
        }
        const json = await res.json();
        const events: VulcanEvent[] = Array.isArray(json?.events) ? json.events : [];

        if (cancelled) return;

        // Group by day, only future + today.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const byDay = new Map<string, VulcanEvent[]>();
        for (const e of events) {
          const d = new Date(e.date);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() < today.getTime()) continue;
          const key = d.toISOString().slice(0, 10);
          const list = byDay.get(key) ?? [];
          list.push(e);
          byDay.set(key, list);
        }

        const sorted: DayBucket[] = Array.from(byDay.entries())
          .map(([key, list]) => {
            const date = new Date(`${key}T00:00:00`);
            list.sort(
              (a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            return {
              date,
              weekday: WEEKDAYS[date.getDay()],
              events: list,
            };
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 5);

        setBuckets(sorted);
      } catch {
        if (!cancelled) setBuckets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="glass-card w-full flex-shrink-0 rounded-2xl p-5 shadow-sm">
      <h2 className="text-xl font-bold text-[var(--text)] mb-4 border-b border-[var(--border)] pb-3">
        📅 Kalendarz Wydarzeń
      </h2>

      <div className="space-y-3 overflow-y-auto max-h-[500px]">
        {loading ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            Ładowanie wydarzeń z EduVULCAN…
          </p>
        ) : buckets.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6 italic">
            Brak wydarzeń. Sprawdź, czy w EduVULCAN są dostępne terminy i zadania.
          </p>
        ) : (
          buckets.map((day) => (
            <div
              key={day.date.toISOString()}
              className="p-3 border border-[var(--border)] rounded-xl bg-white/[0.025]"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-[var(--text-muted)]">
                  {formatDate(day.date)}
                </span>
                <span className="px-3 py-0.5 text-xs font-bold rounded bg-[var(--accent-soft)] text-[var(--accent-secondary)]">
                  {day.weekday}
                </span>
              </div>

              <div className="space-y-1">
                {day.events.map((event) => (
                  <p
                    key={event.id}
                    className="text-sm text-[var(--text)] flex items-start"
                  >
                    <span className="mr-2 mt-1">•</span> {event.title}
                    {event.subject && (
                      <span className="ml-2 text-xs text-[var(--text-tertiary)]">
                        ({event.subject})
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <a
        href="/calendar"
        className="mt-6 block w-full rounded-xl border border-white/10 bg-[var(--accent)] py-2.5 text-center font-semibold text-[#211e24] transition duration-150 hover:brightness-105"
      >
        Zobacz wszystkie wydarzenia
      </a>
    </div>
  );
}
