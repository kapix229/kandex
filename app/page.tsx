"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

type Snapshot = {
  provider: "eduvulcan";
  importedAt: string;
  student: { id: string; fullName: string; className?: string; schoolName?: string };
  subjects: Array<{ id: string; name: string; average: number; gradeCount: number }>;
  grades: Array<{ id: string; subject: string; value: number; date: string; title?: string }>;
  schedule: Array<{ id: string; subject: string; teacher?: string; room?: string; startsAt: string; endsAt?: string }>;
  assignments: Array<{ id: string; title: string; subject?: string; dueDate?: string; completed: boolean }>;
  attendance: Array<{ date: string; lesson: number; subject: string; status: string }>;
};

function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Termin nieznany" : new Intl.DateTimeFormat("pl-PL", options).format(date);
}

function formatTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export default function HomePage() {
  const { account } = useVulcanSession();
  const [provider, setProvider] = useState<"eduvulcan" | "librus" | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedProvider = window.localStorage.getItem("kandex-journal-provider");
    if (savedProvider === "eduvulcan" || savedProvider === "librus") setProvider(savedProvider);
  }, []);

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    async function loadSnapshot() {
      setLoading(true);
      setSyncError(null);
      try {
        const response = await fetch("/api/journal/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "eduvulcan" }),
          cache: "no-store",
        });
        const result = await response.json() as { success?: boolean; snapshot?: Snapshot; error?: string };
        if (!response.ok || !result.success || !result.snapshot) {
          throw new Error(result.error ?? (response.status === 401
            ? "Sesja EduVULCAN wygasła. Połącz dziennik ponownie."
            : "Nie udało się pobrać danych z EduVULCAN."));
        }
        if (!cancelled) setSnapshot(result.snapshot);
      } catch (error) {
        if (!cancelled) {
          setSnapshot(null);
          setSyncError(error instanceof Error ? error.message : "Wystąpił błąd synchronizacji.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadSnapshot();
    return () => { cancelled = true; };
  }, [account, refreshKey]);

  const todayLessons = useMemo(() => {
    if (!snapshot) return [];
    const today = new Date();
    const key = today.toLocaleDateString("sv-SE");
    return snapshot.schedule
      .filter((lesson) => new Date(lesson.startsAt).toLocaleDateString("sv-SE") === key)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [snapshot]);

  const upcomingAssignments = useMemo(() => {
    if (!snapshot) return [];
    const now = new Date();
    return [...snapshot.assignments]
      .filter((item) => !item.dueDate || new Date(item.dueDate).getTime() >= now.getTime() - 86400000)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 4);
  }, [snapshot]);

  const average = snapshot?.subjects.length
    ? snapshot.subjects.reduce((sum, subject) => sum + subject.average, 0) / snapshot.subjects.length
    : null;
  const attendanceCount = snapshot?.attendance.length ?? 0;
  const presentCount = snapshot?.attendance.filter((entry) => entry.status === "present").length ?? 0;
  const attendanceRate = attendanceCount ? Math.round((presentCount / attendanceCount) * 100) : null;

  function selectProvider(nextProvider: "eduvulcan" | "librus") {
    try { window.localStorage.setItem("kandex-journal-provider", nextProvider); } catch {}
    setProvider(nextProvider);
  }

  if (!account) {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center">
          <div className="mb-12 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent)] text-lg font-black text-white">K</span>
            <div><p className="text-xl font-extrabold tracking-tight">Kandex</p><p className="text-xs text-[var(--text-muted)]">Twój workspace do nauki</p></div>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <section>
              <p className="eyebrow mb-4">Twoja nauka, w jednym miejscu</p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[var(--text)] sm:text-6xl">Mniej chaosu. Więcej skupienia.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">Połącz dziennik i uporządkuj lekcje, oceny oraz zadania w spokojnej przestrzeni do nauki.</p>
            </section>
            <section className="workspace-card rounded-[28px] p-5 sm:p-7">
              <div className="mb-6"><p className="text-sm font-extrabold text-[var(--text)]">Wybierz dziennik</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Połącz konto, aby pobrać swoje prawdziwe dane.</p></div>
              <div className="space-y-3">
                <button type="button" aria-pressed={provider === "eduvulcan"} onClick={() => selectProvider("eduvulcan")} className={`w-full rounded-2xl border p-4 text-left transition ${provider === "eduvulcan" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white hover:bg-[#f7f7f2]"}`}>
                  <p className="font-bold text-[var(--text)]">EduVULCAN <span className="float-right text-[var(--accent)]">↗</span></p><p className="mt-1 text-xs text-[var(--text-muted)]">Połącz swoje konto szkolne</p>
                </button>
                <button type="button" aria-pressed={provider === "librus"} onClick={() => selectProvider("librus")} className={`w-full rounded-2xl border p-4 text-left transition ${provider === "librus" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white hover:bg-[#f7f7f2]"}`}>
                  <p className="font-bold text-[var(--text)]">Librus <span className="float-right text-xs text-[var(--text-muted)]">WKRÓTCE</span></p><p className="mt-1 text-xs text-[var(--text-muted)]">Integracja nie jest jeszcze aktywna</p>
                </button>
              </div>
              {provider === "eduvulcan" && <Link href="/login" className="mt-5 block rounded-xl bg-[var(--accent)] px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]">Połącz EduVULCAN →</Link>}
              {provider === "librus" && <p className="mt-5 rounded-xl bg-[#f7f4ed] p-4 text-xs leading-5 text-[var(--text-muted)]">Integracja Librus nie jest jeszcze aktywna.</p>}
            </section>
          </div>
        </div>
      </main>
    );
  }

  const firstName = account.fullName?.split(" ")[0] || "Cześć";

  return (
    <div className="animate-fade-in space-y-7 sm:space-y-9">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-3">Środa · Twoja przestrzeń</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-[2.6rem]">Cześć, {firstName}.</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Oto plan na dziś. Zrób miejsce na to, co ważne.</p>
        </div>
        <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-bold text-[var(--text)] transition hover:bg-white disabled:opacity-50 sm:self-auto">
          <span className={loading ? "animate-spin" : ""}>↻</span>{loading ? "Synchronizuję…" : "Synchronizuj dane"}
        </button>
      </header>

      <section className="workspace-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-lg text-[var(--accent)]">↗</span>
          <div><p className="text-sm font-bold text-[var(--text)]">EduVULCAN</p><p className="mt-0.5 text-xs text-[var(--text-muted)]">{snapshot ? `Ostatnia synchronizacja: ${formatDate(snapshot.importedAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}` : "Połączenie gotowe do synchronizacji"}</p></div>
        </div>
        <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-[11px] font-bold ${syncError ? "bg-[#f8e9e5] text-[#9b493c]" : snapshot ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-[#efeee8] text-[var(--text-muted)]"}`}>
          <span className={syncError ? "h-1.5 w-1.5 rounded-full bg-[#b85c4d]" : "status-dot"} />{syncError ? "Wymaga uwagi" : loading ? "Pobieranie danych" : snapshot ? "Dane zsynchronizowane" : "Brak danych"}
        </span>
      </section>

      {syncError && <section role="alert" className="rounded-2xl border border-[#ead0ca] bg-[#fff8f5] p-5">
        <p className="text-sm font-bold text-[#853f35]">Nie udało się pobrać danych</p><p className="mt-1 text-sm leading-6 text-[#8e625b]">{syncError}</p>
        <Link href="/settings" className="mt-3 inline-flex text-xs font-bold text-[#853f35] underline underline-offset-4">Sprawdź połączenie →</Link>
      </section>}

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {[
          { label: "Średnia ocen", value: average === null ? "—" : average.toFixed(2), note: snapshot ? `${snapshot.subjects.length} przedmiotów` : "Czeka na dane", icon: "◈" },
          { label: "Oceny", value: snapshot ? String(snapshot.grades.length) : "—", note: "Wczytane z dziennika", icon: "▤" },
          { label: "Zadania", value: snapshot ? String(snapshot.assignments.length) : "—", note: "Prace i terminy", icon: "✓" },
          { label: "Frekwencja", value: attendanceRate === null ? "—" : `${attendanceRate}%`, note: attendanceCount ? `${presentCount} obecności z ${attendanceCount}` : "Czeka na dane", icon: "◷" },
        ].map((metric) => <article key={metric.label} className="workspace-card p-5 sm:p-6">
          <div className="flex items-start justify-between"><p className="text-xs font-semibold text-[var(--text-muted)]">{metric.label}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f0efe8] text-[var(--accent)]">{metric.icon}</span></div>
          <p className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text)]">{loading && !snapshot ? "…" : metric.value}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{metric.note}</p>
        </article>)}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
        <article className="workspace-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <div><p className="eyebrow">Rozkład dnia</p><h2 className="mt-1 text-lg font-extrabold text-[var(--text)]">Dzisiejsze lekcje</h2></div>
            <Link href="/calendar" className="rounded-lg px-3 py-2 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent-soft)]">Plan lekcji ↗</Link>
          </div>
          {loading && !snapshot ? <div className="p-8 text-sm text-[var(--text-muted)]">Pobieranie planu z EduVULCAN…</div> : todayLessons.length ? <div className="divide-y divide-[var(--border)]">
            {todayLessons.map((lesson) => <div key={lesson.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <div className="w-[58px] shrink-0"><p className="text-sm font-bold text-[var(--text)]">{formatTime(lesson.startsAt)}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{formatTime(lesson.endsAt)}</p></div>
              <span className="h-10 w-1 rounded-full bg-[var(--accent)]/30" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[var(--text)]">{lesson.subject}</p><p className="mt-1 truncate text-xs text-[var(--text-muted)]">{lesson.teacher || "Nauczyciel nieznany"}{lesson.room ? ` · sala ${lesson.room}` : ""}</p></div>
            </div>)}
          </div> : <div className="data-empty m-5 p-6 sm:m-6"><p className="text-sm font-bold text-[var(--text)]">{syncError ? "Plan lekcji jest niedostępny" : "Brak lekcji na dziś"}</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{syncError ? "Sprawdź komunikat synchronizacji powyżej." : "Jeśli to dzień szkolny, zsynchronizuj dane lub sprawdź plan lekcji."}</p></div>}
        </article>

        <article className="workspace-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <div><p className="eyebrow">Do zrobienia</p><h2 className="mt-1 text-lg font-extrabold text-[var(--text)]">Nadchodzące zadania</h2></div>
            <Link href="/assignments" className="rounded-lg px-3 py-2 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent-soft)]">Wszystkie ↗</Link>
          </div>
          {loading && !snapshot ? <div className="p-8 text-sm text-[var(--text-muted)]">Pobieranie zadań…</div> : upcomingAssignments.length ? <div className="divide-y divide-[var(--border)]">
            {upcomingAssignments.map((item) => <div key={item.id} className="px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3"><span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[var(--border)] text-[10px] text-[var(--accent)]">{item.completed ? "✓" : " "}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[var(--text)]">{item.title}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{item.subject || "Bez przedmiotu"}</p></div></div>
              <p className="ml-8 mt-2 text-[11px] font-semibold text-[var(--accent)]">{item.dueDate ? `Termin: ${formatDate(item.dueDate, { day: "numeric", month: "short" })}` : "Bez określonego terminu"}</p>
            </div>)}
          </div> : <div className="data-empty m-5 p-6 sm:m-6"><p className="text-sm font-bold text-[var(--text)]">Brak nadchodzących zadań</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Nowe prace domowe pojawią się tutaj po synchronizacji dziennika.</p></div>}
        </article>
      </section>

      <footer className="flex flex-col gap-2 border-t border-[var(--border)] py-4 text-[11px] text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>{snapshot?.student.className ? `Klasa ${snapshot.student.className}` : "Twoje szkolne centrum"}{snapshot?.student.schoolName ? ` · ${snapshot.student.schoolName}` : ""}</span>
        <span>Dane pochodzą z połączonego dziennika. Brak danych nie jest zastępowany przykładowymi wartościami.</span>
      </footer>
    </div>
  );
}
