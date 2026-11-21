"use client";

import { useEffect, useState, useCallback } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { safeParseDate } from "@/services/grade-calculator";

type AttendanceEntry = {
  date: string;
  lesson: number;
  subject: string;
  status: "present" | "absent" | "late" | "excused" | "unknown";
};

type AttendanceData = {
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    unknown: number;
  };
  entries: AttendanceEntry[];
};

type SubjectAttendance = {
  subject: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percentage: number;
};

export default function AttendancePage() {
  const { account, signOut } = useVulcanSession();
  const [attendance, setAttendance] = useState<AttendanceData>({
    summary: { present: 0, absent: 0, late: 0, excused: 0, unknown: 0 },
    entries: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"overview" | "calendar" | "subjects">("overview");

  const loadAttendance = async (signal?: AbortSignal): Promise<AttendanceData> => {
    const res = await fetch("/api/v1/attendance", { cache: "no-store", signal });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error("Nie udało się pobrać frekwencji.");
    }
    return {
      summary: data.data?.summary ?? { present: 0, absent: 0, late: 0, excused: 0, unknown: 0 },
      entries: data.data?.entries ?? [],
    };
  };

  const handleSync = useCallback(async () => {
    await loadAttendance();
  }, [loadAttendance]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialLoad) return;
    const controller = new AbortController();
    let cancelled = false;

    loadAttendance(controller.signal)
      .then((attendanceData) => {
        if (!cancelled) {
          setAttendance(attendanceData);
        }
      })
      .catch((err) => {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Błąd sieci");
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
  }, [initialLoad]);

  const summary = attendance.summary;
  const entries = attendance.entries;
  const total = summary.present + summary.absent + summary.late + summary.excused + summary.unknown;
  const rate = total > 0 ? Math.round(((summary.present + summary.late) / total) * 100) : 0;

  // Calculate subject attendance
  const subjectAttendance: SubjectAttendance[] = entries.length > 0
    ? Object.entries(
        entries.reduce((acc, entry) => {
          if (!acc[entry.subject]) {
            acc[entry.subject] = { present: 0, absent: 0, late: 0, excused: 0 };
          }
          if (entry.status === "present") acc[entry.subject].present++;
          else if (entry.status === "absent") acc[entry.subject].absent++;
          else if (entry.status === "late") acc[entry.subject].late++;
          else if (entry.status === "excused") acc[entry.subject].excused++;
          return acc;
        }, {} as Record<string, { present: number; absent: number; late: number; excused: number }>)
      ).map(([subject, counts]) => {
        const total = counts.present + counts.absent + counts.late + counts.excused;
        const percentage = total > 0 ? ((counts.present + counts.late + counts.excused) / total) * 100 : 0;
        return { subject, ...counts, total, percentage: Math.round(percentage * 100) / 100 };
      }).sort((a, b) => b.percentage - a.percentage)
    : [];

  // Monthly calendar
  const generateCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayWeekDay = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      date: string;
      dayOfMonth: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      status: "present" | "absent" | "late" | "excused" | "unknown";
    }> = [];

    // Previous month days
    for (let i = 0; i < firstDayWeekDay; i++) {
      const dayNum = prevMonthLastDay - firstDayWeekDay + i + 1;
      const date = new Date(year, month - 1, dayNum);
      days.push({
        date: date.toISOString().slice(0, 10),
        dayOfMonth: dayNum,
        isCurrentMonth: false,
        isToday: false,
        status: "unknown",
      });
    }

    // Current month days
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEntries = entries.filter((e) => {
        const entryDate = safeParseDate(e.date);
        if (!entryDate) return false;
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.toISOString().slice(0, 10) === dateStr;
      });

      let status: "present" | "absent" | "late" | "excused" | "unknown" = "unknown";
      if (dayEntries.length > 0) {
        // Take the last entry's status for the day
        const lastEntry = dayEntries[dayEntries.length - 1];
        status = lastEntry.status;
      }

      days.push({
        date: dateStr,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        status,
      });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      days.push({
        date: d.toISOString().slice(0, 10),
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
        status: "unknown",
      });
    }

    return days;
  };

  const calendarDays = generateCalendar(selectedMonth.getFullYear(), selectedMonth.getMonth());
  const monthName = selectedMonth.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
  const weekDays = ["Nd", "Pn", "Wt", "Śr", "Czw", "Pt", "Sb"];

  const prevMonth = () => setSelectedMonth(d => {
    const next = new Date(d);
    next.setMonth(d.getMonth() - 1);
    return next;
  });
  const nextMonth = () => setSelectedMonth(d => {
    const next = new Date(d);
    next.setMonth(d.getMonth() + 1);
    return next;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-[var(--success)]";
      case "absent": return "bg-[var(--danger)]";
      case "late": return "bg-[var(--warning)]";
      case "excused": return "bg-[var(--info)]";
      default: return "bg-[var(--border)]";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present": return "Obecny";
      case "absent": return "Nieobecny";
      case "late": return "Spóźnienie";
      case "excused": return "Usprawiedliwiony";
      default: return "Nieznany";
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

  if (total === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dziennik</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Frekwencja</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Przeglądaj swoją frekwencję szkolną</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SyncButton onSync={handleSync} label="Synchronizuj" disabled={loading} />
            {account && (
              <button onClick={handleLogout} className="btn-secondary">Wyloguj</button>
            )}
          </div>
        </div>

        <div className="card p-12 text-center">
          <Activity className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Brak danych o frekwencji</h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            Dane frekwencji nie zostały jeszcze zsynchronizowane.
          </p>
          <SyncButton onSync={handleSync} label="Synchronizuj z EduVULCAN" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dziennik</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Frekwencja</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Przeglądaj swoją frekwencję szkolną</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden sm:flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
            {(["overview", "calendar", "subjects"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode
                    ? "bg-[var(--accent)] text-[var(--text-inverse)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                {mode === "overview" && <TrendingUp className="h-4 w-4" strokeWidth={2} />}
                {mode === "calendar" && <Calendar className="h-4 w-4" strokeWidth={2} />}
                {mode === "subjects" && <Activity className="h-4 w-4" strokeWidth={2} />}
              </button>
            ))}
          </div>
          <SyncButton onSync={handleSync} label="Synchronizuj" disabled={loading} />
          {account && (
            <button onClick={handleLogout} className="btn-secondary">Wyloguj</button>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-slide-up stagger-children">
        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Ogólny wynik</p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--text)] tabular-nums font-mono">
                {rate}%
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--success-muted)] text-[var(--success)]">
              <TrendingUp className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                rate >= 90 ? "bg-[var(--success)]" : rate >= 75 ? "bg-[var(--warning)]" : "bg-[var(--danger)]"
              }`}
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>

        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Obecności</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--success)] tabular-nums font-mono">
                {summary.present}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--success-muted)] text-[var(--success)]">
              <CheckCircle className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Spóźnienia</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--warning)] tabular-nums font-mono">
                {summary.late}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--warning-muted)] text-[var(--warning)]">
              <Clock className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Nieobecności</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--danger)] tabular-nums font-mono">
                {summary.absent}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--danger-muted)] text-[var(--danger)]">
              <XCircle className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Usprawiedliwione</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--info)] tabular-nums font-mono">
                {summary.excused}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--info-muted)] text-[var(--info)]">
              <AlertCircle className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly View */}
          <div className="card p-5">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Tygodniowy widok</h2>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const firstDayOfWeek = new Date(today);
              firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

              const weekStats = Array.from({ length: 5 }, (_, i) => {
                const day = new Date(firstDayOfWeek);
                day.setDate(firstDayOfWeek.getDate() + i);
                const dayKey = day.toISOString().slice(0, 10);

                const dayEntries = entries.filter((e) => {
                  const entryDate = safeParseDate(e.date);
                  if (!entryDate) return false;
                  entryDate.setHours(0, 0, 0, 0);
                  return entryDate.toISOString().slice(0, 10) === dayKey;
                });

                const present = dayEntries.filter((e) => e.status === "present").length;
                const absent = dayEntries.filter((e) => e.status === "absent").length;
                const late = dayEntries.filter((e) => e.status === "late").length;
                const excused = dayEntries.filter((e) => e.status === "excused").length;
                const total = dayEntries.length;
                const percentage = total > 0 ? ((present + late + excused) / total) * 100 : 0;

                const dayNames = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
                return {
                  day: dayNames[i],
                  date: dayKey,
                  present,
                  absent,
                  late,
                  excused,
                  total,
                  percentage: Math.round(percentage * 100) / 100,
                  isToday: dayKey === today.toISOString().slice(0, 10),
                };
              });

              return (
                <div className="grid grid-cols-5 gap-2">
                  {weekStats.map((ws) => (
                    <div
                      key={ws.date}
                      className={`p-3 rounded-xl text-center transition-all ${
                        ws.isToday ? "bg-[var(--accent-primary-muted)] ring-1 ring-[var(--accent)]" : "bg-[var(--surface)] border border-[var(--border)]"
                      }`}
                    >
                      <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                        ws.isToday ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
                      }`}>
                        {ws.day}
                      </p>
                      <p className={`mt-1 text-2xl font-extrabold tabular-nums font-mono ${
                        ws.percentage >= 90 ? "text-[var(--success)]" : ws.percentage >= 75 ? "text-[var(--warning)]" : "text-[var(--danger)]"
                      }`}>
                        {ws.total > 0 ? `${ws.percentage}%` : "—"}
                      </p>
                      <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ws.percentage >= 90 ? "bg-[var(--success)]" : ws.percentage >= 75 ? "bg-[var(--warning)]" : "bg-[var(--danger)]"
                          }`}
                          style={{ width: `${ws.percentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {ws.present + ws.late}/{ws.total}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Subject Breakdown */}
          <div className="card p-5">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Frekwencja po przedmiotach</h2>
            {subjectAttendance.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {subjectAttendance.map((sa) => (
                  <div
                    key={sa.subject}
                    className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-[var(--text)] truncate max-w-[200px]">{sa.subject}</p>
                      <span className={`text-sm font-bold tabular-nums font-mono ${
                        sa.percentage >= 90 ? "text-[var(--success)]" : sa.percentage >= 75 ? "text-[var(--warning)]" : "text-[var(--danger)]"
                      }`}>
                        {sa.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sa.percentage >= 90 ? "bg-[var(--success)]" : sa.percentage >= 75 ? "bg-[var(--warning)]" : "bg-[var(--danger)]"
                        }`}
                        style={{ width: `${sa.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1 text-[var(--success)]">{sa.present} <CheckCircle className="h-3 w-3" strokeWidth={2} /></span>
                      <span className="flex items-center gap-1 text-[var(--warning)]">{sa.late} <Clock className="h-3 w-3" strokeWidth={2} /></span>
                      <span className="flex items-center gap-1 text-[var(--danger)]">{sa.absent} <XCircle className="h-3 w-3" strokeWidth={2} /></span>
                      <span className="flex items-center gap-1 text-[var(--info)]">{sa.excused} <AlertCircle className="h-3 w-3" strokeWidth={2} /></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-[var(--text-tertiary)]">Brak danych o przedmiotach</p>
            )}
          </div>
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text)]">Miesięczny kalendarz</h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="btn-ghost p-2" aria-label="Poprzedni miesiąc">
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <span className="text-sm font-semibold text-[var(--text)] min-w-[160px] text-center capitalize">{monthName}</span>
              <button onClick={nextMonth} className="btn-ghost p-2" aria-label="Następny miesiąc">
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`aspect-square relative rounded-lg border transition-all ${
                  day.isCurrentMonth
                    ? day.isToday
                      ? "bg-[var(--accent-primary-muted)] border-[var(--accent)] ring-1 ring-[var(--accent)]"
                      : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                    : "bg-[var(--bg-secondary)] border-[var(--border-subtle)] opacity-50"
                }`}
              >
                <span className={`absolute top-1 left-1 text-xs font-medium ${
                  day.isToday ? "text-[var(--accent)]" : day.isCurrentMonth ? "text-[var(--text)]" : "text-[var(--text-tertiary)]"
                }`}>
                  {day.dayOfMonth}
                </span>
                {day.isCurrentMonth && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${getStatusColor(day.status)}`}
                      title={getStatusLabel(day.status)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
              <span>Obecny</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--danger)]" />
              <span>Nieobecny</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--warning)]" />
              <span>Spóźnienie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--info)]" />
              <span>Usprawiedliwiony</span>
            </div>
          </div>
        </div>
      )}

      {viewMode === "subjects" && (
        <div className="card p-5">
          <h2 className="text-lg font-bold text-[var(--text)] mb-4">Szczegółowa frekwencja po przedmiotach</h2>
          {subjectAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border)]">
                    <th className="py-3 px-4 font-medium">Przedmiot</th>
                    <th className="py-3 px-4 font-medium text-center">Frekwencja</th>
                    <th className="py-3 px-4 font-medium text-center">Obecny</th>
                    <th className="py-3 px-4 font-medium text-center">Spóźnienia</th>
                    <th className="py-3 px-4 font-medium text-center">Nieobecny</th>
                    <th className="py-3 px-4 font-medium text-center">Uspraw.</th>
                    <th className="py-3 px-4 font-medium text-center">Razem</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectAttendance.map((sa) => (
                    <tr key={sa.subject} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)]">
                      <td className="py-3 px-4 font-medium text-[var(--text)]">{sa.subject}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-24 mx-auto">
                          <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-1">
                            <div
                              className={`h-full rounded-full ${
                                sa.percentage >= 90 ? "bg-[var(--success)]" : sa.percentage >= 75 ? "bg-[var(--warning)]" : "bg-[var(--danger)]"
                              }`}
                              style={{ width: `${sa.percentage}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold tabular-nums font-mono ${
                            sa.percentage >= 90 ? "text-[var(--success)]" : sa.percentage >= 75 ? "text-[var(--warning)]" : "text-[var(--danger)]"
                          }`}>
                            {sa.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-[var(--success)] font-bold tabular-nums font-mono">{sa.present}</td>
                      <td className="py-3 px-4 text-center text-[var(--warning)] font-bold tabular-nums font-mono">{sa.late}</td>
                      <td className="py-3 px-4 text-center text-[var(--danger)] font-bold tabular-nums font-mono">{sa.absent}</td>
                      <td className="py-3 px-4 text-center text-[var(--info)] font-bold tabular-nums font-mono">{sa.excused}</td>
                      <td className="py-3 px-4 text-center text-[var(--text-tertiary)] tabular-nums font-mono">{sa.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-[var(--text-tertiary)]">Brak danych o przedmiotach</p>
          )}
        </div>
      )}
    </div>
  );
}