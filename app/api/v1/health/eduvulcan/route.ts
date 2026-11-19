import { NextResponse } from "next/server";
import type { APIResponse, HealthResponse } from "@/src/types/shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSecurityHeaders() {
  const headers = new Headers();
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  headers.set("X-Request-Id", crypto.randomUUID());
  return headers;
}

const HEALTH_CHECK_TIMEOUT_MS = 5000;

export async function GET() {
  const headers = getSecurityHeaders();
  const startTime = Date.now();

  try {
    // Quick connectivity check - try to resolve a session or hit the API
    // without doing a full data fetch
    const healthStatus: HealthResponse = {
      status: "healthy",
      latency: 0,
      available: true,
    };

    // Attempt to resolve session cookie to validate connection
    const sessionCookie = headers.get("Cookie")?.match(/eduvulcan_mobile_session=([^;]+)/)?.[1];

    if (sessionCookie) {
      // Check if we can decode the session
      try {
        const { getMobileSession } = await import("@/services/eduvulcan-mobile");
        const session = await getMobileSession(sessionCookie);
        healthStatus.available = session !== null;
      } catch {
        healthStatus.available = false;
        healthStatus.status = "degraded";
      }
    }

    const latency = Date.now() - startTime;
    healthStatus.latency = latency;

    const response: APIResponse<HealthResponse> = {
      success: true,
      data: healthStatus,
    };
    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("[api/v1/health/eduvulcan] health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    const response: APIResponse<never> = {
      success: false,
      error: {
        code: "EDUVULCAN_UNAVAILABLE",
        message: "Serwer EduVULCAN jest niedostępny.",
      },
    };
    return NextResponse.json(response, { status: 502, headers });
  }
}