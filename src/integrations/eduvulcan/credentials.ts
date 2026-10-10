import { createHash, randomUUID } from "node:crypto";
import { load } from "cheerio";
import type { JournalCredentials, JournalConnectionResult } from "@/src/integrations/types";
import { connectWithMobileApiAp } from "@/services/eduvulcan-mobile";

const EDUVULCAN_BASE = "https://eduvulcan.pl";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36";

async function fetchEduVulcan(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  let safeTarget = "unknown-target";
  let stage = "request";
  try {
    const url = new URL(input);
    safeTarget = `${url.host}${url.pathname}`;
    if (url.pathname === "/logowanie" && init?.method === "POST") stage = "submit-login";
    else if (url.pathname === "/logowanie") stage = "load-login-page";
    else if (url.pathname === "/Account/QueryUserInfo") stage = "query-user-info";
    else if (url.pathname === "/api/ap") stage = "mobile-api-ap";
    else if (url.host === new URL(EDUVULCAN_BASE).host) stage = "follow-redirect";
  } catch {
    // Do not include raw input or request options in diagnostics.
  }
  // Loguj wyłącznie nazwę etapu i status HTTP. Nie zapisuj URL-i przekierowań,
  // nagłówków, treści odpowiedzi, cookies ani danych formularza.
  console.info("[eduvulcan-login] request", { stage, result: "pending" });
  try {
    const response = await fetch(input, init);
    console.info("[eduvulcan-login] request", {
      stage,
      result: "response",
      status: response.status,
    });
    return response;
  } catch (error) {
    const causeName =
      error instanceof Error && error.name ? error.name : "UnknownError";
    console.error("[eduvulcan-login] request", {
      stage,
      result: "failed",
      cause: causeName,
    });
    throw new Error(
      `EDUVULCAN_FETCH_FAILED stage=${stage} cause=${causeName}. Serwer Kandex nie mógł połączyć się z usługą EduVULCAN.`,
    );
  }
}

type ClientRequestHeaders = {
  userAgent?: string;
  acceptLanguage?: string;
};

