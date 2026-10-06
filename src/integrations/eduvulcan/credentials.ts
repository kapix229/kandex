import { createHash } from "node:crypto";
import { load } from "cheerio";
import type { JournalCredentials, JournalConnectionResult } from "@/src/integrations/types";
import { connectWithMobileApiAp } from "@/services/eduvulcan-mobile";

const EDUVULCAN_BASE = "https://eduvulcan.pl";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36";

function getSetCookies(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();

  const combined = response.headers.get("set-cookie");
  return combined ? [combined] : [];
}

function mergeCookies(current: string, response: Response): string {
  const jar = new Map<string, string>();

  for (const cookie of current.split(";")) {
    const [name, ...value] = cookie.trim().split("=");
    if (name) jar.set(name, value.join("="));
  }

  for (const cookie of getSetCookies(response)) {
    const pair = cookie.split(";", 1)[0];
    const [name, ...value] = pair.split("=");
    if (name) jar.set(name, value.join("="));
  }

  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function solveCaptchaProofOfWork(challenge: string, difficulty: number, rounds: number): string {
  if (!challenge) throw new Error("EduVULCAN nie zwrócił wyzwania CAPTCHA.");
  if (!Number.isInteger(rounds) || rounds < 0) throw new Error("EduVULCAN zwrócił nieprawidłową liczbę rund CAPTCHA.");
  if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 0xffffffff) throw new Error("EduVULCAN zwrócił nieprawidłowy poziom trudności CAPTCHA.");
  const nonces: number[] = [];
  let prefix = Buffer.from(challenge, "ascii");
  for (let round = 0; round < rounds; round += 1) {
    let found = false;
    for (let nonce = 1; nonce <= 1_000_000_000; nonce += 1) {
      const input = Buffer.concat([prefix, Buffer.from(String(nonce), "ascii")]);
      const digest = createHash("sha256").update(input).digest();
      if (digest.readUInt32BE(0) < difficulty) { nonces.push(nonce); prefix = input; found = true; break; }
    }
    if (!found) throw new Error("Nie udało się rozwiązać wyzwania CAPTCHA EduVULCAN w limicie prób.");
  }
  return nonces.join(";");
}
async function readShowCaptcha(username: string, cookie: string) {
  const response = await fetch(`${EDUVULCAN_BASE}/Account/QueryUserInfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: new URLSearchParams({ UserName: username }),
    redirect: "manual",
  });

  if (!response.ok) {
    throw new Error(`EduVULCAN nie odpowiedział poprawnie podczas sprawdzania konta (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as {
    success?: boolean;
    data?: { ShowCaptcha?: boolean; ExtraMessage?: string | null };
  };

  if (data.success === false) {
    throw new Error(data.data?.ExtraMessage || "EduVULCAN odrzucił sprawdzenie konta.");
  }

  return {
    showCaptcha: Boolean(data.data?.ShowCaptcha),
    cookie: mergeCookies(cookie, response),
  };
}

export async function loginWithCredentials(
  credentials: JournalCredentials,
): Promise<JournalConnectionResult> {
  const username = credentials.username.trim();
  const password = credentials.password;

  if (!username || !password) {
    return { success: false, error: "Podaj login i hasło." };
  }

  try {
    let cookie = "";
    const userInfo = await readShowCaptcha(username, cookie);
    cookie = userInfo.cookie;

    const loginPage = await fetch(`${EDUVULCAN_BASE}/logowanie`, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      redirect: "manual",
    });

    cookie = mergeCookies(cookie, loginPage);
    const html = await loginPage.text();
    const csrfToken = load(html)("input[name='__RequestVerificationToken']").attr("value");

    if (!csrfToken) {
      throw new Error("Nie znaleziono tokenu CSRF na stronie logowania EduVULCAN.");
    }

    let captchaResponse = "";
    const captcha = load(html)(".captcha-wrapper").first();
    const challenge = captcha.attr("data-challenge") ?? "";
    const difficultyRaw = captcha.attr("data-difficulty") ?? "";
    const roundsRaw = captcha.attr("data-rounds") ?? "";
    const hasCaptchaChallenge = Boolean(challenge && difficultyRaw && roundsRaw);
    if (userInfo.showCaptcha || hasCaptchaChallenge) {
      const difficulty = Number(difficultyRaw);
      const rounds = Number(roundsRaw);
      captchaResponse = solveCaptchaProofOfWork(challenge, difficulty, rounds);
    }

    const loginResponse = await fetch(`${EDUVULCAN_BASE}/logowanie`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
        Cookie: cookie,
      },
      body: new URLSearchParams({
        UserName: username,
        Password: password,
        "captcha-response": captchaResponse,
        __RequestVerificationToken: csrfToken,
      }),
      redirect: "manual",
    });

    cookie = mergeCookies(cookie, loginResponse);
    const location = loginResponse.headers.get("location");

    if (loginResponse.status < 300 || loginResponse.status >= 400 || !location) {
      const body = await loginResponse.text();
      const botChallenge = /captcha|robot|robak/i.test(body);
      throw new Error(
        botChallenge
          ? "EduVULCAN odrzucił logowanie przez ochronę antybotową. Kandex nie omija tej ochrony."
          : "Nieprawidłowy login lub hasło EduVULCAN.",
      );
    }

    const apiApResponse = await fetch(`${EDUVULCAN_BASE}/api/ap`, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
        Cookie: cookie,
      },
      redirect: "manual",
    });

    if (apiApResponse.status < 200 || apiApResponse.status >= 300) {
      throw new Error("Logowanie się udało, ale EduVULCAN nie udostępnił danych mobilnego API.");
    }

    const apiApHtml = await apiApResponse.text();
    const apiApInput = load(apiApHtml)("input[id='ap']").attr("value");

    if (!apiApInput) {
      throw new Error("EduVULCAN nie zwrócił danych mobilnego API (/api/ap).");
    }

    const apiAp = JSON.parse(apiApInput) as {
      GivenName?: string;
      Surname?: string;
    };

    const session = await connectWithMobileApiAp(apiApHtml, {
      fullName: `${apiAp.GivenName ?? ""} ${apiAp.Surname ?? ""}`.trim(),
    });

    return {
      success: true,
      sessionId: session.id,
      account: session.account,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Logowanie EduVULCAN nie powiodło się.",
    };
  }
}
