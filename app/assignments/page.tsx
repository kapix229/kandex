"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Assignment = { id: string; title: string; subject?: string; dueDate?: string; completed: boolean };

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAssignments() {
      try {
        const response = await fetch("/api/journal/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "eduvulcan" }),
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error("Nie udało się pobrać zadań z EduVULCAN.");
        }
        setItems(data.snapshot?.assignments ?? []);
        setError(null);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setItems([]);
          setError(cause instanceof Error ? cause.message : "Nie udało się pobrać zadań.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAssignments();
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Kandex</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--text)]">Zadania</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Terminy i prace pobrane z podłączonego dziennika.</p>
      </div>
      <div className="workspace-card rounded-2xl p-5">
        {loading ? <p className="text-sm text-[var(--text-muted)]">Importuję zadania z EduVULCAN…</p> : error ? (
          <p role="alert" className="text-sm text-[#ffb0bf]">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Brak zadań do pokazania w aktualnym imporcie.</p>
        ) : (
          <div className="space-y-2">{items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--border)] bg-white/[0.025] p-4">
              <p className="font-bold text-[var(--text)]">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{item.subject ?? "Bez przedmiotu"}{item.dueDate ? ` · ${new Date(item.dueDate).toLocaleDateString("pl-PL")}` : ""}</p>
            </div>
          ))}</div>
        )}
      </div>
      <Link href="/study" className="text-sm font-bold text-[var(--accent)]">Przejdź do nauki →</Link>
    </div>
  );
}