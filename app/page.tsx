"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useJournalProvider, setJournalProvider } from "@/src/hooks/useJournalProvider";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import { useEffect, useState, useCallback } from "react";
import { Grade, Lesson, Event } from "@/src/types/shared";
import { safeParseDate, calculateWeightedAverage } from "@/services/grade-calculator";
import {
  Calendar,
  Award,
  ClipboardList,
  Activity,
  BookOpen,
  Brain,
  Target,
  Trophy,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BookMarked,
} from "lucide-react";

export default function HomePage() {
  const { account, signOut } = useVulcanSession();
  const provider = useJournalProvider();
  const searchParams = useSearchParams();
  const chooseJournal = searchParams.get("chooseJournal") === "1";

  const firstName = account?.fullName?.split(" ")[0] || "Uczniu";
  const isLoggedIn = !!account;

  // Dashboard state - always initialized to satisfy hooks rules
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, unknown: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [overallAverage, setOverallAverage] = useState<number | null>(null);
  const [totalGrades, setTotalGrades] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  const [pendingAssignments, setPendingAssignments] = useState(0);
  const [upcomingTests, setUpcomingTests] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [studyStreak, setStudyStreak] = useState(0);

  function selectProvider(nextProvider: "eduvulcan" | "librus") {
    try {
      setJournalProvider(nextProvider);
    } catch (error) {
      console.error("[Kandex provider] Could not save journal preference:", error);
    }
  }

  const loadDashboardData = useCallback(async () => {
    if (!account || chooseJournal) return;

    const [timetableRes, eventsRes, gradesRes, attendanceRes] = await Promise.all([
      fetch("/api/v1/timetable", { cache: "no-store" }),
      fetch("/api/v1/events", { cache: "no-store" }),
      fetch("/api/v1/grades", { cache: "no-store" }),
      fetch("/api/v1/attendance", { cache: "no-store" }),
    ]);

    const timetableData = await timetableRes.json();
    const eventsData = await eventsRes.json();
    const gradesData = await gradesRes.json();
    const attendanceData = await attendanceRes.json();

    // Today's lessons
    if (timetableData.success) {
      const today = new Date().toISOString().slice(0, 10);
      const todaySchedule = (timetableData.data ?? [])
        .filter((l: Lesson) => l.date === today)
        .sort((a: Lesson, b: Lesson) => (a.lessonNumber || 0) - (b.lessonNumber || 0));
      setTodayLessons(todaySchedule.slice(0, 5));

      // Find current and next lesson
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      let current = null;
      let next = null;

      for (const lesson of todaySchedule) {
        const [startH, startM] = lesson.start.split(":").map(Number);
        const [endH, endM] = lesson.end.split(":").map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        if (currentTime >= startMin && currentTime < endMin) {
          current = lesson;
        } else if (currentTime < startMin && !next) {
          next = lesson;
        }
      }
      setCurrentLesson(current);
      setNextLesson(next);
    }

    // Events
    if (eventsData.success) {
      const allEvents = (eventsData.data ?? []) as Event[];
      const now = new Date();
      const upcoming = allEvents
        .filter((e: Event) => {
          const eventDate = safeParseDate(e.date);
          if (!eventDate) return false;
          return eventDate >= now;
        })
        .sort((a: Event, b: Event) => {
          const dateA = safeParseDate(a.date);
          const dateB = safeParseDate(b.date);
          if (!dateA || !dateB) return 0;
          return dateA.getTime() - dateB.getTime();
        });
      setUpcomingEvents(upcoming.slice(0, 8));
      setPendingAssignments(upcoming.filter(e => e.type === "assignment").length);
      setUpcomingTests(upcoming.filter(e => e.type === "exam" || e.type === "test").length);
    }

    // Grades
    if (gradesData.success) {
      const allGrades = (gradesData.data?.grades ?? []) as Grade[];
      const recent = allGrades
        .sort((a: Grade, b: Grade) => {
          const dateA = safeParseDate(a.date);
          const dateB = safeParseDate(b.date);
          if (!dateA || !dateB) return 0;
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 6);
      setRecentGrades(recent);

      // Calculate overall stats
      const validGrades = allGrades.filter(g => Number.isFinite(g.value));
      setTotalGrades(validGrades.length);

      // Group by subject for subject count and averages
      const subjectMap = new Map<string, Grade[]>();
      for (const grade of validGrades) {
        const subject = grade.subjectName || "Inne";
        if (!subjectMap.has(subject)) subjectMap.set(subject, []);
        subjectMap.get(subject)!.push(grade);
      }
      setSubjectsCount(subjectMap.size);

      // Overall weighted average
      const weightedAvg = calculateWeightedAverage(validGrades);
      setOverallAverage(Number.isFinite(weightedAvg) ? weightedAvg : null);
    }

    // Attendance
    if (attendanceData.success) {
      const summary = attendanceData.data?.summary ?? { present: 0, absent: 0, late: 0, excused: 0, unknown: 0 };
      const total = summary.present + summary.absent + summary.late + summary.excused + summary.unknown;
      const rate = total ? Math.round(((summary.present + summary.late) / total) * 100) : 0;
      setAttendanceStats({ ...summary, rate });
    }

    // Study streak (placeholder - could be calculated from localStorage)
    setStudyStreak(7);
  }, [account, chooseJournal]);

  // Load dashboard data on mount - always called to satisfy hooks rules
  useEffect(() => {
    if (account && !chooseJournal) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        loadDashboardData();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [account, chooseJournal, loadDashboardData]);

  if (!account || chooseJournal) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-8 sm:py-16 animate-fade-in">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center">
          <div className="mb-10 flex items-center gap-3 sm:mb-14 animate-slide-up">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent)] text-lg font-black text-[var(--text-inverse)]">K</span>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-[var(--text)]">Kandex</p>
              <p className="text-sm text-[var(--text-tertiary)]">Twój workspace do nauki</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-14">
            <section className="animate-slide-up stagger-children">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Krok 01 · konfiguracja</p>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-[var(--text)] sm:text-5xl">
                Zacznij od swojego dziennika.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                Kandex łączy dane szkolne z planem nauki. Wybierz dziennik, połącz konto, a resztę danych przygotujemy automatycznie.
              </p>
            </section>

            <section className="card rounded-2xl p-6 sm:p-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <div className="mb-6">
                <p className="text-sm font-extrabold text-[var(--text)]">Z którego dziennika korzystasz?</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">Możesz później zmienić dostawcę w ustawieniach.</p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  aria-pressed={provider === "eduvulcan"}
                  onClick={() => selectProvider("eduvulcan")}
                  className={`w-full rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    provider === "eduvulcan"
                      ? "border-[var(--accent)] bg-[var(--accent-primary-muted)] ring-1 ring-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-primary-muted)] text-[var(--accent)]">
                        <BookMarked className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div>
                        <p className="font-bold text-[var(--text)]">EduVULCAN</p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Połączenie przez oficjalny dostęp mobilny</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[var(--accent)] flex-shrink-0" strokeWidth={2} />
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={provider === "librus"}
                  onClick={() => selectProvider("librus")}
                  className={`w-full rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    provider === "librus"
                      ? "border-[var(--accent)] bg-[var(--accent-primary-muted)] ring-1 ring-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--surface-hover)] text-[var(--text-tertiary)]">
                        <BookOpen className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div>
                        <p className="font-bold text-[var(--text)]">Librus</p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Adapter przygotowany · integracja wkrótce</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-tertiary)] px-2 py-0.5 rounded bg-[var(--surface-hover)]">WKRÓTCE</span>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const polishMonthNames = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

  const formatPolishDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${polishMonthNames[date.getMonth()]}.${date.getFullYear()}`;
  };

  const formatPolishDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${polishMonthNames[date.getMonth()]}`;
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-slide-up">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dashboard</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
            Dzień dobry, {firstName} ☀️
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            {studyStreak > 0 ? `Seria nauki: ${studyStreak} dni 🔥` : "Zacznij naukę dzisiaj, by zbudować serię."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap animate-slide-up" style={{ animationDelay: "60ms" }}>
          <SyncButton onSync={loadDashboardData} label="Odśwież" disabled={loading} />
          {isLoggedIn && (
            <button
              onClick={async () => {
                try {
                  await fetch("/api/v1/auth/login", { method: "DELETE" });
                } catch (err) {
                  console.error("logout failed:", err);
                } finally {
                  signOut();
                }
              }}
              className="btn-secondary hidden sm:flex"
            >
              Wyloguj
            </button>
          )}
        </div>
      </header>

      {/* Key Stats Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up stagger-children" style={{ animationDelay: "100ms" }}>
        <Link href="/grades" className="card p-4 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Średnia ważona</p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--text)] tabular-nums font-mono group-hover:text-[var(--accent)] transition-colors">
                {overallAverage !== null ? overallAverage.toFixed(2) : "—"}
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)] group-hover:scale-105 transition-transform">
              <Award className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">{totalGrades} ocen · {subjectsCount} przedmiotów</p>
        </Link>

        <Link href="/attendance" className="card p-4 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Frekwencja</p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--success)] tabular-nums font-mono group-hover:text-[var(--success-hover)] transition-colors">
                {attendanceStats.rate}%
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--success-muted)] text-[var(--success)] group-hover:scale-105 transition-transform">
              <Activity className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            {attendanceStats.present + attendanceStats.late} z {attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.excused} lekcji
          </p>
        </Link>

        <Link href="/assignments" className="card p-4 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Zadania na ten tydzień</p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--text)] tabular-nums font-mono">
                {pendingAssignments}
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--warning-muted)] text-[var(--warning)] group-hover:scale-105 transition-transform">
              <ClipboardList className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            {upcomingTests} sprawdzian{upcomingTests === 1 ? "" : upcomingTests <= 4 ? "y" : "ów"} nadchodzi
          </p>
        </Link>

        <Link href="/timetable" className="card p-4 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Lekcje dziś</p>
              <p className="mt-1 text-3xl font-extrabold text-[var(--text)] tabular-nums font-mono">
                {todayLessons.length}
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--info-muted)] text-[var(--info)] group-hover:scale-105 transition-transform">
              <Calendar className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            {currentLesson ? "Trwa lekcja" : nextLesson ? `Następna: ${formatTime(nextLesson.start)}` : "Brak lekcji"}
          </p>
        </Link>
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] animate-slide-up" style={{ animationDelay: "160ms" }}>
        <div className="space-y-4">
          {/* Current/Next Lesson Highlight */}
          {(currentLesson || nextLesson) && (
            <Link
              href="/timetable"
              className="card p-4 bg-[var(--accent-primary-muted)] border-[var(--accent-primary-border)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary-muted)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--accent)] text-[var(--text-inverse)]">
                    {currentLesson ? (
                      <span className="text-2xl font-extrabold tabular-nums font-mono">{currentLesson.lessonNumber}</span>
                    ) : (
                      <Clock className="h-7 w-7" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--accent)]">
                      {currentLesson ? "Trwa teraz" : "Następna lekcja"}
                    </p>
                    <p className="font-bold text-[var(--text)]">{currentLesson?.subject ?? nextLesson?.subject}</p>
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                      {currentLesson && (
                        <>
                          <span>{formatTime(currentLesson.start)} – {formatTime(currentLesson.end)}</span>
                          {currentLesson.teacher && <span>· {currentLesson.teacher}</span>}
                          {currentLesson.room && <span>· Sala {currentLesson.room}</span>}
                        </>
                      )}
                      {nextLesson && !currentLesson && (
                        <>
                          <span>Zaczyna o {formatTime(nextLesson.start)}</span>
                          {nextLesson.teacher && <span>· {nextLesson.teacher}</span>}
                          {nextLesson.room && <span>· Sala {nextLesson.room}</span>}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--accent)] group-hover:translate-x-1 transition-transform" strokeWidth={2} />
              </div>
            </Link>
          )}

          {/* Today's Schedule */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Plan</p>
                <h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">Dzisiejsze lekcje</h2>
              </div>
              <Link href="/timetable" className="btn-ghost text-xs">Pełny plan →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface-hover)] animate-pulse">
                    <div className="h-10 w-10 rounded-xl bg-[var(--bg-tertiary)]" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-[var(--bg-tertiary)] rounded mb-2" />
                      <div className="h-3 w-1/2 bg-[var(--bg-tertiary)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todayLessons.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" strokeWidth={1.5} />
                <p className="font-semibold text-[var(--text)] mb-1">Brak lekcji na dziś</p>
                <p className="text-sm text-[var(--text-tertiary)]">Możesz cieszyć się wolnym dniem!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayLessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      lesson === currentLesson
                        ? "bg-[var(--accent-primary-muted)] border-[var(--accent-primary-border)] ring-1 ring-[var(--accent-primary-muted)]"
                        : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className={`flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl text-sm font-bold ${
                      lesson === currentLesson
                        ? "bg-[var(--accent)] text-[var(--text-inverse)]"
                        : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                    }`}>
                      {lesson.lessonNumber || idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text)] truncate">{lesson.subject}</p>
                      <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                        <span className="font-mono tabular-nums">{formatTime(lesson.start)} – {formatTime(lesson.end)}</span>
                        {lesson.teacher && <span>· {lesson.teacher}</span>}
                        {lesson.room && <span>· Sala {lesson.room}</span>}
                      </p>
                    </div>
                    {lesson === currentLesson && (
                      <span className="flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--accent)] text-[var(--text-inverse)]">
                        TERAZ
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Terminy</p>
                <h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">Nadchodzące sprawdziany i zadania</h2>
              </div>
              <Link href="/assignments" className="btn-ghost text-xs">Wszystkie →</Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] animate-pulse">
                    <div className="h-10 w-10 rounded-xl bg-[var(--bg-tertiary)]" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-[var(--bg-tertiary)] rounded mb-2" />
                      <div className="h-3 w-1/2 bg-[var(--bg-tertiary)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" strokeWidth={1.5} />
                <p className="font-semibold text-[var(--text)] mb-1">Brak nadchodzących terminów</p>
                <p className="text-sm text-[var(--text-tertiary)]">Wszystko nadrabiane! 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <Link
                    key={event.id}
                    href="/assignments"
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group"
                  >
                    <div className={`flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl ${
                      event.type === "exam" ? "bg-[var(--danger-muted)] text-[var(--danger)]" :
                      event.type === "test" ? "bg-[var(--warning-muted)] text-[var(--warning)]" :
                      "bg-[var(--accent-primary-muted)] text-[var(--accent)]"
                    } group-hover:scale-105 transition-transform`}>
                      {event.type === "exam" ? (
                        <BookMarked className="h-5 w-5" strokeWidth={2} />
                      ) : event.type === "test" ? (
                        <Award className="h-5 w-5" strokeWidth={2} />
                      ) : (
                        <ClipboardList className="h-5 w-5" strokeWidth={2} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">{event.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                        {event.subject && <span>{event.subject}</span>}
                        <span>{formatPolishDateShort(event.date)}</span>
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                      event.type === "exam" ? "bg-[var(--danger-muted)] text-[var(--danger)]" :
                      event.type === "test" ? "bg-[var(--warning-muted)] text-[var(--warning)]" :
                      "bg-[var(--accent-primary-muted)] text-[var(--accent)]"
                    }`}>
                      {event.type === "exam" ? "Sprawdzian" : event.type === "test" ? "Kartkówka" : "Zadanie"}
                    </span>
                  </Link>
                ))}
                {upcomingEvents.length > 5 && (
                  <Link
                    href="/assignments"
                    className="block text-center text-sm font-medium text-[var(--accent)] mt-2 hover:underline"
                  >
                    +{upcomingEvents.length - 5} więcej →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Recent Grades */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Oceny</p>
                <h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">Ostatnie oceny</h2>
              </div>
              <Link href="/grades" className="btn-ghost text-xs">Wszystkie →</Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-hover)] animate-pulse">
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-[var(--bg-tertiary)] rounded mb-2" />
                      <div className="h-3 w-1/2 bg-[var(--bg-tertiary)] rounded" />
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-[var(--bg-tertiary)]" />
                  </div>
                ))}
              </div>
            ) : recentGrades.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" strokeWidth={1.5} />
                <p className="font-semibold text-[var(--text)] mb-1">Brak ostatnich ocen</p>
                <p className="text-sm text-[var(--text-tertiary)]">Oceny pojawią się tutaj po dodaniu ich w dzienniku.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentGrades.map((grade) => {
                  const gradeValue = grade.value;
                  let gradeColor = "grade-value-1";
                  if (gradeValue >= 5.5) gradeColor = "grade-value-6";
                  else if (gradeValue >= 4.5) gradeColor = "grade-value-5";
                  else if (gradeValue >= 3.5) gradeColor = "grade-value-4";
                  else if (gradeValue >= 2.5) gradeColor = "grade-value-3";
                  else if (gradeValue >= 1.5) gradeColor = "grade-value-2";

                  return (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text)] truncate">{grade.subjectName}</p>
                        <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                          <span>{formatPolishDate(grade.date)}</span>
                          {grade.type && <span>· {grade.type}</span>}
                          {grade.weight > 1 && <span className="font-mono tabular-nums">waga {grade.weight}</span>}
                        </p>
                      </div>
                      <span className={`grade-badge ${gradeColor} flex-shrink-0 ml-3`}>
                        {grade.displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Quick Stats & Actions */}
        <aside className="space-y-4">
          {/* Academic Overview */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)]">
                <TrendingUp className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="text-lg font-bold text-[var(--text)]">Przegląd akademicki</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--success-muted)] text-[var(--success)]">
                    <CheckCircle className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-medium text-[var(--text)]">Średnia ogólna</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{totalGrades} ocen z {subjectsCount} przedmiotów</p>
                  </div>
                </div>
                <span className={`text-2xl font-extrabold tabular-nums font-mono ${
                  overallAverage !== null && overallAverage >= 4.5 ? "text-[var(--success)]" :
                  overallAverage !== null && overallAverage >= 3.5 ? "text-[var(--warning)]" :
                  overallAverage !== null ? "text-[var(--danger)]" : "text-[var(--text-tertiary)]"
                }`}>
                  {overallAverage !== null ? overallAverage.toFixed(2) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--info-muted)] text-[var(--info)]">
                    <Activity className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-medium text-[var(--text)]">Frekwencja</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{attendanceStats.present + attendanceStats.late} obecnych z {attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.excused}</p>
                  </div>
                </div>
                <span className={`text-2xl font-extrabold tabular-nums font-mono ${
                  attendanceStats.rate >= 90 ? "text-[var(--success)]" :
                  attendanceStats.rate >= 75 ? "text-[var(--warning)]" : "text-[var(--danger)]"
                }`}>
                  {attendanceStats.rate}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--warning-muted)] text-[var(--warning)]">
                    <AlertCircle className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-medium text-[var(--text)]">Nadchodzące terminy</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{pendingAssignments} zadań, {upcomingTests} sprawdzian{upcomingTests === 1 ? "" : upcomingTests <= 4 ? "y" : "ów"}</p>
                  </div>
                </div>
                <span className="text-2xl font-extrabold tabular-nums font-mono text-[var(--text-tertiary)]">
                  {pendingAssignments + upcomingTests}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="text-lg font-bold text-[var(--text)] mb-4">Szybkie akcje</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/learning" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-primary-muted)] text-[var(--accent)] group-hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-medium text-[var(--text)]">Kontynuuj naukę</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Materiały i plan</p>
                </div>
              </Link>
              <Link href="/ai-tutor" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--warning-muted)] text-[var(--warning)] group-hover:scale-105 transition-transform">
                  <Brain className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-medium text-[var(--text)]">AI Tutor</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Zadaj pytanie</p>
                </div>
              </Link>
              <Link href="/flashcards" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--success-muted)] text-[var(--success)] group-hover:scale-105 transition-transform">
                  <Target className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-medium text-[var(--text)]">Fiszki</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Powtórki</p>
                </div>
              </Link>
              <Link href="/progress" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--info-muted)] text-[var(--info)] group-hover:scale-105 transition-transform">
                  <Trophy className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-medium text-[var(--text)]">Postęp</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Statystyki</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Study Streak */}
          <div className="card p-5 bg-[var(--surface)]">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--warning-muted)] text-[var(--warning)]">
                  <Star className="h-6 w-6" strokeWidth={2} />
                </span>
              </div>
              <p className="text-4xl font-extrabold text-[var(--text)] tabular-nums font-mono">{studyStreak}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">dni serii nauki</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">Kontynuuj, by nie przerwać serii! 🔥</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}