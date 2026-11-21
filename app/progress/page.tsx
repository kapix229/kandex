"use client";

import { useEffect, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Clock,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  Star,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

type StudySession = {
  date: string;
  duration: number; // minutes
  subject: string;
  activity: "learning" | "flashcards" | "ai-tutor" | "practice";
};

type SubjectProgress = {
  subject: string;
  totalTime: number;
  sessionsCount: number;
  lastStudied: string;
  mastery: number; // 0-100
};

type AchievementProgress = {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
};

const mockStudySessions: StudySession[] = [
  { date: "2024-11-20", duration: 45, subject: "Matematyka", activity: "learning" },
  { date: "2024-11-19", duration: 60, subject: "Fizyka", activity: "flashcards" },
  { date: "2024-11-18", duration: 30, subject: "Chemia", activity: "ai-tutor" },
  { date: "2024-11-17", duration: 90, subject: "Matematyka", activity: "practice" },
  { date: "2024-11-16", duration: 45, subject: "Biologia", activity: "learning" },
  { date: "2024-11-15", duration: 60, subject: "Fizyka", activity: "flashcards" },
  { date: "2024-11-14", duration: 30, subject: "Chemia", activity: "learning" },
  { date: "2024-11-13", duration: 45, subject: "Matematyka", activity: "practice" },
  { date: "2024-11-12", duration: 60, subject: "Język angielski", activity: "ai-tutor" },
  { date: "2024-11-11", duration: 90, subject: "Historia", activity: "learning" },
  { date: "2024-11-10", duration: 30, subject: "Geografia", activity: "flashcards" },
  { date: "2024-11-09", duration: 45, subject: "Matematyka", activity: "learning" },
];

const mockSubjectProgress: SubjectProgress[] = [
  { subject: "Matematyka", totalTime: 380, sessionsCount: 12, lastStudied: "2024-11-20", mastery: 78 },
  { subject: "Fizyka", totalTime: 245, sessionsCount: 8, lastStudied: "2024-11-19", mastery: 65 },
  { subject: "Chemia", totalTime: 180, sessionsCount: 6, lastStudied: "2024-11-17", mastery: 58 },
  { subject: "Biologia", totalTime: 120, sessionsCount: 4, lastStudied: "2024-11-16", mastery: 52 },
  { subject: "Język angielski", totalTime: 95, sessionsCount: 3, lastStudied: "2024-11-12", mastery: 45 },
  { subject: "Historia", totalTime: 90, sessionsCount: 3, lastStudied: "2024-11-11", mastery: 48 },
  { subject: "Geografia", totalTime: 60, sessionsCount: 2, lastStudied: "2024-11-10", mastery: 35 },
  { subject: "Informatyka", totalTime: 45, sessionsCount: 1, lastStudied: "2024-11-05", mastery: 28 },
];

const mockAchievements: AchievementProgress[] = [
  { id: "streak-7", title: "Tydzień nauki", description: "Ucz się 7 dni z rzędu", icon: "Flame", progress: 7, maxProgress: 7, unlocked: true },
  { id: "streak-30", title: "Miesiąc nauki", description: "Ucz się 30 dni z rzędu", icon: "Flame", progress: 12, maxProgress: 30, unlocked: false },
  { id: "hours-10", title: "10 godzin nauki", description: "Zbierz 10 godzin nauki w sumie", icon: "Clock", progress: 18.5, maxProgress: 10, unlocked: true },
  { id: "hours-50", title: "50 godzin nauki", description: "Zbierz 50 godzin nauki w sumie", icon: "Clock", progress: 18.5, maxProgress: 50, unlocked: false },
  { id: "sessions-50", title: "50 sesji", description: "Zakończ 50 sesji nauki", icon: "Target", progress: 24, maxProgress: 50, unlocked: false },
  { id: "subjects-5", title: "Pentathlon", description: "Ucz się 5 różnych przedmiotów", icon: "BookOpen", progress: 7, maxProgress: 5, unlocked: true },
  { id: "ai-questions-20", title: "Kuratory AI", description: "Zadaj 20 pytań AI Tutorowi", icon: "Brain", progress: 8, maxProgress: 20, unlocked: false },
  { id: "flashcards-100", title: "Mistrz fiszek", description: "Przejrzyj 100 fiszek", icon: "Zap", progress: 35, maxProgress: 100, unlocked: false },
];

export default function ProgressPage() {
  const { account, signOut } = useVulcanSession();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "semester" | "year">("week");
  const [loading, setLoading] = useState(false);

  // Calculate stats based on period
  const periodStart = (() => {
    const now = new Date();
    const start = new Date();
    switch (selectedPeriod) {
      case "week": start.setDate(now.getDate() - 6); break;
      case "month": start.setDate(now.getDate() - 29); break;
      case "semester": start.setMonth(now.getMonth() - 5); break;
      case "year": start.setFullYear(now.getFullYear() - 1); break;
    }
    return start.toISOString().slice(0, 10);
  })();

  const filteredSessions = mockStudySessions.filter(s => s.date >= periodStart);
  const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalSessions = filteredSessions.length;
  const avgSessionTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;
  const subjectsStudied = new Set(filteredSessions.map(s => s.subject)).size;

  // Calculate streak (simplified - check consecutive days from today backwards)
  const streak = (() => {
    let streakCount = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().slice(0, 10);
      const hasSession = mockStudySessions.some(s => s.date === dateStr);
      if (hasSession) {
        streakCount++;
      } else if (i > 0) {
        break;
      }
    }
    return streakCount;
  })();

  // Activity breakdown
  const activityBreakdown = filteredSessions.reduce((acc, s) => {
    acc[s.activity] = (acc[s.activity] || 0) + s.duration;
    return acc;
  }, {} as Record<string, number>);

  // Daily data for chart
  const dailyData = (() => {
    const data: { date: string; time: number }[] = [];
    const now = new Date();
    const daysBack = selectedPeriod === "week" ? 6 : selectedPeriod === "month" ? 29 : selectedPeriod === "semester" ? 180 : 365;
    for (let i = daysBack; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTime = filteredSessions
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + s.duration, 0);
      data.push({ date: dateStr, time: dayTime });
    }
    return data;
  })();

  async function handleLogout() {
    try {
      await fetch("/api/eduvulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
  };

  const getActivityLabel = (activity: string) => {
    switch (activity) {
      case "learning": return "Materiały";
      case "flashcards": return "Fiszki";
      case "ai-tutor": return "AI Tutor";
      case "practice": return "Ćwiczenia";
      default: return activity;
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case "learning": return "bg-[var(--accent)]";
      case "flashcards": return "bg-[var(--success)]";
      case "ai-tutor": return "bg-[var(--warning)]";
      case "practice": return "bg-[var(--info)]";
      default: return "bg-[var(--text-tertiary)]";
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case "learning": return <BookOpen className="h-4 w-4" strokeWidth={2} />;
      case "flashcards": return <Zap className="h-4 w-4" strokeWidth={2} />;
      case "ai-tutor": return <Brain className="h-4 w-4" strokeWidth={2} />;
      case "practice": return <Target className="h-4 w-4" strokeWidth={2} />;
      default: return <Clock className="h-4 w-4" strokeWidth={2} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Workspace</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Postęp nauki</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Śledź swoją regularność i wyniki</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SyncButton onSync={async () => { setLoading(true); setTimeout(() => setLoading(false), 1000); }} label="Odśwież" disabled={loading} />
          {account && (
            <button onClick={handleLogout} className="btn-secondary">Wyloguj</button>
          )}
        </div>
      </div>

      {/* Period Selector */}
      <div className="card p-4 animate-slide-up">
        <div className="flex flex-wrap gap-2">
          {(["week", "month", "semester", "year"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? "bg-[var(--accent)] text-[var(--text-inverse)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {period === "week" ? "Tydzień" : period === "month" ? "Miesiąc" : period === "semester" ? "Semestr" : "Rok"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up stagger-children">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Czas nauki</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text)] tabular-nums font-mono">{formatDuration(totalTime)}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)]">
              <Clock className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">Średnio {avgSessionTime} min/sesję</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Sesje</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text)] tabular-nums font-mono">{totalSessions}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--success-muted)] text-[var(--success)]">
              <Target className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">{subjectsStudied} przedmiotów</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Seria</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--warning)] tabular-nums font-mono">{streak} dni</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--warning-muted)] text-[var(--warning)]">
              <Flame className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">Kontynuuj, by nie przerwać!</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Opanowanie</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--info)] tabular-nums font-mono">
                {mockSubjectProgress.length > 0
                  ? Math.round(mockSubjectProgress.reduce((sum, s) => sum + s.mastery, 0) / mockSubjectProgress.length)
                  : 0}%
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--info-muted)] text-[var(--info)]">
              <TrendingUp className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">Średnia z {mockSubjectProgress.length} przedmiotów</p>
        </div>
      </div>

      {/* Chart Area - Study Time Visualization */}
      <div className="card p-5 animate-slide-up">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Aktywność</p>
            <h3 className="mt-1 text-lg font-extrabold text-[var(--text)]">Czas nauki dziennie</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
            <span>Suma: <strong className="text-[var(--text)] tabular-nums font-mono">{formatDuration(totalTime)}</strong></span>
            <span>Średnia: <strong className="text-[var(--text)] tabular-nums font-mono">{totalSessions > 0 ? formatDuration(Math.round(totalTime / dailyData.filter(d => d.time > 0).length || 1)) : "0 min"}</strong></span>
          </div>
        </div>

        <div className="h-64 flex items-end justify-between gap-1.5 px-2 pb-2">
          {dailyData.map((day, index) => {
            const maxTime = Math.max(...dailyData.map(d => d.time), 1);
            const height = Math.max(4, (day.time / maxTime) * 200);
            const isToday = day.date === new Date().toISOString().slice(0, 10);
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isToday ? "bg-[var(--accent)]" : day.time > 0 ? "bg-[var(--accent-primary-muted)]" : "bg-[var(--border)]"
                  }`}
                  style={{ height: `${height}px` }}
                  title={`${formatDateShort(day.date)}: ${day.time > 0 ? formatDuration(day.time) : "Brak nauki"}`}
                />
                <span className={`text-[10px] font-mono tabular-nums ${isToday ? "text-[var(--accent)] font-bold" : "text-[var(--text-tertiary)]"}`}>
                  {formatDateShort(day.date).split(".")[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[var(--accent)]" />
            Dziś
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[var(--accent-primary-muted)]" />
            Z nauką
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[var(--border)]" />
            Wolne
          </span>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 animate-slide-up" style={{ animationDelay: "60ms" }}>
        {/* Activity Types */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Rodzaj aktywności</p>
              <h3 className="mt-1 text-lg font-extrabold text-[var(--text)]">Jak się uczysz</h3>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(activityBreakdown).map(([activity, time]) => {
              const percentage = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
              return (
                <div key={activity} className="animate-slide-up">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`grid h-8 w-8 place-items-center rounded-lg ${getActivityColor(activity)} text-[var(--text-inverse)]`}>
                        {getActivityIcon(activity)}
                      </span>
                      <div>
                        <p className="font-medium text-[var(--text)]">{getActivityLabel(activity)}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{formatDuration(time)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[var(--text)] tabular-nums font-mono">{percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, background: `var(--${activity === "learning" ? "accent" : activity === "flashcards" ? "success" : activity === "ai-tutor" ? "warning" : "info"})` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(activityBreakdown).length === 0 && (
              <div className="text-center py-8 text-[var(--text-tertiary)]">
                <Clock className="h-12 w-12 mx-auto mb-3" strokeWidth={1.5} />
                <p>Brak danych w wybranym okresie</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Heatmap */}
        <div className="card p-5">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Regularność</p>
            <h3 className="mt-1 text-lg font-extrabold text-[var(--text)]">Tygodniowy wzorzec</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr>
                  {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"].map((day) => (
                    <th key={day} className="px-2 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, weekIndex) => (
                  <tr key={weekIndex}>
                    {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (date.getDay() + 6) % 7); // Last Monday
                      date.setDate(date.getDate() - (3 - weekIndex) * 7 + dayOfWeek);
                      const dateStr = date.toISOString().slice(0, 10);
                      const dayTime = mockStudySessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.duration, 0);
                      const intensity = dayTime === 0 ? 0 : dayTime < 30 ? 1 : dayTime < 60 ? 2 : dayTime < 90 ? 3 : 4;
                      const isFuture = date > new Date();
                      return (
                        <td key={dayOfWeek} className="px-1 py-1.5">
                          <div
                            className={`w-8 h-8 mx-auto rounded-lg transition-all ${
                              isFuture ? "bg-[var(--border)] opacity-40" :
                              intensity === 0 ? "bg-[var(--bg-tertiary)]" :
                              intensity === 1 ? "bg-[var(--accent-primary-muted)]" :
                              intensity === 2 ? "bg-[var(--accent)]/30" :
                              intensity === 3 ? "bg-[var(--accent)]/60" :
                              "bg-[var(--accent)]"
                            }`}
                            title={isFuture ? "Przyszłość" : dayTime === 0 ? "Brak nauki" : `${formatDuration(dayTime)}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--bg-tertiary)]" /> 0 min</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--accent-primary-muted)]" /> mniej niż 30 min</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--accent)] opacity-30" /> 30-60 min</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--accent)]" /> powyżej 90 min</span>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      <div className="card p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Przedmioty</p>
            <h3 className="mt-1 text-lg font-extrabold text-[var(--text)]">Postęp w przedmiotach</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] border-b border-[var(--border)]">
                <th className="pb-3 pr-4">Przedmiot</th>
                <th className="pb-3 pr-4 text-right">Opanowanie</th>
                <th className="pb-3 pr-4 text-right">Czas</th>
                <th className="pb-3 pr-4 text-right">Sesje</th>
                <th className="pb-3 pr-4 text-right">Ostatnio</th>
                <th className="pb-3">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {mockSubjectProgress.map((subject, index) => (
                <tr key={subject.subject} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent-primary-muted)] text-[var(--accent)]">
                        <BookOpen className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="font-medium text-[var(--text)]">{subject.subject}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-32 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all duration-500"
                          style={{ width: `${subject.mastery}%` }}
                        />
                      </div>
                      <span className="font-bold text-[var(--text)] tabular-nums font-mono w-12 text-right">{subject.mastery}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-mono tabular-nums text-[var(--text-secondary)]">{formatDuration(subject.totalTime)}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-mono tabular-nums text-[var(--text-secondary)]">{subject.sessionsCount}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-sm text-[var(--text-tertiary)]">{formatDateShort(subject.lastStudied)}</span>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/learning?subject=${encodeURIComponent(subject.subject)}`}
                      className="btn-ghost text-xs gap-1"
                    >
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                      Kontynuuj
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Achievements Progress */}
      <div className="card p-5 animate-slide-up" style={{ animationDelay: "140ms" }}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Osiągnięcia</p>
            <h3 className="mt-1 text-lg font-extrabold text-[var(--text)]">Twoje cele</h3>
          </div>
          <Link href="/achievements" className="btn-ghost text-xs gap-1">
            Wszystkie
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mockAchievements.slice(0, 8).map((achievement, index) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border transition-all ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-[var(--surface)] to-[var(--accent-primary-muted)] border-[var(--accent-primary-border)]"
                  : "bg-[var(--surface)] border-[var(--border)]"
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl ${
                  achievement.unlocked
                    ? "bg-[var(--warning)] text-[var(--text-inverse)]"
                    : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                }`}>
                  {achievement.icon === "Trophy" && <Trophy className="h-5 w-5" strokeWidth={2} />}
                  {achievement.icon === "Target" && <Target className="h-5 w-5" strokeWidth={2} />}
                  {achievement.icon === "Flame" && <Flame className="h-5 w-5" strokeWidth={2} />}
                  {achievement.icon === "Clock" && <Clock className="h-5 w-5" strokeWidth={2} />}
                  {achievement.icon === "BookOpen" && <BookOpen className="h-5 w-5" strokeWidth={2} />}
                  {achievement.icon === "Brain" && <Brain className="h-5 w-5" strokeWidth={2} />}
                  {achievement.icon === "Zap" && <Zap className="h-5 w-5" strokeWidth={2} />}
                  {achievement.icon === "CheckCircle" && <CheckCircle className="h-5 w-5" strokeWidth={2} />}
                  {achievement.icon === "Star" && <Star className="h-5 w-5" strokeWidth={2} />}
                </div>
                {achievement.unlocked && (
                  <CheckCircle className="h-5 w-5 text-[var(--success)] flex-shrink-0" strokeWidth={2} />
                )}
              </div>
              <h4 className={`font-bold text-sm ${achievement.unlocked ? "text-[var(--text)]" : "text-[var(--text-tertiary)]"}`}>
                {achievement.title}
              </h4>
              <p className={`mt-1 text-xs leading-relaxed ${achievement.unlocked ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                {achievement.description}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className={achievement.unlocked ? "text-[var(--success)]" : "text-[var(--text-tertiary)]"}>Postęp</span>
                  <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                    {Math.min(achievement.progress, achievement.maxProgress)} / {achievement.maxProgress}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%`,
                      background: achievement.unlocked
                        ? "linear-gradient(90deg, var(--warning), var(--accent))"
                        : "var(--accent-primary-muted)",
                    }}
                  />
                </div>
              </div>
              {achievement.unlocked && (
                <p className="mt-2 text-xs text-[var(--success)] font-medium">✓ Odblokowane</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5 animate-slide-up" style={{ animationDelay: "180ms" }}>
        <h3 className="text-lg font-bold text-[var(--text)] mb-4">Szybkie akcje</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/learning" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-primary-muted)] text-[var(--accent)] group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-medium text-[var(--text)]">Kontynuuj naukę</p>
              <p className="text-xs text-[var(--text-tertiary)]">Materiały i lekcje</p>
            </div>
          </Link>
          <Link href="/ai-tutor" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--warning-muted)] text-[var(--warning)] group-hover:scale-105 transition-transform">
              <Brain className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-medium text-[var(--text)]">Zapytaj AI Tutora</p>
              <p className="text-xs text-[var(--text-tertiary)]">Wyjaśnienia i pomoc</p>
            </div>
          </Link>
          <Link href="/flashcards" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--success-muted)] text-[var(--success)] group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-medium text-[var(--text)]">Powtórz fiszki</p>
              <p className="text-xs text-[var(--text-tertiary)]">Spaced repetition</p>
            </div>
          </Link>
          <Link href="/achievements" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--info-muted)] text-[var(--info)] group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-medium text-[var(--text)]">Osiągnięcia</p>
              <p className="text-xs text-[var(--text-tertiary)]">Wszystkie cele</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}