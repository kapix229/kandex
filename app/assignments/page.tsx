"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Assignment = { id: string; title: string; subject?: string; dueDate?: string; completed: boolean };
type ImportResponse = { success?: boolean; snapshot?: { assignments?: Assignment[] }; error?: string };

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadAssignments() {
      setLoading(true);
      try {
        const response = await fetch("/api/journal/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "eduvulcan" }),
          cache: "no-store",
        });
        const data = await response.json() as ImportResponse;
        if (!response.ok || !data.success) throw new Error(data.error ?? "Nie udało się pobrać zadań z EduVULCAN.");
        if (!cancelled) { setItems(data.snapshot?.assignments ?? []); setError(null); }
      } catch (err) {
        if (!cancelled) { setItems([]); setError(err instanceof Error ? err.message : "Wystąpił błąd importu."); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAssignments();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const pending = items.filter((item) => !item.completed);
  const completed = items.length - pending.length;

  return (
    <div className="animate-fade-in space-y-7 sm:space-y-9">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="eyebrow mb-3">Spokojnie, po kolei</p><h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-[2.4rem]">Zadania</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Prace domowe i terminy pobrane z połączonego dziennika.</p></div>
        <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} className="self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-bold text-[var(--text)] hover:bg-white disabled:opacity-50">{loading ? "Synchronizuję…" : "Odśwież zadania ↻"}</button>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-[#ead0ca] bg-[#fff8f5] p-5"><p className="text-sm font-bold text-[#853f35]">Import zadań nie powiódł się</p><p className="mt-1 text-sm leading-6 text-[#8e625b]">{error}</p><Link href="/settings" className="mt-3 inline-flex text-xs font-bold text-[#853f35] underline underline-offset-4">Sprawdź połączenie →</Link></div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="workspace-card p-5"><p className="text-xs font-semibold text-[var(--text-muted)]">Wszystkie zadania</p><p className="mt-3 text-3xl font-extrabold text-[var(--text)]">{loading ? "…" : items.length}</p></article>
        <article className="workspace-card p-5"><p className="text-xs font-semibold text-[var(--text-muted)]">Do zrobienia</p><p className="mt-3 text-3xl font-extrabold text-[var(--text)]">{loading ? "…" : pending.length}</p></article>
        <article className="workspace-card p-5"><p className="text-xs font-semibold text-[var(--text-muted)]">Oznaczone jako wykonane</p><p className="mt-3 text-3xl font-extrabold text-[var(--text)]">{loading ? "…" : completed}</p></article>
      </section>

      <section className="workspace-card overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6"><p className="eyebrow">Lista zadań</p><h2 className="mt-1 text-lg font-extrabold text-[var(--text)]">Najbliższe terminy</h2></div>
        {loading ? <p className="p-8 text-sm text-[var(--text-muted)]">Pobieranie zadań z EduVULCAN…</p> : items.length ? <div className="divide-y divide-[var(--border)]">
          {[...items].sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }).map((item) => <article key={item.id} className="flex items-start gap-4 px-5 py-4 sm:px-6">
            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.completed ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-[#f0efe8] text-[var(--text-muted)]"}`}>{item.completed ? "✓" : "○"}</span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[var(--text)]">{item.title}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{item.subject ?? "Bez przedmiotu"}</p></div>
            <span className="shrink-0 rounded-lg bg-[#f4f2eb] px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)]">{item.dueDate ? new Date(item.dueDate).toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) : "Bez terminu"}</span>
          </article>)}
        </div> : <div className="data-empty m-5 p-6 sm:m-6"><p className="text-sm font-bold text-[var(--text)]">{error ? "Zadania są niedostępne" : "Nie ma zadań do pokazania"}</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{error ? "Po naprawieniu połączenia spróbuj ponownie." : "Nowe prace domowe pojawią się tutaj po imporcie z dziennika."}</p></div>}
      </section>
      <Link href="/study" className="inline-flex text-sm font-bold text-[var(--accent)] hover:underline">Przejdź do nauki →</Link>
    </div>
  );
}
