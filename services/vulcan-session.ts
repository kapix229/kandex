// Server-side helpers for resolving the initial Vulcan session
// from the httpOnly cookie. Kept separate from `services/vulcan.ts`
// so the layout (a server component) can import it without dragging
// in browser-only dependencies.

import { getSession } from "@/services/vulcan";

export type VulcanAccount = {
  fullName: string;
  studentId?: number;
};

export type InitialVulcanSession = {
  loggedIn: boolean;
  account: VulcanAccount | null;
};

/**
 * Look up the in-memory session by the cookie value. The cookie holds
 * a random session id; the actual Keystore/Account/Student data lives
 * in the server-side `sessions` map populated during the login flow.
 *
 * If the cookie is present but the session has expired (e.g. the server
 * restarted and lost its in-memory cache) we still return
 * `loggedIn: true` only when we can derive a non-empty account - the
 * UI will then know to call /api/vulcan/login DELETE to clear the stale
 * cookie.
 */
export function resolveInitialSession(opts: {
  tokenCookie?: string;
  userAgent?: string | null;
}): InitialVulcanSession {
  const token = opts.tokenCookie;
  if (!token) return { loggedIn: false, account: null };

  const session = getSession(token);
  void opts.userAgent; // currently unused; reserved for future device-aware UI

  if (!session || !session.account) {
    return { loggedIn: false, account: null };
  }

  // Pull the student name (and id) if step 3 was completed.
  const pupil = session.student?.pupil;
  const fullName = pupil
    ? `${pupil.firstName ?? ""} ${pupil.surname ?? ""}`.trim() ||
      session.account.userName ||
      session.account.userLogin
    : session.account.userName || session.account.userLogin;

  return {
    loggedIn: true,
    account: {
      fullName: fullName || "Użytkownik Vulcan",
      studentId: pupil ? Number(pupil.id) : undefined,
    },
  };
}
