export type JournalProvider = "eduvulcan" | "librus";

export type Student = {
  id: string;
  fullName: string;
  className?: string;
  schoolName?: string;
};

export type Grade = {
  id: string;
  subject: string;
  /** Display value including +/- modifiers (np. "4+", "5-", "3.5") */
  displayValue: string;
  /** Numeric grade value (4+ = 4.25, 5- = 4.75) */
  value: number;
  date: string;
  weight: number;
  teacher?: string;
  /** Typ oceny: "praca", "sprawdzian", "kartkówka", "semestralny", "roczny" itp. */
  type?: string;
};

export type Subject = {
  id: string;
  name: string;
  average: number;
  gradeCount: number;
};

export type ScheduleItem = {
  id: string;
  subject: string;
  teacher?: string;
  room?: string;
  startsAt: string;
  endsAt?: string;
};

export type Assignment = {
  id: string;
  title: string;
  subject?: string;
  dueDate?: string;
  completed: boolean;
  priority?: "low" | "normal" | "high";
};

export type JournalSnapshot = {
  provider: JournalProvider;
  importedAt: string;
  student: Student | null;
  grades: Grade[];
  subjects: Subject[];
  schedule: ScheduleItem[];
  assignments: Assignment[];
};

export type JournalConnection = {
  provider: JournalProvider;
  connected: boolean;
  accountName?: string;
  student?: Student | null;
};

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

export interface Lesson {
  date: string;
  lessonNumber: number;
  start: string;
  end: string;
  subject: string;
  teacher: string;
  room: string;
}

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

export type ErrorCodeValue = "INVALID_REQUEST" | "INVALID_CREDENTIALS" | "CAPTCHA_REQUIRED" | "CAPTCHA_FAILED" | "LOGIN_FAILED" | "SESSION_EXPIRED" | "EDUVULCAN_UNAVAILABLE" | "MOBILE_API_UNAVAILABLE" | "RATE_LIMITED" | "IMPORT_FAILED" | "INTERNAL_ERROR";

export interface ApiError {
  code: ErrorCodeValue;
  message: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export type ErrorCode = ApiError["code"];
