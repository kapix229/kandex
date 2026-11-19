/**
 * Contract Registry - Shared Types
 *
 * This file contains all shared TypeScript types and interfaces that are used
 * across the EduVULCAN, Backend, Grades-Attendance, Frontend, and Security agents.
 * All types are designed to be consumed by both frontend and backend code.
 */

// ============================================================================
// ERROR CODES AND RESPONSE TYPES
// ============================================================================

export type ErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "CAPTCHA_REQUIRED"
  | "CAPTCHA_FAILED"
  | "LOGIN_FAILED"
  | "SESSION_EXPIRED"
  | "EDUVULCAN_UNAVAILABLE"
  | "MOBILE_API_UNAVAILABLE"
  | "RATE_LIMITED"
  | "IMPORT_FAILED"
  | "INTERNAL_ERROR";

export interface APIError {
  code: ErrorCode;
  message: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// ============================================================================
// STUDENT TYPES
// ============================================================================

export interface Student {
  id: string;
  name: string;
  surname: string;
  class: string;
  school: string;
}

export interface EduVulcanStudent {
  id: string;
  fullName: string;
  className?: string;
  schoolName?: string;
}

// ============================================================================
// GRADE TYPES
// ============================================================================

export interface Grade {
  id: string;
  subjectId: string;
  subjectName: string;
  /** Display value from EduVULCAN, including +/- modifiers. */
  value: string;
  /** Numeric value used for averages; + adds 0.25 and - subtracts 0.25. */
  numericValue?: number;
  type: string;
  date: string;
  weight: number;
}

export interface VulcanGrade {
  id: string;
  subject: string;
  title: string;
  value: number;
  displayValue?: string;
  weight: number;
  teacher: string;
  date: Date;
  comment?: string;
}

export interface GradeCalculationResult {
  weightedAverage: number;
  simpleAverage: number;
  gradeCount: number;
  weightedSum: number;
  totalWeight: number;
  categoryAverages: Record<string, number>;
  categoryCounts: Record<string, number>;
}

// ============================================================================
// ATTENDANCE TYPES
// ============================================================================

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  unknown: number;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "unknown";

export interface AttendanceEntry {
  date: string;
  lesson: number;
  subject: string;
  status: AttendanceStatus;
}

export interface AttendanceData {
  summary: AttendanceSummary;
  entries: AttendanceEntry[];
}

export interface AttendanceRateResult {
  presentRate: number;
  absenceRate: number;
  lateRate: number;
  excusedRate: number;
  warningThresholdMet: boolean;
  overallRate: number;
  summary: AttendanceSummary;
}

// ============================================================================
// LESSON/TIMETABLE TYPES
// ============================================================================

export interface Lesson {
  date: string;
  lessonNumber: number;
  start: string;
  end: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface ScheduleItem {
  id: string;
  subject: string;
  teacher?: string;
  room?: string;
  startsAt: string;
  endsAt?: string;
}

// ============================================================================
// SUBJECT TYPES
// ============================================================================

export interface Subject {
  id: string;
  name: string;
  teacher: string;
}

export interface SubjectGradeSummary {
  id: string;
  name: string;
  teacher: string;
  average: number;
  gradeCount: number;
  weightedAverage: number;
  weightedSum: number;
  totalWeight: number;
}

export interface SubjectGradeStats extends SubjectGradeSummary {
  subjectId: string;
  typeDistribution: Record<string, number>;
}

// ============================================================================
// EVENT/CALENDAR TYPES
// ============================================================================

export type EventType = "assignment" | "test" | "exam" | "grade" | "note" | "event";

export type EventPriority = "low" | "normal" | "high";

export interface VulcanEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  subject?: string;
  date: Date;
  dueDate?: Date;
  completed: boolean;
  priority: EventPriority;
  color?: string;
}

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: VulcanEvent[];
}

export interface MonthView {
  year: number;
  month: number;
  days: CalendarDay[];
}

// ============================================================================
// ASSIGNMENT/HOMWORK TYPES
// ============================================================================

export interface Assignment {
  id: string;
  title: string;
  subject?: string;
  dueDate?: string;
  completed: boolean;
  priority?: "low" | "normal" | "high";
}

// Simplified Event type for calendar view
export interface Event {
  id: string;
  title: string;
  subject?: string;
  date: string;
  type: string;
}

export interface MobileHomework {
  Id: string | number;
  Content?: string;
  Subject?: { Name?: string };
  Deadline?: { Timestamp?: number };
}

export interface MobileExam {
  Id: string | number;
  Content?: string;
  Type?: string;
  Subject?: { Name?: string };
  Deadline?: { Timestamp?: number; Date?: string };
  DateCreated?: { Timestamp?: number; Date?: string };
}

// ============================================================================
// MOBILE API TYPES (EduVULCAN)
// ============================================================================

