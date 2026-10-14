"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Calendar from "@/components/Calendar";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import type { VulcanEvent } from "@/types/vulcan";

type SnapshotResponse = {
  success?: boolean;
  snapshot?: {
    schedule?: Array<{ id: string; subject: string; teacher?: string; room?: string; startsAt: string; endsAt?: string }>;
    assignments?: Array<{ id: string; title: string; subject?: string; dueDate?: string; completed: boolean }>;
  };
  error?: string;
};

export default function CalendarPage() {
  const { account } = useVulcanSession();
  const [events, setEvents] = useState<VulcanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/journal/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "eduvulcan" }),
          cache: "no-store",
        });
        const result = await response.json() as SnapshotResponse;
        if (!response.ok || !result.success || !result.snapshot) throw new Error(result.error ?? "Nie udało się pobrać planu z EduVULCAN.");
        const lessons: VulcanEvent[] = (result.snapshot.schedule ?? []).map((lesson) => ({
          id: `lesson-${lesson.id}`,
          title: lesson.subject,
          description: [lesson.teacher, lesson.room ? `Sala ${lesson.room}` : ""].filter(Boolean).join(" · "),
          type: "event",
          subject: lesson.subject,
          date: new Date(lesson.startsAt),
          dueDate: lesson.endsAt ? new Date(lesson.endsAt) : undefined,
          completed: false,
          priority: "normal",
        }));
        const assignments: VulcanEvent[] = (result.snapshot.assignments ?? []).filter((item) => item.dueDate).map((item) => ({
          id: `assignment-${item.id}`,
          title: item.title,
          description: item.completed ? "Zadanie oznaczone jako wykonane" : "Zadanie domowe",
          type: "assignment",
          subject: item.subject,
          date: new Date(item.dueDate as string),
          dueDate: new Date(item.dueDate as string),
          completed: item.completed,
          priority: "normal",
        }));
        if (!cancelled) {
          setEvents([...lessons, ...assignments].sort((a, b) => a.date.getTime() - b.date.getTime()));
          setSyncError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setEvents([]);
          setSyncError(error instanceof Error ? error.message : "Wystąpił błąd synchronizacji.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const selectedEvents = useMemo(() => events.filter((event) => event.date.toDateString() === selectedDate.toDateString()).sort((a, b) => a.date.getTime() - b.date.getTime()), [events, selectedDate]);

  return (
    <div className="animate-fade-in space-y-7 sm:space-y-9">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="eyebrow mb-3">Tydzień pod kontrolą</p><h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-[2.4rem]">Plan i kalendarz</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Lekcje i terminy pobierane bezpośrednio z EduVULCAN.</p></div>
        {account && <span className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"><span className="status-dot" />{account.fullName}</span>}
      </header>

      {syncError && <div role="alert" className="rounded-2xl border border-[#ead0ca] bg-[#fff8f5] p-5"><p className="text-sm font-bold text-[#853f35]">Plan nie został pobrany</p><p className="mt-1 text-sm leading-6 text-[#8e625b]">{syncError}</p><Link href="/settings" className="mt-3 inline-flex text-xs font-bold text-[#853f35] underline underline-offset-4">Sprawdź połączenie →</Link></div>}

      <section className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="workspace-card min-w-0 p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4"><div><p className="eyebrow">Kalendarz szkolny</p><h2 className="mt-1 text-lg font-extrabold text-[var(--text)]">Wybierz dzień</h2></div><span className="rounded-lg bg-[#f0efe8] px-3 py-2 text-[11px] font-bold text-[var(--text-muted)]">{loading ? "Synchronizacja…" : `${events.length} wydarzeń`}</span></div>
          {loading ? <div className="data-empty p-10 text-center text-sm text-[var(--text-muted)]">Pobieranie planu i terminów z EduVULCAN…</div> : events.length ? <Calendar events={events} onDateSelect={setSelectedDate} /> : <div className="data-empty p-8"><p className="text-sm font-bold text-[var(--text)]">Brak wydarzeń do wyświetlenia</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Po udanym imporcie lekcje i zadania pojawią się w tym miejscu.</p></div>}
        </div>

        <aside className="workspace-card overflow-hidden">
          <div className="border-b border-[var(--border)] px-5 py-5"><p className="eyebrow">Wybrany dzień</p><h2 className="mt-1 text-lg font-extrabold capitalize text-[var(--text)]">{selectedDate.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}</h2></div>
          {loading ? <p className="p-6 text-sm text-[var(--text-muted)]">Ładowanie…</p> : selectedEvents.length ? <div className="divide-y divide-[var(--border)]">
            {selectedEvents.map((event) => <article key={event.id} className="flex gap-3 px-5 py-4"><div className="w-12 shrink-0 pt-0.5 text-xs font-bold text-[var(--accent)]">{event.date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</div><div className="min-w-0"><p className="text-sm font-bold text-[var(--text)]">{event.title}</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{event.description || event.subject || "Wydarzenie szkolne"}</p><span className="mt-2 inline-flex rounded-md bg-[#f0efe8] px-2 py-1 text-[10px] font-bold text-[var(--text-muted)]">{event.type === "assignment" ? "Zadanie" : "Lekcja"}</span></div></article>)}
          </div> : <div className="data-empty m-4 p-5"><p className="text-sm font-bold text-[var(--text)]">Spokojny dzień</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Nie ma wydarzeń w wybranym dniu.</p></div>}
        </aside>
      </section>
      <p className="text-[11px] leading-5 text-[var(--text-muted)]">Terminy bez daty nie są dodawane do kalendarza. Kandex nie tworzy przykładowych lekcji ani sprawdzianów.</p>
    </div>
  );
}
