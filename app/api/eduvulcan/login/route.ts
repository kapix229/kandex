import { NextResponse } from "next/server";
import {
  loginWithCredentials,
  completeEduVulcanCaptchaLogin,
} from "@/src/integrations/eduvulcan/credentials";
import type { APIResponse, Student } from "@/src/types/journals";
import { EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

function mapLoginError(message: string) {
  const normalized = message.toLowerCase();
  if (/captcha/.test(normalized)) return { code: "CAPTCHA_FAILED" as const, message };
  if (/hasło|login|credentials|uwierzyteln/.test(normalized)) return { code: "INVALID_CREDENTIALS" as const, message };
  if (/mobilnego api|mobile api|rest api/.test(normalized)) return { code: "MOBILE_API_UNAVAILABLE" as const, message };
  if (/niedostęp|unavailable|timeout/.test(normalized)) return { code: "EDUVULCAN_UNAVAILABLE" as const, message };
  return { code: "LOGIN_FAILED" as const, message };
}

function successResponse(result: { sessionId?: string; account?: { fullName: string; studentId?: number } }) {
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
  const response = NextResponse.json({ ...data, account: result.account });
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: unknown;
      username?: unknown;
      password?: unknown;
      loginId?: unknown;
      captchaResponse?: unknown;
    };

    if (body.action === "complete") {
      if (typeof body.loginId !== "string" || typeof body.captchaResponse !== "string") {
        return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Brak danych CAPTCHA." } }, { status: 400 });
      }

      const login = await completeEduVulcanCaptchaLogin(body.loginId, body.captchaResponse);
      if (!login.success || !login.sessionId) {
        const error = mapLoginError(login.error ?? "Logowanie EduVULCAN nie powiodło się.");
        const status = error.code === "INVALID_CREDENTIALS" ? 401 : 502;
        console.warn("[eduvulcan-login] CAPTCHA completion failed", {
          code: error.code,
          status,
        });
        return NextResponse.json({ success: false, error }, { status });
      }
      return successResponse(login);
    }

    if (typeof body.username !== "string" || !body.username.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Pole username jest wymagane." } }, { status: 400 });
    }
    if (typeof body.password !== "string" || !body.password) {
      return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Pole password jest wymagane." } }, { status: 400 });
    }

    const result = await loginWithCredentials(
      { username: body.username.trim(), password: body.password },
      {
        userAgent: req.headers.get("user-agent") ?? undefined,
        acceptLanguage: req.headers.get("accept-language") ?? undefined,
      },
    );
    if (!result.success || !result.sessionId) {
      const error = mapLoginError(result.error ?? "Logowanie EduVULCAN nie powiodło się.");
      const status = error.code === "INVALID_CREDENTIALS" ? 401 : 502;
      // Log only classification and status: never log credentials, cookies, CAPTCHA
      // answers, or the upstream response body.
      console.warn("[eduvulcan-login] credentials login failed", {
        code: error.code,
        status,
      });
      return NextResponse.json({ success: false, error }, { status });
    }
    return successResponse(result);
  } catch (error) {
    // Do not log error messages because upstream HTML may contain private data.
    console.error("[eduvulcan-login] unexpected server error", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: { code: "LOGIN_FAILED", message: "Wewnętrzny błąd podczas logowania. Sprawdź logi serwera." } },
      { status: 500 },
    );
  }
}
