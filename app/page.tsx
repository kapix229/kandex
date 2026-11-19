"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useJournalProvider, setJournalProvider } from "@/src/hooks/useJournalProvider";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import CalendarMini from "@/src/components/CalendarMini";
import SyncButton from "@/components/SyncButton";
import { useEffect, useState } from "react";
import { Grade, Lesson, Event } from "@/src/types/shared";
import { parseGradeValue, safeParseDate, calculateAverage, calculateWeightedAverage } from "@/services/grade-calculator";

export default function HomePage() {
  const { account, signOut } = useVulcanSession();
  const provider = useJournalProvider();
  const searchParams = useSearchParams();
  const chooseJournal = searchParams.get("chooseJournal") === "1";

  function selectProvider(nextProvider: "eduvulcan" | "librus") {
    try {
      setJournalProvider(nextProvider);
    } catch (error) {
      console.error("[Kandex provider] Could not save journal preference:", error);
    }
  }

  if (!account || chooseJournal) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center">
          <div className="mb-10 flex items-center gap-3 sm:mb-14">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-[var(--accent)] text-lg font-black text-[#211e24]">K</span>
            <div>
              <p className="text-xl font-extrabold tracking-tight">Kandex</p>
              <p className="text-xs text-[var(--text-muted)]">Twój workspace do nauki</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-14">
            <section>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Krok 01 · konfiguracja</p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[var(--text)] sm:text-6xl">
                Zacznij od swojego dziennika.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
                Kandex łączy dane szkolne z planem nauki. Wybierz dziennik, połącz konto, a resztę danych przygotujemy automatycznie.
              </p>
            </section>

            <section className="workspace-card rounded-[22px] p-5 sm:p-7 animate-slide-up">
              <div className="mb-6">
                <p className="text-sm font-extrabold text-[var(--text)]">Z którego dziennika korzystasz?</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Możesz później zmienić dostawcę w ustawieniach.</p>
              </div>

              <div className="space-y-3">
                <button type="button" aria-pressed={provider === "eduvulcan"} onClick={() => selectProvider("eduvulcan")} className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${provider === "eduvulcan" ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : "border-[var(--border)] bg-white/[0.025] hover:bg-white/[0.06]"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--text)]">EduVULCAN</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">Połączenie przez oficjalny dostęp mobilny</p>
                    </div>
                    <span className="text-[var(--accent)]">→</span>
                  </div>
                </button>

                <button type="button" aria-pressed={provider === "librus"} onClick={() => selectProvider("librus")} className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${provider === "librus" ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : "border-[var(--border)] bg-white/[0.025] hover:bg-white/[0.06]"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--text)]">Librus</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">Adapter przygotowany · integracja wkrótce</p>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-muted)]">WKRÓTCE</span>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const firstName = account.fullName?.split(" ")[0] || "Uczniu";

  
  // Dashboard state
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, unknown: 0, rate: 0 });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
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

      if (timetableData.success) {
        const today = new Date().toISOString().slice(0, 10);
        const todaySchedule = (timetableData.data ?? [])
          .filter((l: Lesson) => l.date === today)
          .slice(0, 3);
        setTodayLessons(todaySchedule);
      }

      if (eventsData.success) {
        const upcoming = (eventsData.data ?? [])
          .filter((e: Event) => {
            const eventDate = safeParseDate(e.date);
            if (!eventDate) return false;
            return eventDate >= new Date();
          })
          .slice(0, 5);
        setUpcomingEvents(upcoming);
      }

      if (gradesData.success) {
        const recent = (gradesData.data?.grades ?? [])
          .sort((a: Grade, b: Grade) => {
            const dateA = safeParseDate(a.date);
            const dateB = safeParseDate(b.date);
            if (!dateA || !dateB) return 0;
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);
        setRecentGrades(recent);
      }

      if (attendanceData.success) {
        const summary = attendanceData.data?.summary ?? { present: 0, absent: 0, late: 0, excused: 0, unknown: 0 };
        const total = summary.present + summary.absent + summary.late + summary.excused + summary.unknown;
        const rate = total ? Math.round(((summary.present + summary.late) / total) * 100) : 0;
        setAttendanceStats({ ...summary, rate });
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const polishMonthNames = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

  const formatPolishDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${polishMonthNames[date.getMonth()]}.${date.getFullYear()}`;
  };

  const formatPolishDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${polishMonthNames[date.getMonth()]}`;
  };

  return (
    <div className="animate-fade-in space-y-7">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dashboard</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">Cześć, {firstName} 👋</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">Twoje dane szkolne i nauka w jednym miejscu.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SyncButton onSync={loadDashboardData} label="Odśwież" disabled={loading} />
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
            className="bg-[var(--surface-muted)] border border-[var(--border-strong)] text-[var(--text)] px-3 py-1.5 rounded-2xl text-sm hover:bg-white/[0.08]"
          >
            Wyloguj
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up stagger-children">
        <div className="workspace-card rounded-xl p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Średnia ogólna</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--text)]">
            {recentGrades.length > 0
              ? calculateWeightedAverage(recentGrades).toFixed(2)
              : "—"}
          </p>
        </div>
        <div className="workspace-card rounded-xl p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Frekwencja</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--success)]">{attendanceStats.rate}%</p>
        </div>
        <div className="workspace-card rounded-xl p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Zadania na dzisiaj</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--text)]">
            {upcomingEvents.filter(e => {
              const eventDate = safeParseDate(e.date);
              if (!eventDate) return false;
              return eventDate.toDateString() === new Date().toDateString();
            }).length}
          </p>
        </div>
        <div className="workspace-card rounded-xl p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Lekcje dziś</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--text)]">{todayLessons.length}</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {/* Today's Schedule */}
          <div className="workspace-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Plan</p>
                <h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">Dzisiejsze lekcje</h2>
              </div>
              <Link href="/dashboard/schedule" className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold text-[var(--text)]">Pełny plan →</Link>
            </div>
            {loading ? (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Ładowanie planu…</p>
            ) : todayLessons.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-semibold text-[var(--text)] mb-1">Brak lekcji na dziś</p>
                <p className="text-sm text-[var(--text-muted)]">Możesz cieszyć się wolnym dniem! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayLessons.map((lesson, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.025] border border-[var(--border)] hover:bg-white/[0.05] transition-all">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--accent-primary-muted)] flex items-center justify-center text-[var(--accent-primary)] font-bold text-xl">
                      {lesson.lessonNumber || idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text)] truncate">{lesson.subject}</p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                        <span>{lesson.start} – {lesson.end}</span>
                        {lesson.teacher && <span>· {lesson.teacher}</span>}
                        {lesson.room && <span>· Sala {lesson.room}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="workspace-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Terminy</p>
                <h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">Nadchodzące sprawdziany i zadania</h2>
              </div>
              <Link href="/calendar" className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold text-[var(--text)]">Wszystkie →</Link>
            </div>
            {loading ? (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Ładowanie terminów…</p>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">Brak nadchodzących terminów.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Link key={event.title} href="/calendar" className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-[var(--border)] hover:bg-white/[0.05] hover:border-[var(--border-strong)] transition-all">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${event.type === "exam" ? "bg-[var(--danger)]/15 text-[var(--danger)]" : event.type === "assignment" ? "bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]" : "bg-[var(--warning)]/15 text-[var(--warning)]"}`}>
                      {event.type === "exam" ? "🎓" : event.type === "assignment" ? "📝" : "📅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text)] truncate">{event.title}</p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                        {event.subject && <span>{event.subject}</span>}
                        <span>{formatPolishDateShort(event.date)}</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Grades */}
          <div className="workspace-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Oceny</p>
                <h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">Ostatnie oceny</h2>
              </div>
              <Link href="/subjects" className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold text-[var(--text)]">Wszystkie →</Link>
            </div>
            {loading ? (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Ładowanie ocen…</p>
            ) : recentGrades.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">Brak ostatnich ocen.</p>
            ) : (
              <div className="space-y-2">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.025] border border-[var(--border)]">
                    <div>
                      <p className="font-medium text-[var(--text)]">{grade.subjectName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatPolishDate(grade.date)}</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-lg font-bold bg-[var(--accent-primary)] text-[var(--text-inverse)]">
                      {grade.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Connection & AI */}
        <aside className="space-y-4">
          {/* Connection Card */}
          <div className="workspace-card h-fit rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Połączenie</p>
            <h2 className="mt-1 text-lg font-extrabold text-[var(--text)]">EduVULCAN</h2>
            <p className="mt-2 text-xs font-semibold text-[var(--success)]">Połączony · {account.fullName}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${attendanceStats.rate}%` }} />
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Frekwencja: {attendanceStats.rate}%</p>
            <Link href="/settings" className="mt-5 block rounded-xl bg-[var(--surface-muted)] px-3 py-3 text-xs font-bold text-[var(--text)] text-center">Ustawienia dziennika →</Link>
          </div>

          {/* Quick Actions */}
          <div className="workspace-card rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Szybkie akcje</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link href="/calendar" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white/[0.025] hover:bg-white/[0.05] hover:border-[var(--border-strong)] transition-all">
                <span className="text-xl">📅</span>
                <span className="font-medium text-[var(--text)]">Kalendarz</span>
              </Link>
              <Link href="/subjects" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white/[0.025] hover:bg-white/[0.05] hover:border-[var(--border-strong)] transition-all">
                <span className="text-xl">📊</span>
                <span className="font-medium text-[var(--text)]">Oceny</span>
              </Link>
              <Link href="/attendance" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white/[0.025] hover:bg-white/[0.05] hover:border-[var(--border-strong)] transition-all">
                <span className="text-xl">📈</span>
                <span className="font-medium text-[var(--text)]">Frekwencja</span>
              </Link>
              <Link href="/study" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white/[0.025] hover:bg-white/[0.05] hover:border-[var(--border-strong)] transition-all">
                <span className="text-xl">🤖</span>
                <span className="font-medium text-[var(--text)]">AI Asystent</span>
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}