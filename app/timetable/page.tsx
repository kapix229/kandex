"use client";

import { useEffect, useState, useMemo } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  Sun,
  Moon,
  Clock,
  BookOpen,
  User,
  Grid,
  List,
} from "lucide-react";

type Lesson = {
  date: string;
  lessonNumber: number;
  start: string;
  end: string;
  subject: string;
  teacher: string;
  room: string;
};

const DAYS = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const DAYS_SHORT = ["Nd", "Pn", "Wt", "Śr", "Czw", "Pt", "Sb"];

export default function TimetablePage() {
  const { account, signOut } = useVulcanSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">("week");

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/eduvulcan/timetable", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Nie udało się pobrać planu lekcji.");
      }
      setLessons(data.data?.lessons ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd sieci");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeek);
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  }), [weekStart]);

  const formatDate = (date: Date) => date.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
  const formatFullDate = (date: Date) => date.toLocaleDateString("pl-PL", { weekday: "long", day: "2-digit", month: "long" });
  const formatTime = (timeStr: string) => timeStr.slice(0, 5);

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getLessonsForDay = (dateStr: string) => {
    return lessons
      .filter((l) => l.date === dateStr)
      .sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));
  };

  const isCurrentLesson = (lesson: Lesson | undefined) => {
    if (!lesson) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = lesson.start.split(":").map(Number);
    const [endH, endM] = lesson.end.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    return currentTime >= startMin && currentTime < endMin;
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

  const renderWeeklyGrid = () => (
    <div className="card overflow-hidden animate-slide-up">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[var(--surface-hover)]">
            <tr>
              <th className="px-4 py-3 font-semibold text-[var(--text-tertiary)] w-24 text-center">
                Godzina
              </th>
              {weekDays.map((day, dayIndex) => (
                <th
                  key={dayIndex}
                  className={`px-3 py-3 font-semibold text-center ${
                    isToday(day) ? "text-[var(--accent)] bg-[var(--accent-primary-muted)]" : "text-[var(--text)]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
                      {DAYS_SHORT[day.getDay()]}
                    </span>
                    <span className="text-lg font-extrabold tabular-nums">{day.getDate()}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {day.toLocaleDateString("pl-PL", { month: "short" })}
                    </span>
                    {isToday(day) && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)] text-[var(--text-inverse)]">
                        Dziś
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const allLessonNumbers = new Set<number>();
              weekDays.forEach(day => {
                const dayStr = day.toISOString().slice(0, 10);
                getLessonsForDay(dayStr).forEach(l => allLessonNumbers.add(l.lessonNumber));
              });
              const sortedLessons = Array.from(allLessonNumbers).sort((a, b) => a - b);
              return sortedLessons.slice(0, 10).map((lessonNum) => (
                <tr key={lessonNum} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-center text-[var(--text-tertiary)] font-medium w-24 bg-[var(--surface-hover)]">
                    <span className="font-mono tabular-nums">{lessonNum}.</span>
                  </td>
                  {weekDays.map((day, dayIndex) => {
                    const dayStr = day.toISOString().slice(0, 10);
                    const dayLessons = getLessonsForDay(dayStr);
                    const lesson = dayLessons.find(l => l.lessonNumber === lessonNum);
                    const isCurrent = isCurrentLesson(lesson);

                    if (!lesson) {
                      return (
                        <td
                          key={dayIndex}
                          className={`px-2 py-3 min-h-[80px] ${
                            isToday(day) ? "bg-[var(--accent-primary-muted)]" : ""
                          }`}
                        />
                      );
                    }

                    return (
                      <td key={dayIndex} className={`px-2 py-2 min-h-[80px] relative ${
                        isToday(day) ? "bg-[var(--accent-primary-muted)]" : ""
                      } ${isCurrent ? "ring-2 ring-[var(--accent)] bg-[var(--accent-primary-muted)]" : ""}`}>
                        <div
                          className={`p-2 rounded-xl h-full transition-all ${
                            isCurrent
                              ? "bg-[var(--accent)] text-[var(--text-inverse)] shadow-md ring-2 ring-[var(--accent)]"
                              : "bg-[var(--surface)] border border-[var(--border)] hover:shadow-lg hover:border-[var(--accent-primary-border)]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                              isCurrent ? "text-[var(--text-inverse)]/80" : "text-[var(--text-tertiary)]"
                            }`}>
                              {formatTime(lesson.start)} – {formatTime(lesson.end)}
                            </span>
                            {isCurrent && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isCurrent ? "bg-[var(--text-inverse)]/20 text-[var(--text-inverse)]" : "bg-[var(--accent-primary-muted)] text-[var(--accent)]"
                              }`}>
                                TERAZ
                              </span>
                            )}
                          </div>
                          <p className={`font-semibold truncate ${isCurrent ? "text-[var(--text-inverse)]" : "text-[var(--text)]"}`}>
                            {lesson.subject}
                          </p>
                          {lesson.teacher && (
                            <p className={`text-xs truncate mt-1 ${isCurrent ? "text-[var(--text-inverse)]/70" : "text-[var(--text-tertiary)]"}`}>
                              {lesson.teacher}
                            </p>
                          )}
                          {lesson.room && (
                            <p className={`text-xs truncate ${isCurrent ? "text-[var(--text-inverse)]/70" : "text-[var(--text-tertiary)]"}`}>
                              Sala {lesson.room}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDailyList = () => (
    <div className="space-y-4 animate-slide-up stagger-children">
      {weekDays.map((day, dayIndex) => {
        const dayStr = day.toISOString().slice(0, 10);
        const dayLessons = getLessonsForDay(dayStr);

        return (
          <div key={dayIndex} className="card overflow-hidden">
            <div className={`p-4 border-b border-[var(--border)] ${
              isToday(day) ? "bg-[var(--accent-primary-muted)]" : ""
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl text-center min-w-[60px] ${
                    isToday(day) ? "bg-[var(--accent)] text-[var(--text-inverse)]" : "bg-[var(--surface)] border border-[var(--border)]"
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                      isToday(day) ? "text-[var(--text-inverse)]/80" : "text-[var(--text-tertiary)]"
                    }`}>
                      {DAYS[day.getDay()]}
                    </p>
                    <p className={`text-2xl font-extrabold tabular-nums ${
                      isToday(day) ? "text-[var(--text-inverse)]" : "text-[var(--text)]"
                    }`}>
                      {day.getDate()}
                    </p>
                    <p className={`text-xs ${
                      isToday(day) ? "text-[var(--text-inverse)]/70" : "text-[var(--text-tertiary)]"
                    }`}>
                      {day.toLocaleDateString("pl-PL", { month: "long" })}
                    </p>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isToday(day) ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                      {isToday(day) ? "Dziś" : formatFullDate(day)}
                    </h3>
                    {isToday(day) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)] text-[var(--text-inverse)]">
                        <Sun className="h-3 w-3" strokeWidth={2} />
                        Bieżący dzień
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              {dayLessons.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" strokeWidth={1.5} />
                  <p className="font-semibold text-[var(--text)] mb-1">Brak lekcji w ten dzień</p>
                  <p className="text-sm text-[var(--text-tertiary)]">Możesz odpocząć! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayLessons.map((lesson) => {
                    const isCurrent = isCurrentLesson(lesson);
                    return (
                      <div
                        key={`${dayStr}-${lesson.lessonNumber}`}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-[var(--accent-primary-muted)] border-[var(--accent-primary-border)] ring-1 ring-[var(--accent-primary-muted)]"
                            : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className={`flex-shrink-0 grid h-14 w-14 place-items-center rounded-xl text-lg font-bold ${
                          isCurrent
                            ? "bg-[var(--accent)] text-[var(--text-inverse)]"
                            : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                        }`}>
                          {lesson.lessonNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${isCurrent ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                            {lesson.subject}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                            <span className={`flex items-center gap-1 font-mono tabular-nums ${isCurrent ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}>
                              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                              {formatTime(lesson.start)} – {formatTime(lesson.end)}
                            </span>
                            {lesson.teacher && (
                              <span className={`flex items-center gap-1 ${isCurrent ? "text-[var(--accent)]/80" : "text-[var(--text-tertiary)]"}`}>
                                <User className="h-3.5 w-3.5" strokeWidth={2} />
                                {lesson.teacher}
                              </span>
                            )}
                            {lesson.room && (
                              <span className={`flex items-center gap-1 ${isCurrent ? "text-[var(--accent)]/80" : "text-[var(--text-tertiary)]"}`}>
                                <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                                Sala {lesson.room}
                              </span>
                            )}
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold bg-[var(--accent)] text-[var(--text-inverse)] animate-pulse">
                            TERAZ
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderEmptyState = () => (
    <div className="card p-12 text-center animate-fade-in">
      <Calendar className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
      <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Brak planu lekcji</h3>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Dziennik nie zwrócił danych o planie. Spróbuj zsynchronizować ponownie.
      </p>
      <SyncButton onSync={loadSchedule} label="Synchronizuj ponownie" />
    </div>
  );

  const renderLoadingState = () => (
    <div className="card p-12 text-center animate-pulse space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-8 bg-[var(--surface-hover)] rounded-xl" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-in-down flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dziennik</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Plan lekcji</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Tygodniowy widok zajęć i bieżąca lekcja</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setCurrentWeek(d => { const nd = new Date(d); nd.setDate(d.getDate() - 7); return nd; })}
            className="btn-secondary gap-1"
            aria-label="Poprzedni tydzień"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="btn-secondary text-sm"
          >
            <Home className="h-4 w-4" strokeWidth={2} />
            Dziś
          </button>
          <button
            onClick={() => setCurrentWeek(d => { const nd = new Date(d); nd.setDate(d.getDate() + 7); return nd; })}
            className="btn-secondary gap-1"
            aria-label="Następny tydzień"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
          <SyncButton onSync={loadSchedule} label="Synchronizuj" disabled={loading} />
          {account && (
            <button onClick={handleLogout} className="btn-secondary">Wyloguj</button>
          )}
        </div>
      </div>

      {/* Week indicator */}
      <div className="card p-4 animate-slide-in-down" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 grid h-12 w-12 place-items-center rounded-xl ${isToday(new Date()) ? "bg-[var(--accent)] text-[var(--text-inverse)]" : "bg-[var(--accent-primary-muted)] text-[var(--accent)]"}`}>
              <Calendar className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">
                {weekStart.toLocaleDateString("pl-PL", { day: "2-digit", month: "long" })} – {weekEnd.toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Tydzień {getWeekNumber(weekStart)} · {viewMode === "week" ? "Widok tygodniowy" : "Widok dzienny"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === "week" ? "bg-[var(--accent)] text-[var(--text-inverse)]" : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"}`}
            >
              <Grid className="h-4 w-4" strokeWidth={2} />
              Tydzień
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === "day" ? "bg-[var(--accent)] text-[var(--text-inverse)]" : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"}`}
            >
              <List className="h-4 w-4" strokeWidth={2} />
              Dzień
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        renderLoadingState()
      ) : lessons.length === 0 ? (
        renderEmptyState()
      ) : viewMode === "week" ? (
        renderWeeklyGrid()
      ) : (
        renderDailyList()
      )}
    </div>
  );
}