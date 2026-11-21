"use client";

import { useEffect, useState, useCallback } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import { VulcanGrade, VulcanGradeSummary } from "@/types/vulcan";
import SyncButton from "@/components/SyncButton";
import { GradesSummary } from "@/components/GradesSummary";
import Link from "next/link";
import {
  Award,
  Calculator,
  Filter,
  ChevronDown,
  ChevronRight,
  Search,
  BarChart2,
} from "lucide-react";

type GradeFromAPI = {
  id: string;
  subjectId: string;
  subjectName: string;
  displayValue: string;
  value: number;
  type: string;
  date: string;
  weight: number;
};

type GradesResponse = {
  success: boolean;
  data?: {
    grades: GradeFromAPI[];
  };
  error?: { message?: string };
};

type Semester = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
};

export default function GradesPage() {
  const { account, signOut } = useVulcanSession();
  const [summaries, setSummaries] = useState<VulcanGradeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "average", direction: "desc" });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [initialLoad, setInitialLoad] = useState(true);

  async function handleLogout() {
    try {
      await fetch("/api/eduvulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  }

  const loadGrades = useCallback(async (signal?: AbortSignal): Promise<VulcanGradeSummary[]> => {
    const res = await fetch("/api/eduvulcan/grades", { cache: "no-store", signal });
    const data: GradesResponse = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error?.message ?? "Nie udało się pobrać ocen z EduVULCAN.");
    }

    const rawGrades = data.data?.grades ?? [];

    const grouped = new Map<string, VulcanGrade[]>();
    for (const grade of rawGrades) {
      const subject = grade.subjectName || "Inne";
      const numericValue = grade.value;
      if (!Number.isFinite(numericValue)) continue;

      const normalized: VulcanGrade = {
        id: grade.id,
        subject,
        title: grade.type || "Ocena",
        value: numericValue,
        displayValue: grade.displayValue,
        weight: Number(grade.weight) > 0 ? Number(grade.weight) : 1,
        teacher: "",
        date: new Date(grade.date),
      };
      grouped.set(subject, [...(grouped.get(subject) ?? []), normalized]);
    }
    const parsed: VulcanGradeSummary[] = Array.from(grouped.entries()).map(([subject, grades]) => ({
      subject,
      average: grades.reduce((sum, grade) => sum + grade.value, 0) / grades.length,
      count: grades.length,
      grades: grades.sort((a, b) => b.date.getTime() - a.date.getTime()),
    }));

    // Sort by average descending (best subjects first) by default
    parsed.sort((a, b) => b.average - a.average);

    return parsed;
  }, []);

  const handleSync = useCallback(async () => {
    await loadGrades();
  }, [loadGrades]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialLoad) return;
    const controller = new AbortController();
    let cancelled = false;

    loadGrades(controller.signal)
      .then((parsed) => {
        if (!cancelled) {
          setSummaries(parsed);
          if (parsed.length > 0) setSelectedSubject(parsed[0].subject);
          // Initialize expanded subjects - expand first 3 by default
          const initialExpanded = new Set(parsed.slice(0, 3).map(s => s.subject));
          setExpandedSubjects(initialExpanded);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          const message = err instanceof Error ? err.message : "Nieznany błąd";
          setError(`Błąd sieci: ${message}`);
          setSummaries([]);
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
  }, [loadGrades, initialLoad]);

  // Overall average across all subjects
  const overallAverage =
    summaries.length > 0
      ? summaries.reduce((s, x) => s + x.average, 0) / summaries.length
      : 0;

  const totalGrades = summaries.reduce((s, x) => s + x.count, 0);

  // Filter summaries based on search
  const filteredSummaries = summaries.filter(s =>
    s.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort summaries
  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    const aVal = a[sortConfig.key as keyof VulcanGradeSummary];
    const bVal = b[sortConfig.key as keyof VulcanGradeSummary];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const activeSummary =
    sortedSummaries.find((s) => s.subject === selectedSubject) ?? sortedSummaries[0] ?? null;

  // Auto-select first if current selection not in filtered
  if (activeSummary && !selectedSubject) {
    setSelectedSubject(activeSummary.subject);
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subject)) {
        next.delete(subject);
      } else {
        next.add(subject);
      }
      return next;
    });
  };

  const getGradeColorClass = (value: number) => {
    if (value >= 5.5) return "grade-value-6";
    if (value >= 4.5) return "grade-value-5";
    if (value >= 3.5) return "grade-value-4";
    if (value >= 2.5) return "grade-value-3";
    if (value >= 1.5) return "grade-value-2";
    return "grade-value-1";
  };

  const getGradeColor = (value: number) => {
    if (value >= 5.5) return "text-[var(--info)]";
    if (value >= 4.5) return "text-[var(--success)]";
    if (value >= 3.5) return "text-[var(--warning)]";
    if (value >= 2.5) return "text-[var(--danger)]";
    return "text-[var(--danger)]";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWeightLabel = (weight: number) => {
    if (weight === 3) return "Sprawdzian";
    if (weight === 2) return "Kartkówka";
    return "Aktywność";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dziennik</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Oceny</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Przeglądaj i analizuj swoje oceny z EduVULCAN
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj przedmiotu…"
              className="input pl-10 pr-4 w-64"
              aria-label="Szukaj przedmiotu"
            />
          </div>
          <SyncButton onSync={handleSync} label="Synchronizuj" disabled={loading} />
          {account && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-tertiary)] hidden sm:block">
                Zalogowano jako <span className="font-semibold">{account.fullName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Wyloguj
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-[var(--danger-muted)] border border-[var(--danger-border)] text-[var(--danger)] rounded-xl px-4 py-3 text-sm animate-slide-down">
          {error}
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up stagger-children">
        <Link href="/grades" className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Średnia ogólna</p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--text)] tabular-nums font-mono">
                {overallAverage > 0 ? overallAverage.toFixed(2) : "—"}
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)]">
              <Award className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>
        </Link>
        <Link href="/grades" className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Przedmioty</p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--text)] tabular-nums font-mono">
                {summaries.length}
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--success-muted)] text-[var(--success)]">
              <BarChart2 className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>
        </Link>
        <Link href="/grades" className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Wszystkie oceny</p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--text)] tabular-nums font-mono">
                {totalGrades}
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--warning-muted)] text-[var(--warning)]">
              <Calculator className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text)]">Przedmioty</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-ghost text-xs gap-1"
              >
                <Filter className="h-3.5 w-3.5" strokeWidth={2} />
                Filtry
              </button>
            </div>

            {showFilters && (
              <div className="space-y-3 mb-4 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] animate-slide-down">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">Semestr</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="input w-full"
                  >
                    <option value="all">Wszystkie semestry</option>
                    <option value="current">Semestr bieżący</option>
                    <option value="previous">Semestr poprzedni</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">Sortuj</label>
                  <select
                    value={sortConfig.key}
                    onChange={(e) => handleSort(e.target.value)}
                    className="input w-full"
                  >
                    <option value="average">Średnia (malejąco)</option>
                    <option value="subject">Nazwa przedmiotu</option>
                    <option value="count">Liczba ocen</option>
                  </select>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]" />
                ))}
              </div>
            ) : sortedSummaries.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" strokeWidth={1.5} />
                <p className="font-semibold text-[var(--text)] mb-1">Brak ocen do wyświetlenia</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {searchQuery ? "Spróbuj zmienić zapytanie." : "Sprawdź, czy w dzienniku są już opublikowane oceny."}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {sortedSummaries.map((s) => {
                  const isActive = s.subject === selectedSubject;
                  const isExpanded = expandedSubjects.has(s.subject);
                  const avgColor = getGradeColor(s.average);

                  return (
                    <div key={s.subject} className="group">
                      <button
                        onClick={() => setSelectedSubject(s.subject)}
                        className={`w-full text-left rounded-xl p-4 transition-all ${
                          isActive
                            ? "bg-[var(--accent-primary-muted)] border border-[var(--accent-primary-border)] ring-1 ring-[var(--accent-primary-muted)]"
                            : "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${isActive ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                              {s.subject}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                              <span>{s.count} {s.count === 1 ? "ocena" : s.count <= 4 ? "oceny" : "ocen"}</span>
                              {s.grades[0]?.teacher && (
                                <>
                                  <span>·</span>
                                  <span className="truncate max-w-[120px]">{s.grades[0].teacher}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <div
                              className={`px-3 py-1.5 rounded-xl text-lg font-bold tabular-nums font-mono ${avgColor} ${
                                isActive ? "" : "group-hover:bg-[var(--surface-hover)]"
                              }`}
                            >
                              {s.average.toFixed(2)}
                            </div>
                            {isExpanded && !isActive && (
                              <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)] transition-transform" strokeWidth={2} />
                            )}
                            {!isExpanded && !isActive && (
                              <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] transition-transform" strokeWidth={2} />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded grades preview */}
                      {isExpanded && !isActive && (
                        <div className="mt-2 ml-10 border-l border-[var(--border)] pl-3 animate-slide-down">
                          {s.grades.slice(0, 3).map((g) => (
                            <div
                              key={g.id}
                              className="flex items-center justify-between py-2 text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[var(--text)] truncate">{g.title}</p>
                                <p className="text-xs text-[var(--text-tertiary)]">
                                  {formatDate(g.date.toISOString())} · {getWeightLabel(g.weight)}
                                </p>
                              </div>
                              <span
                                className={`grade-badge ${getGradeColorClass(g.value)} flex-shrink-0 ml-2`}
                              >
                                {g.displayValue}
                              </span>
                            </div>
                          ))}
                          {s.grades.length > 3 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubject(s.subject);
                              }}
                              className="text-xs font-medium text-[var(--accent)] hover:underline w-full text-left py-1"
                            >
                              Pokaż wszystkie {s.grades.length} ocen →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Grades Detail */}
        <div className="lg:col-span-2">
          {activeSummary ? (
            <div className="card p-6 animate-slide-in-left">
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[var(--text)]">{activeSummary.subject}</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {activeSummary.count} {activeSummary.count === 1 ? "ocena" : activeSummary.count <= 4 ? "oceny" : "ocen"} ·
                      Nauczyciel: {activeSummary.grades[0]?.teacher ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Średnia przedmiotu</p>
                      <p className={`text-3xl font-extrabold tabular-nums font-mono ${getGradeColor(activeSummary.average)}`}>
                        {activeSummary.average.toFixed(2)}
                      </p>
                    </div>
                    <Link
                      href="/grades"
                      className="btn-secondary text-sm"
                    >
                      <BarChart2 className="h-4 w-4" strokeWidth={2} />
                      Szczegóły
                    </Link>
                  </div>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="mb-6 p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Rozkład ocen</h3>
                <div className="flex flex-wrap gap-2">
                  {["6", "5", "4", "3", "2", "1"].map((gradeVal) => {
                    const count = activeSummary.grades.filter(g => Math.floor(g.value) === parseInt(gradeVal)).length;
                    const percentage = activeSummary.count > 0 ? (count / activeSummary.count) * 100 : 0;
                    return (
                      <div
                        key={gradeVal}
                        className="flex-1 min-w-[50px] max-w-[80px]"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-[var(--text)]">{gradeVal}</span>
                          <span className="text-[var(--text-tertiary)]">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getGradeColorClass(parseInt(gradeVal) + 0.5)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grades Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border)]">
                      <th className="py-3 px-4 font-medium">Ocena</th>
                      <th className="py-3 px-4 font-medium">Tytuł</th>
                      <th className="py-3 px-4 font-medium">Typ / Waga</th>
                      <th className="py-3 px-4 font-medium">Data</th>
                      <th className="py-3 px-4 font-medium">Komentarz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSummary.grades.map((g) => (
                      <tr
                        key={g.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className={`grade-badge ${getGradeColorClass(g.value)}`}>
                            {g.displayValue}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text)]">
                          <p className="font-medium">{g.title}</p>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          <div className="flex items-center gap-2">
                            <span className={`badge ${g.weight === 3 ? "badge-danger" : g.weight === 2 ? "badge-warning" : "badge-neutral"}`}>
                              {getWeightLabel(g.weight)}
                            </span>
                            <span className="text-xs font-mono tabular-nums text-[var(--text-tertiary)]">waga {g.weight}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-mono tabular-nums">
                          {formatDate(g.date.toISOString())}
                        </td>
                        <td className="py-3 px-4">
                          {g.comment ? (
                            <p className="text-xs text-[var(--text-tertiary)] max-w-xs truncate">{g.comment}</p>
                          ) : (
                            <span className="text-xs text-[var(--text-tertiary)] italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subject stats */}
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Statystyki przedmiotu</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Prosta średnia</p>
                    <p className="mt-1 text-xl font-bold text-[var(--text)] tabular-nums font-mono">
                      {(activeSummary.grades.reduce((s, g) => s + g.value, 0) / activeSummary.grades.length).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Najwyższa ocena</p>
                    <p className="mt-1 text-xl font-bold text-[var(--success)] tabular-nums font-mono">
                      {Math.max(...activeSummary.grades.map(g => g.value)).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Najniższa ocena</p>
                    <p className="mt-1 text-xl font-bold text-[var(--danger)] tabular-nums font-mono">
                      {Math.min(...activeSummary.grades.map(g => g.value)).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Średnia ważona</p>
                    <p className="mt-1 text-xl font-bold text-[var(--accent)] tabular-nums font-mono">
                      {activeSummary.average.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center animate-fade-in">
              <Award className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Wybierz przedmiot</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Kliknij przedmiot z listy po lewej, aby zobaczyć szczegóły ocen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}