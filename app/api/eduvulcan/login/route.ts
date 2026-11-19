import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  loginWithCredentials,
  completeEduVulcanCaptchaLogin,
} from "@/src/integrations/eduvulcan/credentials";
import type { APIResponse, Student, ErrorCode } from "@/src/types/shared";
import { EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";
import { deleteMobileSession } from "@/services/eduvulcan-mobile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOGIN_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_LOGIN_ATTEMPTS = 5;
const loginIpMap = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginIpMap.get(ip);
  if (!record || now > record.resetAt) {
    loginIpMap.set(ip, { count: 1, resetAt: now + LOGIN_RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  record.count += 1;
  return true;
}

function getSecurityHeaders() {
  const headers = new Headers();
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  return headers;
}

function mapLoginError(message: string) {
  const normalized = message.toLowerCase();
  if (/captcha/.test(normalized)) return { code: "CAPTCHA_FAILED" as const, message: "Weryfikacja CAPTCHA nie powiodła się. Spróbuj ponownie." };
  if (/hasło|login|credentials|uwierzyteln|nieprawidłow/.test(normalized)) return { code: "INVALID_CREDENTIALS" as const, message: "Nieprawidłowy login lub hasło EduVULCAN." };
  if (/mobilnego api|mobile api|rest api/.test(normalized)) return { code: "MOBILE_API_UNAVAILABLE" as const, message: "Mobilne API EduVULCAN jest obecnie niedostępne." };
  if (/niedostęp|unavailable|timeout|fetch_failed|nie mógł połączyć/.test(normalized)) return { code: "EDUVULCAN_UNAVAILABLE" as const, message: "Serwer EduVULCAN jest niedostępny lub wystąpił problem z połączeniem." };
  return { code: "LOGIN_FAILED" as const, message: message || "Logowanie EduVULCAN nie powiodło się." };
}

function successResponse(result: { sessionId?: string; account?: { fullName: string; studentId?: number } }) {
  const headers = getSecurityHeaders();
  const data: APIResponse<Student> = {
    success: true,
    data: {
      id: String(result.account?.studentId ?? ""),
      name: result.account?.fullName?.split(" ")[0] ?? "",
      surname: result.account?.fullName?.split(" ").slice(1).join(" ") ?? "",
      class: "",
      school: "",
    },
  };
  const response = NextResponse.json({ ...data, account: result.account }, { headers });
  if (result.sessionId) {
    response.cookies.set(EDUVULCAN_SESSION_COOKIE, result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_USE_HTTPS === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }
  return response;
}

export async function DELETE() {
  const headers = getSecurityHeaders();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value;
  if (sessionId) {
    try {
      await deleteMobileSession(sessionId);
    } catch (error) {
      console.error("[eduvulcan-logout] session cleanup failed", {
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  const response = NextResponse.json({ success: true }, { headers });
  response.cookies.set(EDUVULCAN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_USE_HTTPS === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("vulcan_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_USE_HTTPS === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST(req: Request) {
  const headers = getSecurityHeaders();
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  if (!checkLoginRateLimit(clientIp)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Zbyt wiele prób logowania. Odczekaj chwilę przed kolejną próbą.",
        },
      },
      { status: 429, headers },
    );
  }

  try {
    let body: {
      action?: unknown;
      username?: unknown;
      password?: unknown;
      loginId?: unknown;
      captchaResponse?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Nieprawidłowy format żądania JSON." } },
        { status: 400, headers },
      );
    }

    if (body.action === "complete") {
      if (typeof body.loginId !== "string" || typeof body.captchaResponse !== "string" || !body.loginId.trim() || !body.captchaResponse.trim()) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_REQUEST", message: "Brak lub nieprawidłowe dane CAPTCHA." } },
          { status: 400, headers },
        );
      }

      const login = await completeEduVulcanCaptchaLogin(body.loginId.trim(), body.captchaResponse.trim());
      if (!login.success || !login.sessionId) {
        const error = mapLoginError(login.error ?? "Logowanie EduVULCAN nie powiodło się.");
        const status = error.code === "INVALID_CREDENTIALS" ? 401 : 502;
        console.warn("[eduvulcan-login] CAPTCHA completion failed", { code: error.code, status });
        return NextResponse.json({ success: false, error }, { status, headers });
      }
      return successResponse(login);
    }

    if (typeof body.username !== "string" || !body.username.trim() || body.username.length > 256) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Pole username jest wymagane i musi być prawidłowate." } },
        { status: 400, headers },
      );
    }
    if (typeof body.password !== "string" || !body.password || body.password.length > 512) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Pole password jest wymagane." } },
        { status: 400, headers },
      );
    }

    const username = body.username.trim();
    const password = body.password;

    // Basic sanitization check against script injection
    if (/</.test(username) || />/.test(username)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Login zawiera niedozwolone znaki." } },
        { status: 400, headers },
      );
    }

    const result = await loginWithCredentials(
      { username, password },
      {
        userAgent: req.headers.get("user-agent") ?? undefined,
        acceptLanguage: req.headers.get("accept-language") ?? undefined,
      },
    );

    if (!result.success || !result.sessionId) {
      const error = mapLoginError(result.error ?? "Logowanie EduVULCAN nie powiodło się.");
      const status = error.code === "INVALID_CREDENTIALS" ? 401 : 502;
      console.warn("[eduvulcan-login] credentials login failed", { code: error.code, status });
      return NextResponse.json({ success: false, error }, { status, headers });
    }

    return successResponse(result);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const safeMessage = /^(Magazyn sesji Supabase zwrócił HTTP \d+\. Sprawdź konfigurację klucza i tabeli\.|Brak konfiguracji Supabase\..*|Brak konfiguracji Supabase dla unieważnienia sesji\.)$/.test(rawMessage)
      ? rawMessage
      : "Wewnętrzny błąd podczas logowania. Sprawdź konfigurację serwera.";

    console.error("[eduvulcan-login] unexpected server error", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { success: false, error: { code: "LOGIN_FAILED", message: safeMessage } },
      { status: 500, headers },
    );
  }
}