export interface MobileKeypair {
  fingerprint: string;
  privateKey: string;
  certificate: string;
}

export interface MobileStudent {
  PupilId: number;
  FirstName: string;
  LastName: string;
  Pupil?: {
    ClassDisplay?: string;
    ConstituentUnit?: { Name?: string };
    Unit?: { Id?: number; Symbol?: string; Name?: string };
    Pupil?: { Id?: number };
    Periods?: Array<{ Id: number; Current?: boolean }>;
  };
}

export interface MobileGrade {
  Id: string | number;
  Value: string | number;
  ContentRaw?: string | number | null;
  Content?: string | number | null;
  Column?: {
    Subject?: { Id?: string | number; Name?: string };
    Weight?: string | number;
    Name?: string;
  };
  DateCreated?: { Timestamp?: number };
  Creator?: { DisplayName?: string };
}

export interface MobileLesson {
  Id: string | number;
  Subject?: { Name?: string };
  TeacherPrimary?: { DisplayName?: string };
  Room?: { Code?: string } | null;
  Date?: { Timestamp?: number; Date?: string };
  LessonNumber?: number;
  TimeSlot?: { Start?: string; End?: string };
}

export interface MobileAttendance {
  Id: string | number;
  LessonId?: string | number;
  Day?: { Timestamp?: number; Date?: string };
  LessonNumber?: number;
  Subject?: { Name?: string };
  PresenceType?: {
    Name?: string;
    Presence?: boolean;
    Absence?: boolean;
    Late?: boolean;
    AbsenceJustified?: boolean;
    Removed?: boolean;
  };
}

export interface ApiApPayload {
  Success?: boolean;
  Tokens?: string[];
  Alias?: string;
  GivenName?: string;
  Surname?: string;
  AccessToken?: string;
  IsConsentAccepted?: boolean;
  CanAcceptConsent?: boolean;
}

export interface MobileSession {
  id: string;
  keypair: MobileKeypair;
  restUrl: string;
  student: MobileStudent;
  account: { fullName: string; studentId?: number };
  createdAt: string;
}

// ============================================================================
// JOURNAL SNAPSHOT TYPES
// ============================================================================

export type JournalProvider = "eduvulcan" | "librus";

export interface JournalSnapshot {
  provider: JournalProvider;
  importedAt: string;
  student: EduVulcanStudent | null;
  grades: Grade[];
  subjects: SubjectGradeSummary[];
  schedule: ScheduleItem[];
  assignments: Assignment[];
}

export interface JournalConnection {
  provider: JournalProvider;
  connected: boolean;
  accountName?: string;
  student?: EduVulcanStudent | null;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface LoginRequest {
  action?: string;
  username?: string;
  password?: string;
  loginId?: string;
  captchaResponse?: string;
}

export interface LoginResult {
  success: boolean;
  sessionId?: string;
  account?: { fullName: string; studentId?: number };
  error?: string;
}

// ============================================================================
// SNAPSHOT TYPES
// ============================================================================

export interface Snapshot {
  provider: "eduvulcan" | "librus";
  importedAt: string;
  student: EduVulcanStudent | null;
  grades: Grade[];
  subjects: SubjectGradeSummary[];
  schedule: ScheduleItem[];
  assignments: Assignment[];
  exams: Array<{
    id: string;
    title: string;
    subject?: string;
    date?: string;
    type: string;
  }>;
  attendance: AttendanceEntry[];
  syncStatus: {
    grades: boolean;
    lessons: boolean;
    homework: boolean;
    exams: boolean;
    attendance: boolean;
  };
  syncErrors: Partial<Record<"grades" | "lessons" | "homework" | "exams" | "attendance", string>>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface GradesResponse {
  grades: Grade[];
}

export interface SubjectsResponse {
  subjects: Subject[];
}

export interface HealthResponse {
  status: string;
  latency: number;
  available: boolean;
}

// ============================================================================
// GRADE WEIGHTS AND CATEGORIES
// ============================================================================

export type GradeWeight = 1 | 2 | 3;

export type GradeCategory = "aktywność" | "kartkówka" | "sprawdzian" | "projekt" | "inne";

export function getGradeCategory(weight: GradeWeight): GradeCategory {
  switch (weight) {
    case 1: return "aktywność";
    case 2: return "kartkówka";
    case 3: return "sprawdzian";
    default: return "inne";
  }
}

export function parseGradeValue(raw: string | number | null | undefined): number {
  const normalized = String(raw ?? "").trim().replace(",", ".");
  const match = normalized.match(/^(\d+(?:\.\d+)?)([+-])?$/);
  if (!match) return Number.NaN;
  const base = Number(match[1]);
  return base + (match[2] === "+" ? 0.25 : match[2] === "-" ? -0.25 : 0);
}

export function formatGradeValue(raw: string | number | null | undefined): string {
  return String(raw ?? "").trim().replace(",", ".");
}