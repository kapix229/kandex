import { AttendanceData, AttendanceEntry, AttendanceSummary } from "@/src/types/shared";
import { safeParseDate, getIsoDateString } from "@/services/grade-calculator";

interface AttendanceChartProps {
  data: AttendanceData;
}

interface SubjectAttendance {
  subject: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percentage: number;
}

interface WeekDayStats {
  day: string;
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
  excused: number;
}

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  status: "present" | "absent" | "late" | "excused" | "unknown";
}

interface MonthlyCalendar {
  days: CalendarDay[][];
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
}

/**
 * Generates weekly statistics for the current week.
 */
function generateWeeklyStats(entries: AttendanceEntry[]): WeekDayStats[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats: WeekDayStats[] = [];

  // Generate days for the current week (starting from Sunday)
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    const dayKey = day.toISOString().slice(0, 10);

    const dayEntries = entries.filter(e => {
      // Safely parse the entry date to avoid RangeError on invalid dates
      const entryDate = safeParseDate(e.date);
      if (!entryDate) return false; // Skip entries with invalid dates
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.toISOString().slice(0, 10) === dayKey;
    });

    const present = dayEntries.filter(e => e.status === "present").length;
    const absent = dayEntries.filter(e => e.status === "absent").length;
    const late = dayEntries.filter(e => e.status === "late").length;
    const excused = dayEntries.filter(e => e.status === "excused").length;
    const total = dayEntries.length;
    const percentage = total > 0 ? ((present + late + excused) / total) * 100 : 0;

    const dayNames = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    const dayName = dayNames[day.getDay()];

    stats.push({
      day: dayName,
      date: dayKey,
      present,
      absent,
      late,
      excused,
      total,
      percentage: Math.round(percentage * 100) / 100,
    });
  }

  return stats;
}

/**
 * Groups attendance by subject.
 */
function getAttendanceBySubject(entries: AttendanceEntry[]): Record<string, { present: number; absent: number; late: number; excused: number }> {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.subject]) {
      acc[entry.subject] = { present: 0, absent: 0, late: 0, excused: 0 };
    }

    if (entry.status === "present") acc[entry.subject].present++;
    else if (entry.status === "absent") acc[entry.subject].absent++;
    else if (entry.status === "late") acc[entry.subject].late++;
    else if (entry.status === "excused") acc[entry.subject].excused++;

    return acc;
  }, {} as Record<string, { present: number; absent: number; late: number; excused: number }>);
}

/**
 * Groups attendance by subject for the component.
 */
function calculateSubjectAttendance(entries: AttendanceEntry[]): SubjectAttendance[] {
  const grouped = getAttendanceBySubject(entries);

  return Object.entries(grouped).map(([subject, counts]) => {
    const total = counts.present + counts.absent + counts.late + counts.excused;
    const percentage = total > 0 ? ((counts.present + counts.late + counts.excused) / total) * 100 : 0;
    return {
      subject,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      excused: counts.excused,
      total,
      percentage: Math.round(percentage * 100) / 100,
    };
  });
}

/**
 * Generates monthly calendar view data.
 */
function generateMonthlyCalendar(entries: AttendanceEntry[], year: number, month: number): MonthlyCalendar {
  const days: CalendarDay[][] = [];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayWeekDay = firstDay.getDay(); // 0 = niedziela

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Add days from previous month
  const prevMonthDays: CalendarDay[] = [];
  for (let i = 0; i < firstDayWeekDay; i++) {
    const dayNum = prevMonthLastDay - firstDayWeekDay + i + 1;
    const date = new Date(year, month - 1, dayNum);
    prevMonthDays.push({
      date: date.toISOString().slice(0, 10),
      dayOfMonth: dayNum,
      isCurrentMonth: false,
      status: "unknown",
    });
  }
  days.push(prevMonthDays);

  // Add days from current month
  const currentMonthDays: CalendarDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().slice(0, 10);
    const dayEntries = entries.filter(e => {
      // Safely parse the entry date to avoid RangeError on invalid dates
      const entryDate = safeParseDate(e.date);
      if (!entryDate) return false; // Skip entries with invalid dates
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.toISOString().slice(0, 10) === dateStr;
    });

    let status: "present" | "absent" | "late" | "excused" | "unknown" = "unknown";
    if (dayEntries.length > 0) {
      const lastEntry = dayEntries[dayEntries.length - 1];
      status = lastEntry.status;
    }

    currentMonthDays.push({
      date: dateStr,
      dayOfMonth: day,
      isCurrentMonth: true,
      status,
    });
  }
  days.push(currentMonthDays);

  // Add days from next month to complete the grid (6 rows x 7 columns = 42 days total)
  const currentTotal = prevMonthDays.length + currentMonthDays.length;
  const remaining = 42 - currentTotal;
  const nextMonthDays: CalendarDay[] = [];
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day);
    nextMonthDays.push({
      date: d.toISOString().slice(0, 10),
      dayOfMonth: day,
      isCurrentMonth: false,
      status: "unknown",
    });
  }
  days.push(nextMonthDays);

  // Calculate totals
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;

  currentMonthDays.forEach(day => {
    if (day.status === "present") totalPresent++;
    if (day.status === "absent") totalAbsent++;
    if (day.status === "late") totalLate++;
  });

  return { days, totalPresent, totalAbsent, totalLate };
}

/**
 * Calculate attendance percentage (present + late) / total
 */
function calculateRate(summary: AttendanceSummary): number {
  const total = summary.present + summary.absent + summary.late + summary.excused + summary.unknown;
  return total > 0 ? Math.round(((summary.present + summary.late) / total) * 100) : 0;
}

