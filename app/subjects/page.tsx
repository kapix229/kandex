"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

type EduGrade = { id: string; subjectId: string; subjectName: string; value: string; type: string; date: string; weight: number };
type GradeResponse = { success?: boolean; data?: { grades?: EduGrade[] }; error?: { message?: string } };

export default function SubjectsPage() {
  const { account } = useVulcanSession();
  const [grades, setGrades] = useState<EduGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadGrades() {
      setLoading(true);
      try {
        const response = await fetch("/api/eduvulcan/grades", { cache: "no-store" });
        const result = await response.json() as GradeResponse;
        if (!response.ok || !result.success) throw new Error(result.error?.message ?? "Nie udało się pobrać ocen z EduVULCAN.");
        const nextGrades = result.data?.grades ?? [];
        if (!cancelled) {
          setGrades(nextGrades);
          setSelectedSubject((current) => current ?? nextGrades[0]?.subjectName ?? null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setGrades([]);
          setError(err instanceof Error ? err.message : "Wystąpił błąd podczas pobierania ocen.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadGrades();
    return () => { cancelled = true; };
  }, []);

  const summaries = useMemo(() => {
    const grouped = new Map<string, EduGrade[]>();
    for (const grade of grades) {
      const rows = grouped.get(grade.subjectName) ?? [];
      rows.push(grade);
      grouped.set(grade.subjectName, rows);
    }
    return [...grouped.entries()].map(([subject, rows]) => {
      const numeric = rows.map((grade) => Number(grade.value)).filter(Number.isFinite);
      return { subject, rows: [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), count: rows.length, average: numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : null };
    }).sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
  }, [grades]);

  const active = summaries.find((item) => item.subject === selectedSubject) ?? summaries[0] ?? null;
  const overallAverage = summaries.length ? summaries.reduce((sum, item) => sum + (item.average ?? 0), 0) / summaries.length : null;

  return (
    <div className="animate-fade-in space-y-7 sm:space-y-9">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="eyebrow mb-3">Twój postęp</p><h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-[2.4rem]">Oceny</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Rzeczywiste oceny pobierane z połączonego EduVULCAN.</p></div>
        <Link href="/settings" className="self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-bold text-[var(--text)] hover:bg-white">Ustawienia dziennika ↗</Link>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-[#ead0ca] bg-[#fff8f5] p-5"><p className="text-sm font-bold text-[#853f35]">Nie udało się pobrać ocen</p><p className="mt-1 text-sm leading-6 text-[#8e625b]">{error}</p><p className="mt-2 text-xs text-[#8e625b]">Sprawdź, czy sesja EduVULCAN jest aktywna, a następnie odśwież stronę.</p></div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="workspace-card p-5 sm:p-6"><p className="text-xs font-semibold text-[var(--text-muted)]">Średnia z przedmiotów</p><p className="mt-4 text-3xl font-extrabold text-[var(--text)]">{overallAverage === null ? "—" : overallAverage.toFixed(2)}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Średnia nieważona</p></article>
        <article className="workspace-card p-5 sm:p-6"><p className="text-xs font-semibold text-[var(--text-muted)]">Przedmioty z ocenami</p><p className="mt-4 text-3xl font-extrabold text-[var(--text)]">{loading ? "…" : summaries.length}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Na podstawie zaimportowanych danych</p></article>
        <article className="workspace-card p-5 sm:p-6"><p className="text-xs font-semibold text-[var(--text-muted)]">Wszystkie oceny</p><p className="mt-4 text-3xl font-extrabold text-[var(--text)]">{loading ? "…" : grades.length}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Zapisane w dzienniku</p></article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]">
        <aside className="workspace-card p-4 sm:p-5">
          <div className="mb-4 px-2"><p className="eyebrow">Przedmioty</p><h2 className="mt-1 text-lg font-extrabold text-[var(--text)]">Lista ocen</h2></div>
          {loading ? <p className="p-4 text-sm text-[var(--text-muted)]">Pobieranie ocen…</p> : summaries.length ? <div className="space-y-1.5">
            {summaries.map((item) => <button type="button" key={item.subject} onClick={() => setSelectedSubject(item.subject)} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${active?.subject === item.subject ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[#f5f4ee] text-[var(--text)]"}`}>
              <span className="min-w-0"><span className="block truncate text-sm font-bold">{item.subject}</span><span className="mt-1 block text-[11px] opacity-70">{item.count} {item.count === 1 ? "ocena" : "ocen"}</span></span>
              <span className="rounded-lg bg-white px-2.5 py-1.5 text-sm font-extrabold">{item.average === null ? "—" : item.average.toFixed(2)}</span>
            </button>)}
          </div> : <div className="data-empty p-5"><p className="text-sm font-bold text-[var(--text)]">Brak ocen</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{error ? "Dane nie są obecnie dostępne." : "Po pobraniu ocen pojawią się tutaj."}</p></div>}
        </aside>

        <section className="workspace-card overflow-hidden">
          <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6"><p className="eyebrow">Szczegóły</p><div className="mt-1 flex items-center justify-between gap-4"><h2 className="text-xl font-extrabold text-[var(--text)]">{active?.subject ?? "Wybierz przedmiot"}</h2>{active && <span className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-lg font-extrabold text-[var(--accent)]">{active.average === null ? "—" : active.average.toFixed(2)}</span>}</div></div>
          {loading ? <p className="p-8 text-sm text-[var(--text-muted)]">Pobieranie danych z EduVULCAN…</p> : active ? <div className="divide-y divide-[var(--border)]">
            {active.rows.map((grade) => <div key={grade.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-extrabold ${Number(grade.value) >= 5 ? "bg-[#e5efe6] text-[#315b43]" : Number(grade.value) >= 3 ? "bg-[#f4efe0] text-[#8b6b2d]" : "bg-[#f8e9e5] text-[#9b493c]"}`}>{grade.value}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[var(--text)]">{grade.type || "Ocena"}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{grade.weight ? `Waga ${grade.weight} · ` : ""}{new Date(grade.date).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}</p></div>
            </div>)}
          </div> : <div className="data-empty m-5 p-6"><p className="text-sm font-bold text-[var(--text)]">Nie ma jeszcze ocen do pokazania</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Sprawdź połączenie i spróbuj ponownie później.</p></div>}
        </section>
      </section>
      <p className="text-[11px] leading-5 text-[var(--text-muted)]">Oceny i średnie są wyliczane z danych zwróconych przez EduVULCAN. Średnia na tej stronie nie uwzględnia wag.</p>
    </div>
  );
}
