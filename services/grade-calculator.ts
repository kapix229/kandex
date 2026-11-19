/**
 * Grade calculation engine for Kandex
 * Supports weighted averages, trends, and Polish grading conventions
 */

import type { Grade, AttendanceData, AttendanceSummary, AttendanceEntry } from "@/src/types/shared";

/**
 * Represents a grade calculation result
 */
export interface GradeCalculationResult {
  /** Average grade for a subject (numeric value) */
  average: number;
  /** Grade count used for average */
  count: number;
  /** Weighted sum of grades */
  weightedSum: number;
  /** Total weight */
  totalWeight: number;
  /** Grade type distribution */
  typeDistribution: Record<string, number>;
}

/**
 * Represents subject grade statistics
 */
export interface SubjectGradeStats {
  /** Subject ID */
  subjectId: string;
  /** Subject name */
  subjectName: string;
  /** Calculated average */
  average: number;
  /** Number of grades */
  count: number;
  /** Weighted average */
  weightedAverage: number;
  /** Weighted sum of grades */
  weightedSum: number;
  /** Total weight */
  totalWeight: number;
  /** Grade type distribution */
  typeDistribution: Record<string, number>;
}

/**
 * Overall grade statistics
 */
export interface OverallGradeStats {
  /** Overall average across all subjects */
  overallAverage: number;
  /** Total number of grades */
  totalGrades: number;
  /** Subject-by-subject breakdown */
  subjects: SubjectGradeStats[];
  /** Best performing subjects (top 3) */
  bestSubjects: SubjectGradeStats[];
  /** Subject with lowest average */
  lowestSubject: SubjectGradeStats | null;
  /** Trend: 'improving', 'declining', 'stable' */
  trend: "improving" | "declining" | "stable";
}

/**
 * Parse Polish grade value including +/- modifiers
 * @param value - The grade value (string or number)
 * @returns Numeric grade value (e.g., "4+" becomes 4.25)
 */
export function parseGradeValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return NaN;

  const normalized = String(value).trim().replace(",", ".");
  const match = normalized.match(/^(\d+(?:[.,]\d+)?)([+-])?$/);

  if (!match) return NaN;

  const base = Number(match[1].replace(",", "."));
  const modifier = match[2];

  // Polish grading: + adds 0.25, - subtracts 0.25
  if (modifier === "+") return base + 0.25;
  if (modifier === "-") return base - 0.25;
  return base;
}

/**
 * Safely parse and validate a date string
 * Returns a valid Date object or null if invalid
 * Handles empty strings, invalid formats, and Invalid Date objects
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== "string") return null;

  const trimmed = dateString.trim();
  if (trimmed === "") return null;

  try {
    const date = new Date(trimmed);
    // Check for Invalid Date - getTime() returns NaN for invalid dates
    if (Number.isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Get ISO date string from various formats
 * Returns null if date cannot be parsed
 */
export function getIsoDateString(dateInput: string | Date | null | undefined): string | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) return null;
    return dateInput.toISOString().slice(0, 10);
  }

  const parsed = safeParseDate(dateInput);
  return parsed ? parsed.toISOString().slice(0, 10) : null;
}

/**
 * Calculate average grade for a list of grades
 * Supports weighted averages where grades can have different weights
 */
