import { AttendanceData, AttendanceEntry } from "../src/types/journals";

/**
 * Oblicza statystyki frekwencji.
 */
export const calculateAttendanceStats = (data: AttendanceData) => {
  const { entries } = data;
  const total = entries.length;

  if (total === 0) {
    return {
      percentage: 0,
      summary: data.summary,
    };
  }

  // Oblicz procent obecności (uwzględniając spóźnienia jako obecność)
  const presentCount = entries.filter(e => e.status === "present" || e.status === "late" || e.status === "excused").length;
  const percentage = (presentCount / total) * 100;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    summary: data.summary,
  };
};

/**
 * Grupuje frekwencję według przedmiotów.
 */
export const getAttendanceBySubject = (entries: AttendanceEntry[]) => {
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
};
