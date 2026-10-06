"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Assignment = { id: string; title: string; subject?: string; dueDate?: string; completed: boolean };

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/journal/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "eduvulcan" }) })
      .then((r) => r.json())
      .then((data) => setItems(data.snapshot?.assignments ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Kandex</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--text)]">Zadania</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Terminy i prace pobrane z podłączonego dziennika.</p>
      </div>
      <div className="workspace-card rounded-2xl p-5">
        {loading ? <p className="text-sm text-[var(--text-muted)]">Importuję zadania…</p> : items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Brak zadań do pokazania.</p>
        ) : (
          <div className="space-y-2">{items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--border)] bg-white p-4">
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