export const AttendanceChart = ({ data }: AttendanceChartProps) => {
  const percentage = calculateRate(data.summary);
  const summary = data.summary;
  const entries = data.entries;
  const total = summary.present + summary.absent + summary.late + summary.excused + summary.unknown;

  // Subject-wise attendance
  const subjectAttendance = entries.length > 0 ? calculateSubjectAttendance(entries) : [];

  // Weekly stats
  const weeklyStats = generateWeeklyStats(entries);

  // Monthly calendar - current month
  const now = new Date();
  const monthlyCalendar = generateMonthlyCalendar(entries, now.getFullYear(), now.getMonth());

  if (total === 0) return <div>Brak danych o frekwencji</div>;

  return (
    <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Frekwencja</h2>

      {/* Statistics Summary */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ogólny wynik</p>
          <p className="text-2xl font-bold text-[var(--success)]">{Math.round(percentage)}%</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Obecne</p>
          <p className="text-2xl font-bold text-[var(--success)]">{summary.present}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Spóźnienia</p>
          <p className="text-2xl font-bold text-[var(--warning)]">{summary.late}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Nieobecne</p>
          <p className="text-2xl font-bold text-[var(--danger)]">{summary.absent}</p>
        </div>
      </div>

      {/* Subject-wise breakdown */}
      {subjectAttendance.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-[var(--text-muted)]">Frekwencja po przedmiotach</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {subjectAttendance.slice(0, 6).map((sa) => (
              <div key={sa.subject} className="p-2 rounded bg-white/[0.025] border border-[var(--border)] text-xs">
                <span className="font-medium text-[var(--text)] truncate">{sa.subject}</span>
                <div className={`w-full h-1 rounded-full bg-white/[0.1] overflow-hidden`}>
                  <div style={{ width: `${sa.percentage}%` }} className={`h-full rounded-full ${sa.percentage >= 75 ? "bg-emerald-500" : sa.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"} w-full`} />
                </div>
                <span className="text-[var(--text-tertiary)] ml-1 text-xs">{sa.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
          {subjectAttendance.length > 6 && (
            <div className="mt-2 text-[var(--text-tertiary)] text-xs">
              ...i jeszcze {subjectAttendance.length - 6} przedmiotów
            </div>
          )}
        </div>
      )}

      {/* Weekly grid */}
      {entries.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-[var(--text-muted)]">Tygodniowy widok</p>
          <div className="grid grid-cols-7 gap-1">
            {weeklyStats.map((ws) => (
              <div key={ws.date} className="aspect-square rounded-xl bg-white/[0.025] border border-[var(--border)] flex flex-col items-center justify-between p-2">
                <p className="text-[var(--text-tertiary)] text-xs">{ws.day}</p>
                <p className="text-sm font-semibold text-[var(--text)]">{ws.present}</p>
                <p className="text-[var(--text-tertiary)] text-xs">
                  {ws.absent + ws.late}/{ws.total}
                </p>
                <div className="w-8 h-0.5 rounded-full mt-1 bg-white/[0.1] overflow-hidden">
                  <div style={{ width: `${ws.percentage}%` }} className={`h-full rounded-full ${ws.percentage >= 75 ? "bg-emerald-500" : ws.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"} w-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly calendar view */}
      {entries.length > 0 && (
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-4">Miesięczny kalendarz</p>
          <div className="grid grid-cols-7 mt-2">
            <p className="text-[var(--text-tertiary)] text-sm font-medium py-1">N</p>
            <p className="text-[var(--text-tertiary)] text-sm font-medium py-1">Pn</p>
            <p className="text-[var(--text-tertiary)] text-sm font-medium py-1">Wt</p>
            <p className="text-[var(--text-tertiary)] text-sm font-medium py-1">Śr</p>
            <p className="text-[var(--text-tertiary)] text-sm font-medium py-1">Czw</p>
            <p className="text-[var(--text-tertiary)] text-sm font-medium py-1">Pt</p>
            <p className="text-[var(--text-tertiary)] text-sm font-medium py-1">Sb</p>
          </div>
          <div className="grid grid-cols-7 gap-1 pt-1">
            {monthlyCalendar.days.map((dayRow, dayIndex) => (
              <div key={dayIndex} className="flex flex-col items-center gap-1">
                {dayRow.map((day) => (
                  <div
                    key={day.date}
                    className={`w-6 h-6 rounded-full ${day.isCurrentMonth ? "" : "opacity-50"} ${day.status === "present" ? "bg-emerald-500" : day.status === "absent" ? "bg-red-500" : day.status === "late" ? "bg-yellow-500" : "bg-gray-500"} text-[1] text-xs font-bold ${day.date.startsWith(now.toISOString().slice(0, 10)) ? "font-bold" : ""} ${day.isCurrentMonth ? "text-[var(--text)]" : "text-[var(--text-tertiary)]"}`}
                  >
                    {day.dayOfMonth}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual chart - bar chart */}
      {entries.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-[var(--text-muted)]">Wykres frekwencji</p>
          <div className="h-8 grid grid-cols-7 gap-1 pt-1">
            {weeklyStats.slice(0, 7).map((ws, i) => {
              const barColor = ws.percentage >= 75 ? "bg-emerald-500" : ws.percentage >= 50 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[var(--text-tertiary)] text-xs">{ws.day}</span>
                  <div className="h-3 rounded-full bg-white/[0.1] overflow-hidden w-full">
                    <div style={{ height: `${ws.percentage}%` }} className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`} />
                  </div>
                  <span className="text-[var(--text-tertiary)] text-xs">{ws.percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};