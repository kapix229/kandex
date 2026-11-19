"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import SyncButton from "@/components/SyncButton";
import AssignmentModal from "@/components/AssignmentModal";

type Assignment = {
  id: string;
  title: string;
  subject?: string;
  dueDate?: string;
  completed: boolean;
  description?: string;
};

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const loadAssignments = useCallback(async () => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

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
      const assignments = data.snapshot?.assignments ?? [];
      // Filter to show only current/upcoming assignments
      const now = new Date();
      const filtered = assignments.filter((a: Assignment) => {
        if (a.completed) return true; // Show completed
        if (!a.dueDate) return true; // Show if no due date
        return new Date(a.dueDate) >= now; // Show upcoming
      });
      setItems(filtered);
      setError(null);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setItems([]);
        setError(cause instanceof Error ? cause.message : "Nie udało się pobrać zadań.");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleOpenAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleCloseModal = () => {
    setSelectedAssignment(null);
  };

  const handleAssignmentUpdate = (updated: Assignment) => {
    setItems((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAssignment(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Kandex</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--text)]">Zadania</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Terminy i prace pobrane z podłączonego dziennika.</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncButton onSync={loadAssignments} label="Synchronizuj" disabled={loading} />
        </div>
      </div>

      <div className="workspace-card rounded-2xl p-5">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Importuję zadania z EduVULCAN…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-semibold text-[var(--text)] mb-2">Brak zadań</p>
            <p className="text-sm text-[var(--text-muted)]">Nie znaleziono aktualnych zadań domowych ani prac do oddania.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenAssignment(item)}
                className="rounded-xl border border-[var(--border)] bg-white/[0.025] p-4 hover:bg-white/[0.05] hover:border-[var(--border-strong)] transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--text)] truncate">{item.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      {item.subject && <span className="px-2 py-0.5 rounded bg-[var(--surface-muted)]">{item.subject}</span>}
                      {item.dueDate && (
                        <span className={`flex items-center gap-1 ${new Date(item.dueDate) < new Date() && !item.completed ? "text-[var(--danger)]" : ""}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {new Date(item.dueDate).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.completed && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--success)]/15 text-[var(--success)]">
                        ✓ Zakończone
                      </span>
                    )}
                    <svg
                      className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/study" className="text-sm font-bold text-[var(--accent)]">Przejdź do nauki →</Link>

      {/* Assignment Modal */}
      {selectedAssignment && (
        <AssignmentModal
          assignment={selectedAssignment}
          onClose={handleCloseModal}
          onUpdate={handleAssignmentUpdate}
        />
      )}
    </div>
  );
}