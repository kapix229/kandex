import { NextResponse } from "next/server";
import { loginWithCredentials } from "@/src/integrations/eduvulcan/credentials";
import type { APIResponse, Student } from "@/src/types/journals";
import { EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";

function mapLoginError(message: string) {
  const normalized = message.toLowerCase();

  if (/captcha/.test(normalized)) {
    return { code: "CAPTCHA_FAILED" as const, message };
  }
  if (/hasło|login|credentials|uwierzyteln/.test(normalized)) {
    return { code: "INVALID_CREDENTIALS" as const, message };
  }
  if (/mobilnego api|mobile api|rest api/.test(normalized)) {
    return { code: "MOBILE_API_UNAVAILABLE" as const, message };
  }
  if (/niedostęp|unavailable|timeout/.test(normalized)) {
    return { code: "EDUVULCAN_UNAVAILABLE" as const, message };
  }

  return { code: "LOGIN_FAILED" as const, message };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: unknown; password?: unknown };

    if (typeof body.username !== "string" || !body.username.trim()) {
      const response: APIResponse<null> = {
        success: false,
        error: { code: "INVALID_REQUEST", message: "Pole username jest wymagane." },
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (typeof body.password !== "string" || !body.password) {
      const response: APIResponse<null> = {
        success: false,
        error: { code: "INVALID_REQUEST", message: "Pole password jest wymagane." },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await loginWithCredentials({
      username: body.username.trim(),
      password: body.password,
    });

    if (!result.success || !result.sessionId) {
      const error = mapLoginError(result.error ?? "Logowanie EduVULCAN nie powiodło się.");
      return NextResponse.json(
        { success: false, error },
        { status: error.code === "INVALID_CREDENTIALS" ? 401 : 502 },
      );
    }

    const response: APIResponse<Student> = {
      success: true,
      data: {
        id: String(result.account?.studentId ?? ""),
        name: result.account?.fullName?.split(" ")[0] ?? "",
        surname: result.account?.fullName?.split(" ").slice(1).join(" ") ?? "",
        class: "",
        school: "",
      },
    };

    const nextResponse = NextResponse.json(response, { status: 200 });
    nextResponse.cookies.set(EDUVULCAN_SESSION_COOKIE, result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_REQUEST", message: "Nieprawidłowe żądanie." },
      },
      { status: 400 },
    );
  }
}