function portalClientHeaders(headers: ClientRequestHeaders = {}) {
  return {
    "User-Agent": headers.userAgent || USER_AGENT,
    ...(headers.acceptLanguage ? { "Accept-Language": headers.acceptLanguage } : {}),
  };
}

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
  clientHeaders: ClientRequestHeaders = {},
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

    currentResponse = await fetchEduVulcan(nextUrl.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        ...portalClientHeaders(clientHeaders),
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
    ".message-error",
    ".messageInfo",
    ".messageSection",
    "[data-valmsg-for]",
    "#localMessage",
    "#localMessage2",
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

async function readShowCaptcha(
  username: string,
  cookie: string,
  csrfToken: string,
  clientHeaders: ClientRequestHeaders = {},
) {
  const response = await fetchEduVulcan(`${EDUVULCAN_BASE}/Account/QueryUserInfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
      ...portalClientHeaders(clientHeaders),
      Origin: EDUVULCAN_BASE,
      Referer: `${EDUVULCAN_BASE}/logowanie`,
      "X-Requested-With": "XMLHttpRequest",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: new URLSearchParams({
      alias: username,
      __RequestVerificationToken: csrfToken,
    }),
    redirect: "manual",
  });

  if (!response.ok) {
    throw new Error(`EduVULCAN nie odpowiedział poprawnie podczas sprawdzania konta (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as {
    success?: boolean;
    data?: boolean | { ShowCaptcha?: boolean; ExtraMessage?: string | null };
  };

  const showCaptcha =
    !data.success ||
    !data.data ||
    (typeof data.data === "object" &&
      data.data !== null &&
      Boolean(data.data.ShowCaptcha));

  return {
    showCaptcha,
    cookie: mergeCookies(cookie, response),
  };
}

export async function loginWithCredentials(
  credentials: JournalCredentials,
  clientHeaders: ClientRequestHeaders = {},
): Promise<JournalConnectionResult> {
  const username = credentials.username.trim();
  const password = credentials.password;

  if (!username || !password) {
    return { success: false, error: "Podaj login i hasło." };
  }

  try {
    let cookie = "";
    const loginPage = await fetchEduVulcan(`${EDUVULCAN_BASE}/logowanie`, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        ...portalClientHeaders(clientHeaders),
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

    const userInfo = await readShowCaptcha(username, cookie, csrfToken, clientHeaders);
    cookie = userInfo.cookie;

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

    if (!form.length) {
      throw new Error("Nie znaleziono formularza logowania EduVULCAN. " + describeLoginForm(html));
    }

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

    const loginResponse = await fetchEduVulcan(`${EDUVULCAN_BASE}/logowanie`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml",
        ...portalClientHeaders(clientHeaders),
        Cookie: cookie,
        Origin: EDUVULCAN_BASE,
        Referer: `${EDUVULCAN_BASE}/logowanie`,
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

    // A failed credential check can return HTTP 200 with the login form
    // rendered again instead of a redirect. Do not continue to /api/ap in
    // that case, otherwise the user gets a misleading MOBILE_API_UNAVAILABLE.
    if (!location && load(loginBody)("#form1").length > 0) {
      const validationMessages = extractValidationMessages(loginBody);
      throw new Error(
        validationMessages[0] ||
          "EduVULCAN ponownie wyświetlił formularz, ale nie zwrócił komunikatu walidacji. Serwer nie podał przyczyny odrzucenia.",
      );
    }

    const followedLogin = await followLoginRedirects(loginResponse, cookie, clientHeaders);
    cookie = followedLogin.cookie;

    let apiApResponse = await fetchEduVulcan(`${EDUVULCAN_BASE}/api/ap`, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        ...portalClientHeaders(clientHeaders),
        Referer: `${EDUVULCAN_BASE}/logowanie`,
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
      apiApRedirectChain.push(`HTTP=${apiApResponse.status} -> ${nextUrl.pathname}`);

      apiApResponse = await fetchEduVulcan(nextUrl.toString(), {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          ...portalClientHeaders(clientHeaders),
          Referer: `${EDUVULCAN_BASE}/api/ap`,
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


export type EduVulcanCaptchaStart = {
  loginId: string;
  challenge: string;
  difficulty: number;
  rounds: number;
};

type PendingEduVulcanLogin = {
  username: string;
  password: string;
  cookie: string;
  csrfToken: string;
  createdAt: number;
};

const pendingEduVulcanLogins = new Map<string, PendingEduVulcanLogin>();

export async function startEduVulcanCaptchaLogin(
  usernameInput: string,
  password: string,
): Promise<EduVulcanCaptchaStart | { captchaRequired: false }> {
  const username = usernameInput.trim();
  if (!username || !password) throw new Error("Podaj login i hasło.");

  const loginPage = await fetchEduVulcan(`${EDUVULCAN_BASE}/logowanie`, {
    headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": USER_AGENT },
    redirect: "manual",
  });
  const cookie = mergeCookies("", loginPage);
  const html = await loginPage.text();
  const page = load(html);
  const csrfToken = page("input[name='__RequestVerificationToken']").attr("value");
  if (!csrfToken) throw new Error("Nie znaleziono tokenu CSRF na stronie logowania EduVULCAN.");

  const userInfo = await readShowCaptcha(username, cookie, csrfToken);
  const captcha = page(".captcha-wrapper").first();
  const challenge = captcha.attr("data-challenge") ?? "";
  const difficulty = Number(captcha.attr("data-difficulty") ?? "");
  const rounds = Number(captcha.attr("data-rounds") ?? "");

  if (!userInfo.showCaptcha && !challenge) return { captchaRequired: false };
  if (!challenge || !Number.isInteger(difficulty) || !Number.isInteger(rounds)) {
    throw new Error("EduVULCAN wymaga CAPTCHA, ale nie udało się pobrać jej parametrów.");
  }

  const loginId = randomUUID();
  pendingEduVulcanLogins.set(loginId, {
    username, password, cookie: userInfo.cookie, csrfToken, createdAt: Date.now(),
  });

  return { loginId, challenge, difficulty, rounds };
}

export async function completeEduVulcanCaptchaLogin(
  loginId: string,
  captchaResponse: string,
): Promise<JournalConnectionResult> {
  const pending = pendingEduVulcanLogins.get(loginId);
  if (!pending) return { success: false, error: "Sesja CAPTCHA wygasła. Rozpocznij logowanie ponownie." };
  pendingEduVulcanLogins.delete(loginId);

  if (Date.now() - pending.createdAt > 5 * 60 * 1000) {
    return { success: false, error: "Sesja CAPTCHA wygasła. Rozpocznij logowanie ponownie." };
  }
  if (!/^\d+(;\d+)*$/.test(captchaResponse)) {
    return { success: false, error: "Nieprawidłowa odpowiedź CAPTCHA." };
  }

  try {
    let cookie = pending.cookie;
    const formData = new URLSearchParams({
      UserName: pending.username,
      Password: pending.password,
      "captcha-response": captchaResponse,
      __RequestVerificationToken: pending.csrfToken,
    });

    const loginResponse = await fetchEduVulcan(`${EDUVULCAN_BASE}/logowanie`, {
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
    const body = await loginResponse.text();

    if (loginResponse.status >= 400) {
      const messages = extractValidationMessages(body);
      throw new Error(messages[0] || `EduVULCAN odrzucił logowanie (HTTP ${loginResponse.status}).`);
    }
    if (!location && load(body)("#form1").length > 0) {
      const messages = extractValidationMessages(body);
      throw new Error(messages[0] || "Nieprawidłowy login, hasło lub CAPTCHA.");
    }

    const followed = await followLoginRedirects(loginResponse, cookie);
    cookie = followed.cookie;

    let ap = await fetchEduVulcan(`${EDUVULCAN_BASE}/api/ap`, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
        Referer: `${EDUVULCAN_BASE}/logowanie`,
        Cookie: cookie,
      },
      redirect: "manual",
    });

    for (let i = 0; i < 5 && ap.status >= 300 && ap.status < 400; i++) {
      const next = ap.headers.get("location");
      if (!next) break;
      cookie = mergeCookies(cookie, ap);
      ap = await fetchEduVulcan(new URL(next, EDUVULCAN_BASE).toString(), {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": USER_AGENT,
          Referer: `${EDUVULCAN_BASE}/api/ap`,
          Cookie: cookie,
        },
        redirect: "manual",
      });
    }

    const apHtml = await ap.text();
    const apInput = load(apHtml)("input[id='ap']").attr("value");
    if (!ap.ok || !apInput) {
      throw new Error(
        `Logowanie przyjęte, ale /api/ap nie zwrócił danych mobilnego API. [HTTP=${ap.status} | ap=${Boolean(apInput)}]`,
      );
    }

    const apData = JSON.parse(apInput) as { GivenName?: string; Surname?: string };
    const session = await connectWithMobileApiAp(apHtml, {
      fullName: `${apData.GivenName ?? ""} ${apData.Surname ?? ""}`.trim(),
    });

    return { success: true, sessionId: session.id, account: session.account };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Logowanie EduVULCAN nie powiodło się." };
  }
}
