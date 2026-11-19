/**
 * Contract Registry - API Contracts (Zod Schemas)
 *
 * This file contains Zod validation schemas for all API request/response bodies.
 * These schemas provide runtime validation and can be used to generate TypeScript types.
 */

import { z } from "zod";
import {
  ErrorCode,
  Grade,
  AttendanceEntry,
  AttendanceSummary,
  Lesson,
  Subject,
  Student,
} from "./shared";

// ============================================================================
// ERROR RESPONSE SCHEMA
// ============================================================================

export const ErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "INVALID_CREDENTIALS",
  "CAPTCHA_REQUIRED",
  "CAPTCHA_FAILED",
  "LOGIN_FAILED",
  "SESSION_EXPIRED",
  "EDUVULCAN_UNAVAILABLE",
  "MOBILE_API_UNAVAILABLE",
  "RATE_LIMITED",
  "IMPORT_FAILED",
  "INTERNAL_ERROR",
]);

export const APIErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
});

export const APIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: ErrorCodeSchema,
      message: z.string(),
    }).optional(),
  });

// ============================================================================
// LOGIN REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const LoginRequestSchema = z.object({
  action: z.string().optional(),
  username: z.string().max(256).optional(),
  password: z.string().max(512).optional(),
  loginId: z.string().uuid().optional(),
  captchaResponse: z.string().optional(),
});

export const StudentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  surname: z.string(),
  class: z.string(),
  school: z.string(),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  data: StudentResponseSchema.optional(),
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
  }).optional(),
  account: z.object({
    fullName: z.string(),
    studentId: z.number().optional(),
  }).optional(),
});

// ============================================================================
// GRADE SCHEMAS
// ============================================================================

export const GradeSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  value: z.string(),
  numericValue: z.number().optional(),
  type: z.string(),
  date: z.string().datetime(),
  weight: z.number(),
});

export const GradesResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    grades: z.array(GradeSchema),
  }),
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
  }).optional(),
});

// ============================================================================
// ATTENDANCE SCHEMAS
// ============================================================================

export const AttendanceSummarySchema = z.object({
  present: z.number(),
  absent: z.number(),
  late: z.number(),
  excused: z.number(),
  unknown: z.number(),
});

export const AttendanceStatusSchema = z.enum(["present", "absent", "late", "excused", "unknown"]);

export const AttendanceEntrySchema = z.object({
  date: z.string(),
  lesson: z.number(),
  subject: z.string(),
  status: AttendanceStatusSchema,
});

export const AttendanceDataSchema = z.object({
  summary: AttendanceSummarySchema,
  entries: z.array(AttendanceEntrySchema),
});

export const AttendanceResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    entries: z.array(AttendanceEntrySchema),
    summary: AttendanceSummarySchema,
  }),
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
  }).optional(),
});

// ============================================================================
// TIMETABLE/Lesson SCHEMAS
// ============================================================================

export const LessonSchema = z.object({
  date: z.string(),
  lessonNumber: z.number(),
  start: z.string(),
  end: z.string(),
  subject: z.string(),
  teacher: z.string(),
  room: z.string(),
});

export const TimetableResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(LessonSchema),
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
  }).optional(),
});

// ============================================================================
// SUBJECT SCHEMAS
// ============================================================================

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  teacher: z.string(),
});

export const SubjectsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SubjectSchema),
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
  }).optional(),
});

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const EventTypeSchema = z.enum(["assignment", "test", "exam", "grade", "note", "event"]);
export const EventPrioritySchema = z.enum(["low", "normal", "high"]);

export const VulcanEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: EventTypeSchema,
  subject: z.string().optional(),
  date: z.date(),
  dueDate: z.date().optional(),
  completed: z.boolean(),
  priority: EventPrioritySchema,
  color: z.string().optional(),
});

// ============================================================================
// HEALTH CHECK SCHEMAS
// ============================================================================

export const HealthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    status: z.string(),
    latency: z.number(),
    available: z.boolean(),
  }),
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
  }).optional(),
});

// ============================================================================
// GRADE CALCULATION SCHEMAS
// ============================================================================

export const GradeCalculationResultSchema = z.object({
  weightedAverage: z.number(),
  simpleAverage: z.number(),
  gradeCount: z.number(),
  categoryAverages: z.record(z.string(), z.number()),
});

export type GradeCalculationResult = z.infer<typeof GradeCalculationResultSchema>;

export const AttendanceRateResultSchema = z.object({
  presentRate: z.number(),
  absenceRate: z.number(),
  lateRate: z.number(),
  excusedRate: z.number(),
  warningThresholdMet: z.boolean(),
});

export type AttendanceRateResult = z.infer<typeof AttendanceRateResultSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateGradeFilter(searchParams: URLSearchParams) {
  const subject = searchParams.get("subject");
  const subjectId = searchParams.get("subjectId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const filters: {
    subjectFilter?: string;
    subjectIdFilter?: string;
    fromFilter?: Date;
    toFilter?: Date;
  } = {};

  if (subject) {
    const parsed = subject.trim().toLowerCase();
    if (parsed) filters.subjectFilter = parsed;
  }

  if (subjectId) {
    filters.subjectIdFilter = subjectId;
  }

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      filters.fromFilter = fromDate;
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      filters.toFilter = toDate;
    }
  }

  return filters;
}

// ============================================================================
// SHARED TYPES FROM ZOD
// ============================================================================

export type LoginRequestInput = z.infer<typeof LoginRequestSchema>;
export type LoginResponseOutput = z.infer<typeof LoginResponseSchema>;
export type GradeInput = z.infer<typeof GradeSchema>;
export type GradesResponseOutput = z.infer<typeof GradesResponseSchema>;
export type AttendanceResponseOutput = z.infer<typeof AttendanceResponseSchema>;
export type TimetableResponseOutput = z.infer<typeof TimetableResponseSchema>;
export type SubjectsResponseOutput = z.infer<typeof SubjectsResponseSchema>;
export type HealthResponseOutput = z.infer<typeof HealthResponseSchema>;