"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import SyncButton from "@/components/SyncButton";
import AssignmentModal from "@/components/AssignmentModal";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import {
  ClipboardList,
  BookMarked,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Assignment = {
  id: string;
  title: string;
  subject?: string;
  dueDate?: string;
  completed: boolean;
  description?: string;
  type?: "assignment" | "test" | "exam";
};


export default function AssignmentsPage() {
  const { account, signOut } = useVulcanSession();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<"all" | "this-week" | "next-week" | "later" | "completed">("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "dueDate", direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  const loadAssignments = useCallback(async (signal?: AbortSignal): Promise<Assignment[]> => {
    const response = await fetch("/api/journal/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "eduvulcan" }),
      cache: "no-store",
      signal,
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error("Nie udało się pobrać zadań z EduVULCAN.");
    }
    const assignments = data.snapshot?.assignments ?? [];
    // Also include exams/tests from events
    const events = data.snapshot?.exams ?? [];
    return [
      ...assignments.map((a: Record<string, unknown>) => ({
        ...a,
        type: "assignment" as const,
      })),
      ...events.map((e: Record<string, unknown>) => ({
        id: e.id,
        title: e.title,
        subject: e.subject,
        dueDate: e.date,
        completed: e.completed,
        description: e.description,
        type: e.type === "exam" ? "exam" : "test" as const,
      })),
    ];
  }, []);

  const handleSync = useCallback(async () => {
    await loadAssignments();
  }, [loadAssignments]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialLoad) return;
    const controller = new AbortController();
    let cancelled = false;

    loadAssignments(controller.signal)
      .then((items) => {
        if (!cancelled) {
          setItems(items);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled && !(cause instanceof DOMException && cause.name === "AbortError")) {
          setItems([]);
          setError(cause instanceof Error ? cause.message : "Nie udało się pobrać zadań.");
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
  }, [loadAssignments, initialLoad]);

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

  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfNextWeek = new Date(startOfThisWeek);
  startOfNextWeek.setDate(startOfThisWeek.getDate() + 7);

  const getFilterLabel = (f: string) => {
    switch (f) {
      case "all": return "Wszystkie";
      case "this-week": return "Ten tydzień";
      case "next-week": return "Następny tydzień";
      case "later": return "Później";
      case "completed": return "Zakończone";
      default: return f;
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "completed") return item.completed;
    if (filter === "all") return !item.completed;

    if (!item.dueDate) return filter === "later";

    const dueDate = new Date(item.dueDate);
    if (dueDate < startOfThisWeek) return filter === "this-week"; // Overdue shown in this week
    if (dueDate < startOfNextWeek) return filter === "this-week";
    if (dueDate < new Date(startOfNextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) return filter === "next-week";
    return filter === "later";
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
  });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Brak terminu";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isOverdue = (dateStr?: string, completed = false) => {
    if (!dateStr || completed) return false;
    return new Date(dateStr) < now;
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "exam": return <BookMarked className="h-4 w-4" strokeWidth={2} />;
      case "test": return <BookMarked className="h-4 w-4" strokeWidth={2} />;
      default: return <ClipboardList className="h-4 w-4" strokeWidth={2} />;
    }
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "exam": return <span className="badge badge-danger">Sprawdzian</span>;
      case "test": return <span className="badge badge-warning">Kartkówka</span>;
      default: return <span className="badge badge-primary">Zadanie</span>;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "exam": return "text-[var(--danger)] bg-[var(--danger-muted)]";
      case "test": return "text-[var(--warning)] bg-[var(--warning-muted)]";
      default: return "text-[var(--accent)] bg-[var(--accent-primary-muted)]";
    }
  };

  async function handleLogout() {
    try {
      await fetch("/api/eduvulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dziennik</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Zadania i sprawdziany</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Terminy i prace pobrane z podłączonego dziennika</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SyncButton onSync={handleSync} label="Synchronizuj" disabled={loading} />
          {account && (
            <button onClick={handleLogout} className="btn-secondary">Wyloguj</button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up stagger-children">
        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Zadania domowe</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text)] tabular-nums font-mono">
                {items.filter(i => i.type === "assignment" && !i.completed).length}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-primary-muted)] text-[var(--accent)]">
              <ClipboardList className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Sprawdziany</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--danger)] tabular-nums font-mono">
                {items.filter(i => i.type === "exam" && !i.completed).length}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--danger-muted)] text-[var(--danger)]">
              <BookMarked className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Kartkówki</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--warning)] tabular-nums font-mono">
                {items.filter(i => i.type === "test" && !i.completed).length}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--warning-muted)] text-[var(--warning)]">
              <BookMarked className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Zakończone</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--success)] tabular-nums font-mono">
                {items.filter(i => i.completed).length}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--success-muted)] text-[var(--success)]">
              <CheckCircle className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "this-week", "next-week", "later", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-[var(--accent)] text-[var(--text-inverse)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {getFilterLabel(f)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-ghost text-sm gap-1"
            >
              {showFilters ? <ChevronUp className="h-4 w-4" strokeWidth={2} /> : <ChevronDown className="h-4 w-4" strokeWidth={2} />}
              Filtry
            </button>
            <div className="hidden sm:block">
              <select
                value={sortConfig.key}
                onChange={(e) => handleSort(e.target.value)}
                className="input w-auto min-w-[140px]"
              >
                <option value="dueDate">Termin (rosnąco)</option>
                <option value="title">Tytuł</option>
                <option value="subject">Przedmiot</option>
                <option value="type">Typ</option>
              </select>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">Przedmiot</label>
                <select className="input w-full">
                  <option value="">Wszystkie</option>
                  {Array.from(new Set(items.map(i => i.subject).filter(Boolean))).map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">Typ</label>
                <select className="input w-full">
                  <option value="">Wszystkie</option>
                  <option value="assignment">Zadanie domowe</option>
                  <option value="test">Kartkówka</option>
                  <option value="exam">Sprawdzian</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">Status</label>
                <select className="input w-full">
                  <option value="">Wszystkie</option>
                  <option value="pending">Do zrobienia</option>
                  <option value="completed">Zakończone</option>
                  <option value="overdue">Przeterminowane</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignments List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl" />
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
              {filter === "completed" ? "Brak zakończonych zadań" : "Brak zadań do wyświetlenia"}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              {filter === "completed"
                ? "Zakończone zadania pojawią się tutaj."
                : "Nie znaleziono aktualnych zadań domowych ani sprawdzianów dla wybranego filtra."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenAssignment(item)}
                className="p-4 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={getTypeColor(item.type)}>
                        {getTypeIcon(item.type)}
                      </span>
                      <h3 className="font-semibold text-[var(--text)] truncate max-w-[400px]">{item.title}</h3>
                      {getTypeBadge(item.type)}
                      {isOverdue(item.dueDate, item.completed) && (
                        <span className="badge badge-danger">Przeterminowane</span>
                      )}
                      {item.completed && (
                        <span className="badge badge-success">Zakończone</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-tertiary)]">
                      {item.subject && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                          <span className="text-xs">{item.subject}</span>
                        </span>
                      )}
                      {item.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue(item.dueDate, item.completed) ? "text-[var(--danger)]" : ""}`}>
                          <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                          {formatDate(item.dueDate)}
                          {isOverdue(item.dueDate, item.completed) && (
                            <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                          )}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.completed && (
                      <CheckCircle className="h-6 w-6 text-[var(--success)]" strokeWidth={2} />
                    )}
                    <Clock className="h-5 w-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" strokeWidth={2} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/learning" className="text-sm font-bold text-[var(--accent)] hover:underline flex items-center gap-1">
        Przejdź do nauki
        <Calendar className="h-4 w-4" strokeWidth={2} />
      </Link>

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