export function calculateAverage(grades: Grade[], options?: {
  /** Weight grades by their weight property */
  weighted?: boolean;
  /** Filter to specific date range */
  dateFrom?: Date;
  dateTo?: Date;
}): number {
  if (!grades.length) return NaN;

  let sum = 0;
  let totalWeight = 0;

  for (const grade of grades) {
    const numericValue = parseGradeValue(grade.numericValue ?? grade.value);
    if (!Number.isFinite(numericValue)) continue;

    const weight = options?.weighted !== false ? (grade.weight ?? 1) : 1;
    sum += numericValue * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return NaN;
  return sum / totalWeight;
}

/**
 * Calculate weighted average for a list of grades - convenience wrapper
 * @param grades Array of Grade objects
 * @returns Weighted average grade (or NaN if no valid grades)
 */
export function calculateWeightedAverage(grades: Grade[]): number {
  return calculateAverage(grades, { weighted: true });
}

/**
 * Calculate subject-by-subject grade statistics
 */
export function calculateSubjectStats(grades: Grade[]): SubjectGradeStats[] {
  const subjectMap = new Map<string, SubjectGradeStats>();

  for (const grade of grades) {
    const key = grade.subjectId;
    const existing = subjectMap.get(key);

    const subjectName = grade.subjectName;
    const numericValue = parseGradeValue(grade.numericValue ?? grade.value);
    const weight = grade.weight ?? 1;

    if (!Number.isFinite(numericValue)) continue;

    if (existing) {
      existing.weightedSum += numericValue * weight;
      existing.totalWeight += weight;
      existing.count += 1;
      existing.average = existing.weightedSum / existing.totalWeight;

      const type = grade.type ?? "ocena";
      existing.typeDistribution[type] = (existing.typeDistribution[type] ?? 0) + 1;
    } else {
      const weightedSum = numericValue * weight;
      const totalWeight = weight;
      subjectMap.set(key, {
        subjectId: key,
        subjectName,
        average: numericValue,
        count: 1,
        weightedSum,
        totalWeight,
        weightedAverage: weightedSum / totalWeight,
        typeDistribution: { [grade.type ?? "ocena"]: 1 },
      });
    }
  }

  // Calculate weighted averages
  const result: SubjectGradeStats[] = [];
  for (const stats of subjectMap.values()) {
    stats.weightedAverage = stats.weightedSum / stats.totalWeight;
    result.push(stats);
  }

  return result.sort((a, b) => b.average - a.average);
}

/**
 * Calculate overall grade statistics
 */
export function calculateOverallStats(grades: Grade[]): OverallGradeStats {
  const subjects = calculateSubjectStats(grades);

  if (!subjects.length) {
    return {
      overallAverage: NaN,
      totalGrades: 0,
      subjects: [],
      bestSubjects: [],
      lowestSubject: null,
      trend: "stable",
    };
  }

  const totalSum = subjects.reduce((sum, s) => sum + s.weightedSum, 0);
  const totalWeight = subjects.reduce((sum, s) => sum + s.totalWeight, 0);
  const overallAverage = totalWeight > 0 ? totalSum / totalWeight : NaN;
  const totalGrades = grades.length;

  const bestSubjects = [...subjects].sort((a, b) => b.average - a.average).slice(0, 3);
  const lowestSubject = subjects.length > 0 ? subjects[subjects.length - 1] : null;

  // Calculate trend based on grade dates (compare recent vs older grades)
  const trend = calculateTrend(grades);

  return {
    overallAverage,
    totalGrades,
    subjects,
    bestSubjects,
    lowestSubject,
    trend,
  };
}

/**
 * Calculate grade trend (improving, declining, or stable)
 * Compares average of recent grades vs older grades in the last 30 days
 */
export function calculateTrend(grades: Grade[]): "improving" | "declining" | "stable" {
  if (grades.length < 4) return "stable";

  const sorted = [...grades].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const half = Math.floor(sorted.length / 2);
  const recentGrades = sorted.slice(0, half);
  const olderGrades = sorted.slice(half);

  const recentAvg = calculateAverage(recentGrades);
  const olderAvg = calculateAverage(olderGrades);

  if (Number.isNaN(recentAvg) || Number.isNaN(olderAvg)) return "stable";

  const diff = recentAvg - olderAvg;

  if (diff > 0.25) return "improving";
  if (diff < -0.25) return "declining";
  return "stable";
}

/**
 * Calculate attendance statistics
 */
export function calculateAttendanceStats(attendance: AttendanceData): {
  /** Daily attendance status */
  daily: Array<{
    date: string;
    status: "present" | "absent" | "late" | "excused" | "unknown";
    lessonCount: number;
  }>;
  /** Summary statistics */
  summary: AttendanceSummary & {
    /** Overall attendance rate (present + late / total) */
    rate: number;
    /** Percentage of absent days */
    absentRate: number;
  };
  /** Trend analysis for attendance */
  trend: "improving" | "declining" | "stable";
} {
  const { summary, entries } = attendance;

  // Calculate daily breakdown
  const dailyMap = new Map<string, {
    status: "present" | "absent" | "late" | "excused" | "unknown";
    count: number;
  }>();

  for (const entry of entries) {
    const existing = dailyMap.get(entry.date);
    if (existing) {
      // If any lesson was late, mark as late
      if (entry.status === "late") {
        existing.status = "late";
      } else if (entry.status === "present" && existing.status !== "late") {
        existing.status = "present";
      }
      existing.count += 1;
    } else {
      dailyMap.set(entry.date, {
        status: entry.status,
        count: 1,
      });
    }
  }

  const daily = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, status: data.status, lessonCount: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const total = summary.present + summary.absent + summary.late + summary.excused + summary.unknown;
  const rate = total > 0 ? Math.round(((summary.present + summary.late) / total) * 100) : 0;
  const absentRate = total > 0 ? Math.round((summary.absent / total) * 100) : 0;

  // Calculate trend (last 7 days vs previous period)
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const recentCount = 7;
  const recentEntries = sortedEntries.slice(0, recentCount);
  const olderEntries = sortedEntries.slice(recentCount, recentCount * 2);

  const recentPresent = recentEntries.filter(e => e.status === "present" || e.status === "late").length;
  const recentTotal = recentEntries.length;
  const olderPresent = olderEntries.filter(e => e.status === "present" || e.status === "late").length;
  const olderTotal = Math.max(olderEntries.length, 1);

  const recentRate = recentTotal > 0 ? recentPresent / recentTotal : 0;
  const olderRate = olderPresent / olderTotal;

  let trend: "improving" | "declining" | "stable" = "stable";
  if (Math.abs(recentRate - olderRate) > 0.1) {
    trend = recentRate > olderRate ? "improving" : "declining";
  }

  return {
    daily,
    summary: {
      ...summary,
      rate,
      absentRate,
    },
    trend,
  };
}

/**
 * Get grade distribution for histogram visualization
 * Returns count of grades in each 0.5 point range
 */
export function getGradeDistribution(grades: Grade[]): Array<{ range: string; count: number; color: string }> {
  const distribution: Record<string, number> = {};
  const colors: Record<string, string> = {
    "1.0-1.5": "#ff4444",   // red - very low
    "1.5-2.0": "#ff8800",   // orange
    "2.0-2.5": "#ffbb33",   // light orange
    "2.5-3.0": "#ffff00",   // yellow
    "3.0-3.5": "#b2ff44",   // light green
    "3.5-4.0": "#88ff44",   // green
    "4.0-4.5": "#44ff44",   // dark green
    "4.5-5.0": "#44ccff",   // light blue
    "5.0-5.5": "#4488ff",   // blue
    "5.5-6.0": "#8844ff",   // purple
  };

  for (const grade of grades) {
    const value = parseGradeValue(grade.numericValue ?? grade.value);
    if (!Number.isFinite(value)) continue;

    const rangeEnd = Math.ceil(value * 2) / 2;
    const rangeStart = rangeEnd - 0.5;
    const range = `${rangeStart.toFixed(1)}-${rangeEnd.toFixed(1)}`;

    distribution[range] = (distribution[range] ?? 0) + 1;
  }

  return Object.entries(colors).map(([range, color]) => ({
    range,
    count: distribution[range] ?? 0,
    color,
  }));
}

/**
 * Calculate missing data coverage
 * Returns percentage of expected data that is present
 */
export function calculateDataCoverage(
  present: number,
  expected: number,
  expectedType: "days" | "grades" | "lessons"
): { percentage: number; missingCount: number; coverageLevel: "high" | "medium" | "low" } {
  if (expected === 0) {
    return { percentage: 100, missingCount: 0, coverageLevel: "high" };
  }

  const percentage = Math.round((present / expected) * 100);
  const missingCount = expected - present;

  let coverageLevel: "high" | "medium" | "low" = "medium";
  if (percentage >= 80) coverageLevel = "high";
  else if (percentage <= 40) coverageLevel = "low";

  return { percentage, missingCount, coverageLevel };
}