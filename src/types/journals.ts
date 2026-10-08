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

export interface Student {
  id: string;
  name: string;
  surname: string;
  class: string;
  school: string;
}

export interface Grade {
  id: string;
  subjectId: string;
  subjectName: string;
  value: string;
  type: string;
  date: string;
  weight: number;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface AttendanceEntry {
  date: string;
  lesson: number;
  subject: string;
  status: "present" | "absent" | "late" | "excused" | "unknown";
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

export interface Subject {
  id: string;
  name: string;
  teacher: string;
}
