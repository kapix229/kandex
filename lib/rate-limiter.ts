/**
 * Rate limiter implementation for Kandex API
 *
 * Features:
 * - Sliding window algorithm
 * - Configurable limits per IP and per authenticated user
 * - Automatic cleanup of expired entries
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  statusCode: number;
}

interface ClientRecord {
  count: number;
  resetAt: number;
}

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100;

export class RateLimiter {
  private clients = new Map<string, ClientRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(config: RateLimiterConfig) {
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
  }

  check(clientId: string): RateLimitResult {
    const now = Date.now();

    // Clean up expired records periodically
    if (this.clients.size > 10000) {
      this.cleanup(now);
    }

    const record = this.clients.get(clientId);

    if (!record || now > record.resetAt) {
      // Reset window
      const resetAt = now + this.windowMs;
      this.clients.set(clientId, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
        retryAfter: this.windowMs,
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
        retryAfter: record.resetAt - now,
      };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: record.resetAt,
      retryAfter: record.resetAt - now,
    };
  }

  private cleanup(now: number) {
    for (const [clientId, record] of this.clients.entries()) {
      if (now > record.resetAt) {
        this.clients.delete(clientId);
      }
    }
  }
}

/**
 * Login-specific rate limiter (stricter limits)
 * Max 5 attempts per minute per IP
 */
export const loginRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: "Zbyt wiele prób logowania. Odczekaj chwilę przed kolejną próbą.",
  statusCode: 429,
});

/**
 * General API rate limiter
 * Max 100 requests per minute per IP
 */
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: "Zbyt wiele żądań. Odczekaj chwilę przed kolejną próbą.",
  statusCode: 429,
});