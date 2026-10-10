import { cookies } from "next/headers";
import {
  loginStep1,
  loginStep2,
  loginStep3,
  deleteSession,
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
const useSecureCookies =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_USE_HTTPS === "true";

export async function POST(request: Request) {
  let body: {
    securityToken?: unknown;
    schoolSymbol?: unknown;
    schoolToken?: unknown;
    pendingToken?: unknown;
    pin?: unknown;
    studentId?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Nieprawidłowy JSON w body." },
      { status: 400 }
    );
  }

  const pendingToken =
    typeof body.pendingToken === "string" ? body.pendingToken.trim() : "";
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const studentIdRaw = body.studentId;
  const studentId =
    typeof studentIdRaw === "string" || typeof studentIdRaw === "number"
      ? Number(studentIdRaw)
      : NaN;

  // Step 3: parent account chooses a student.
  if (pendingToken && Number.isFinite(studentId) && !pin) {
    const result = await loginStep3(pendingToken, studentId);
    if (result.success && result.token) {
      await persistSession(result.token);
      return Response.json({
        success: true,
        account: result.account,
      });
    }

    return Response.json(
      {
        success: false,
        error: result.error ?? "Nie udało się wybrać ucznia.",
      },
      { status: 401 }
    );
  }

  // Step 2: register the device with the 4-digit PIN.
  if (pendingToken && pin) {
    const result = await loginStep2(pendingToken, pin);

    if (result.success && result.token) {
      await persistSession(result.token);
      return Response.json({
        success: true,
        account: result.account,
      });
    }

    if (result.requiresStudentSelection && result.pendingToken) {
      return Response.json({
        success: false,
        requiresStudentSelection: true,
        pendingToken: result.pendingToken,
        students: result.students ?? [],
      });
    }

    return Response.json(
      {
        success: false,
        error: result.error ?? "Nie udało się zakończyć logowania.",
      },
      { status: 401 }
    );
  }

  // Step 1: validate the mobile-access security token and school symbol.
  const securityTokenRaw = body.securityToken ?? body.schoolToken;
  const securityToken =
    typeof securityTokenRaw === "string" ? securityTokenRaw.trim() : "";
  const schoolSymbol =
    typeof body.schoolSymbol === "string" ? body.schoolSymbol.trim() : "";

  if (!securityToken || !schoolSymbol) {
    return Response.json(
      {
        success: false,
        error:
          "Podaj token bezpieczeństwa oraz symbol szkoły z sekcji „Dostęp mobilny” w dzienniku.",
      },
      { status: 400 }
    );
  }

  const step1 = await loginStep1(securityToken, schoolSymbol);
  if (step1.success && step1.pendingToken) {
    return Response.json({
      success: true,
      pendingToken: step1.pendingToken,
      nextStep: "pin",
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
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}
