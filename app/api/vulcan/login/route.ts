import { cookies } from "next/headers";
import {
  loginStep1,
  loginStep2,
  loginStep3,
  deleteSession,
  createSession,
  getSession,
  setSession,
} from "@/services/vulcan";

export const dynamic = "force-dynamic";

/**
 * POST /api/vulcan/login
 * Three-step login flow matching the real eduVULCAN UONET+ protocol.
 *
 * Body shapes:
 *   Step 1: { securityToken, schoolSymbol }
 *   Step 2: { pendingToken, pin }      - register device with the PIN
 *   Step 3: { pendingToken, studentId } - parent accounts only, pick a student
 *
 * The PIN is sent by Vulcan to the phone number linked to the account
 * during step 1. `securityToken` is the token shown by eduVULCAN for
 * mobile access; `schoolSymbol` is the unit symbol used in the REST path.
 *
 * On final success, the session id is stored in an httpOnly cookie
 * (`vulcan_token`) so subsequent requests can use it without exposing
 * it to client JS.
 */
export async function POST(request: Request) {
  let body: {
    securityToken?: unknown;
    schoolSymbol?: unknown;
    schoolToken?: unknown;
    pendingToken?: unknown;
    pin?: unknown;
    studentId?: unknown;
    email?: unknown;
    password?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Nieprawidłowy JSON w body." },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";
  const pendingToken = typeof body.pendingToken === "string" ? body.pendingToken : undefined;
  const studentIdRaw = body.studentId;
  const studentId = typeof studentIdRaw === "string" || typeof studentIdRaw === "number"
    ? Number(studentIdRaw)
    : NaN;

  if (email && password) {
    return Response.json(
      {
        success: false,
        error: "Automatyczny import HTML jest jedyną aktywną ścieżką w tej wersji. Logowanie mail/hasło nie jest aktywne, a dane dziennika ładowane są z eksportu HTML.",
      },
      { status: 403 }
    );
  }

  if (body.pendingToken && typeof body.pendingToken === "string" && !body.pin) {
    // fallback for old multi-step student selection flow; kept for compatibility
    const result = await loginStep3(body.pendingToken, Number(studentId) || 0);
    if (result.success && result.token) {
      await persistSession(result.token);
      return Response.json({ success: true, account: result.account });
    }
    return Response.json(
      { success: false, error: result.error ?? "Nie udało się wybrać ucznia." },
      { status: 401 }
    );
  }

  const securityTokenRaw = body.securityToken ?? body.schoolToken;
  const securityToken = typeof securityTokenRaw === "string" ? securityTokenRaw.trim() : "";
  const schoolSymbol = typeof body.schoolSymbol === "string" ? body.schoolSymbol.trim() : "";

  if (!securityToken || !schoolSymbol) {
    return Response.json(
      {
        success: false,
        error: "Użyj loginu i hasła lub podaj poprawne dane logowania do dziennika.",
      },
      { status: 400 }
    );
  }

  const step1 = await loginStep1(securityToken, schoolSymbol);
  if (step1.success && step1.pendingToken) {
    return Response.json({
      success: true,
      pendingToken: step1.pendingToken,
    });
  }

  return Response.json(
    { success: false, error: step1.error ?? "Logowanie nie powiodło się." },
    { status: 401 }
  );
}

/**
 * DELETE /api/vulcan/login
 * Clears the stored session cookie and removes the in-memory session.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("vulcan_token");
  if (tokenCookie?.value) {
    deleteSession(tokenCookie.value);
  }
  cookieStore.delete("vulcan_token");

  return Response.json({ success: true });
}

async function persistSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("vulcan_token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}
