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
  if (!combined) return [];

  // Older Node fetch implementations may expose multiple Set-Cookie values
  // as one comma-separated header. Do not split commas inside Expires=... .
  return combined
    .split(/,(?=\s*[^=;,\s]+=[^=;,]*(?:;|$))/)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
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


async function followLoginRedirects(
  response: Response,
  cookie: string,
): Promise<{ response: Response; cookie: string; chain: string[] }> {
  let currentResponse = response;
  let currentCookie = cookie;
  const chain: string[] = [];

  for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
    const status = currentResponse.status;
    if (status < 300 || status >= 400) {
      chain.push(`HTTP=${status}`);
      return { response: currentResponse, cookie: currentCookie, chain };
    }

    const location = currentResponse.headers.get("location");
    if (!location) {
      chain.push(`HTTP=${status} Location=false`);
      return { response: currentResponse, cookie: currentCookie, chain };
    }

    currentCookie = mergeCookies(currentCookie, currentResponse);
    const nextUrl = new URL(location, EDUVULCAN_BASE);
    chain.push(`HTTP=${status} -> ${nextUrl.pathname}`);

    currentResponse = await fetch(nextUrl.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
        Referer: `${EDUVULCAN_BASE}/logowanie`,
        ...(currentCookie ? { Cookie: currentCookie } : {}),
      },
      redirect: "manual",
    });
  }

  throw new Error(`EduVULCAN wykonał zbyt wiele przekierowań podczas logowania. [${chain.join(" | ")}]`);
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

function describeLoginForm(html: string): string {
  const page = load(html);
  const form = page("form").filter((_, el) => {
    const action = page(el).attr("action") ?? "";
    return /logowanie/i.test(action) || page(el).find("input[name='UserName'], input[name='Alias']").length > 0;
  }).first();

  if (!form.length) return "Diagnostyka formularza: nie znaleziono formularza logowania.";

  const fields = form.find("input, select, textarea").map((_, el) => {
    const node = page(el);
    return {
      name: node.attr("name") ?? "",
      type: node.attr("type") ?? el.tagName.toLowerCase(),
      required: node.is("[required]"),
      hasValue: Boolean(node.attr("value")),
    };
  }).get();

  const captcha = form.find(".captcha-wrapper").first();

  return [
    `Pola formularza: ${fields.map((field) => `${field.name || "(brak name)"}[${field.type}] required=${field.required} value=${field.hasValue}`).join(", ")}`,
    `CAPTCHA wrapper=${captcha.length > 0} challenge=${Boolean(captcha.attr("data-challenge"))} difficulty=${Boolean(captcha.attr("data-difficulty"))} rounds=${Boolean(captcha.attr("data-rounds"))}`,
  ].join(" | ");
}

