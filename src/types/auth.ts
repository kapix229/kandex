/**
 * Contract Registry - Authentication Types
 *
 * This file contains all authentication-related types and contracts.
 * Auth flows are managed by the EduVULCAN agent with security oversight.
 */

import { ErrorCode } from "./shared";

// ============================================================================
// AUTH FLOW TYPES
// ============================================================================

export interface AuthSession {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  account: {
    fullName: string;
    studentId: number;
  };
  keypair?: {
    fingerprint: string;
  };
  restUrl: string;
  student: {
    PupilId: number;
    FirstName: string;
    LastName: string;
  };
}

export interface AuthError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
}

// ============================================================================
// CAPTCHA TYPES
// ============================================================================

export interface CaptchaChallenge {
  id: string;
  type: "image" | "recaptcha" | "hcaptcha";
  siteKey?: string;
  data?: string;
}

export interface CaptchaResponse {
  success: boolean;
  sessionId?: string;
  tokens?: string[];
  error?: AuthError;
}

// ============================================================================
// RATE LIMIT TYPES
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  statusCode: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

// ============================================================================
// COOKIE TYPES
// ============================================================================

export interface SessionCookieConfig {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  maxAge: number;
  domain?: string;
}

export interface CookieAuthResult {
  sessionId?: string;
  error?: { code: ErrorCode; message: string };
}

// ============================================================================
// SESSION STORE CONFIG
// ============================================================================

export interface SessionStoreConfig {
  enabled: boolean;
  type: "supabase" | "file";
  url?: string;
  key?: string;
  tableName?: string;
}

// ============================================================================
// LOGIN ATTEMPT TRACKING
// ============================================================================

export interface LoginAttempt {
  ip: string;
  timestamp: number;
  success: boolean;
  errorCode?: ErrorCode;
}

export interface LoginAttemptStats {
  attempts: number;
  successes: number;
  failures: number;
  lastAttempt: number;
  blocked: boolean;
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export interface SecurityHeaders {
  "X-Content-Type-Options": "nosniff";
  "X-Frame-Options": "DENY" | "SAMEORIGIN";
  "Referrer-Policy": "strict-origin-when-cross-origin" | "no-referrer";
  "Cache-Control": string;
  "Content-Security-Policy": string;
  "X-XSS-Protection": string;
  "Strict-Transport-Security": string;
}

// ============================================================================
// AUTH EVENTS
// ============================================================================

export type AuthEventName =
  | "auth:login:success"
  | "auth:login:failure"
  | "auth:logout"
  | "auth:session:expired"
  | "auth:rate_limited"
  | "auth:captcha:failed";

export interface AuthEventPayload {
  sessionId?: string;
  studentId?: number;
  fullName?: string;
  errorCode?: ErrorCode;
  ip?: string;
  message?: string;
}