function extractValidationMessages(html: string): string[] {
  const page = load(html);
  const selectors = [
    ".validation-summary-errors li",
    ".validation-summary-errors",
    ".field-validation-error",
    ".message-snackbar-content",
    "[data-valmsg-for]",
  ];

  return [...new Set(
    selectors.flatMap((selector) =>
      page(selector)
        .map((_, el) => page(el).text().replace(/\s+/g, " ").trim())
        .get()
        .filter(Boolean),
    ),
  )].slice(0, 10);
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
    data?: boolean | { ShowCaptcha?: boolean; ExtraMessage?: string | null };
  };

  if (data.success === false) {
    const extraMessage =
      typeof data.data === "object" && data.data !== null
        ? data.data.ExtraMessage
        : undefined;
    throw new Error(extraMessage || "EduVULCAN odrzucił sprawdzenie konta.");
  }

  const showCaptcha =
    typeof data.data === "boolean"
      ? data.data
      : Boolean(data.data?.ShowCaptcha);

  return {
    showCaptcha,
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
    const page = load(html);
    const csrfToken = page("input[name='__RequestVerificationToken']").attr("value");

    if (!csrfToken) {
      throw new Error("Nie znaleziono tokenu CSRF na stronie logowania EduVULCAN. " + describeLoginForm(html));
    }

    let captchaResponse = "";
    const captcha = page(".captcha-wrapper").first();
    const challenge = captcha.attr("data-challenge") ?? "";
    const difficultyRaw = captcha.attr("data-difficulty") ?? "";
    const roundsRaw = captcha.attr("data-rounds") ?? "";
    const hasCaptchaChallenge = Boolean(challenge && difficultyRaw && roundsRaw);

    if (userInfo.showCaptcha || hasCaptchaChallenge) {
      if (!hasCaptchaChallenge) {
        throw new Error(
          `EduVULCAN wymaga CAPTCHA, ale strona nie zawiera challenge. ${describeLoginForm(html)}`,
        );
      }
      const difficulty = Number(difficultyRaw);
      const rounds = Number(roundsRaw);
      captchaResponse = solveCaptchaProofOfWork(challenge, difficulty, rounds);
    }

    // Zachowujemy wszystkie pola formularza, bo aktualny EduVULCAN może
    // wymagać dodatkowych hidden inputs poza loginem, hasłem, CAPTCHA i CSRF.
    const form = page("form").filter((_, el) => {
      const action = page(el).attr("action") ?? "";
      return /logowanie/i.test(action) || page(el).find("input[name='UserName'], input[name='Alias']").length > 0;
    }).first();

    const formData = new URLSearchParams();
    form.find("input[name], select[name], textarea[name]").each((_, el) => {
      const node = page(el);
      const name = node.attr("name");
      if (!name) return;
      const type = (node.attr("type") ?? "").toLowerCase();
      if (type === "submit" || type === "button" || type === "reset" || type === "file") return;
      if ((type === "checkbox" || type === "radio") && !node.is(":checked")) return;
      formData.append(name, node.attr("value") ?? "");
    });

    formData.set("UserName", username);
    formData.set("Password", password);
    formData.set("captcha-response", captchaResponse);
    formData.set("__RequestVerificationToken", csrfToken);

    const loginResponse = await fetch(`${EDUVULCAN_BASE}/logowanie`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
        Cookie: cookie,
      },
      body: formData,
      redirect: "manual",
    });

    cookie = mergeCookies(cookie, loginResponse);
    const location = loginResponse.headers.get("location");
    const loginBody = await loginResponse.text();

    // EduVULCAN po poprawnym POST może zwrócić 302. Przeglądarka automatycznie
    // przechodzi dalej i zachowuje cookies z każdego kroku przekierowania.
    // Node fetch nie ma własnego cookie store, więc robimy to jawnie.
    if (loginResponse.status >= 400) {
      const validationMessages = extractValidationMessages(loginBody);
      throw new Error(
        `${validationMessages[0] || "EduVULCAN odrzucił żądanie logowania."} [HTTP=${loginResponse.status} | Location=${Boolean(location)} | odpowiedz=${loginBody.length} znakow]`,
      );
    }

    const followedLogin = await followLoginRedirects(loginResponse, cookie);
    cookie = followedLogin.cookie;

    let apiApResponse = await fetch(\`\${EDUVULCAN_BASE}/api/ap\`, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
        Referer: \`\${EDUVULCAN_BASE}/logowanie\`,
        Cookie: cookie,
      },
      redirect: "manual",
    });

    const apiApRedirectChain: string[] = [];
    for (let redirectCount = 0; redirectCount < 5 && apiApResponse.status >= 300 && apiApResponse.status < 400; redirectCount += 1) {
      const location = apiApResponse.headers.get("location");
      if (!location) break;

      cookie = mergeCookies(cookie, apiApResponse);
      const nextUrl = new URL(location, EDUVULCAN_BASE);
      apiApRedirectChain.push(\`HTTP=\${apiApResponse.status} -> \${nextUrl.pathname}\`);

      apiApResponse = await fetch(nextUrl.toString(), {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": USER_AGENT,
          Referer: \`\${EDUVULCAN_BASE}/api/ap\`,
          Cookie: cookie,
        },
        redirect: "manual",
      });
    }

    const apiApHtml = await apiApResponse.text();
    const apiApInput = load(apiApHtml)("input[id='ap']").attr("value");

    if (apiApResponse.status < 200 || apiApResponse.status >= 300) {
      throw new Error(
        "Logowanie się udało, ale EduVULCAN nie udostępnił danych mobilnego API. " +
        "[/api/ap HTTP=" + apiApResponse.status +
        " | Location=" + Boolean(apiApResponse.headers.get("location")) +
        " | odpowiedz=" + apiApHtml.length + " znakow | ap=" + Boolean(apiApInput) +
        " | loginRedirectChain=" + followedLogin.chain.join(" -> ") +
        " | apiRedirectChain=" + (apiApRedirectChain.join(" -> ") || "brak") + "]",
      );
    }

    if (!apiApInput) {
      throw new Error(
        "EduVULCAN nie zwrócił danych mobilnego API (/api/ap). " +
        "[HTTP=" + apiApResponse.status +
        " | Location=" + Boolean(apiApResponse.headers.get("location")) +
        " | odpowiedz=" + apiApHtml.length + " znakow | redirectChain=" + followedLogin.chain.join(" -> ") + "]",
      );
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
