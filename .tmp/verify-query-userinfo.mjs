/**
 * Verifies QueryUserInfo parameter behavior without credentials.
 * Does not attempt login or print secrets.
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36";
const BASE = "https://eduvulcan.pl";

function getSetCookies(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  const combined = response.headers.get("set-cookie");
  return combined ? [combined] : [];
}

function mergeCookies(current, response) {
  const jar = new Map();
  for (const cookie of current.split(";")) {
    const [name, ...value] = cookie.trim().split("=");
    if (name) jar.set(name, value.join("="));
  }
  for (const cookie of getSetCookies(response)) {
    const pair = cookie.split(";", 1)[0];
    const [name, ...value] = pair.split("=");
    if (name) jar.set(name, value.join("="));
  }
  return [...jar.entries()].map(([n, v]) => `${n}=${v}`).join("; ");
}

const loginPage = await fetch(`${BASE}/logowanie`, {
  headers: { Accept: "text/html", "User-Agent": UA },
  redirect: "manual",
});
let cookie = mergeCookies("", loginPage);
const html = await loginPage.text();
const csrfMatch = html.match(
  /name="__RequestVerificationToken"[^>]*value="([^"]+)"/,
);
const csrf = csrfMatch?.[1] ?? "";

async function query(body) {
  const response = await fetch(`${BASE}/Account/QueryUserInfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
      "User-Agent": UA,
      Origin: BASE,
      Referer: `${BASE}/logowanie`,
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookie,
    },
    body,
    redirect: "manual",
  });
  cookie = mergeCookies(cookie, response);
  return { status: response.status, json: await response.json() };
}

const alias = await query(
  new URLSearchParams({
    alias: "nonexistent-probe-user",
    __RequestVerificationToken: csrf,
  }).toString(),
);
const userName = await query(
  new URLSearchParams({
    UserName: "nonexistent-probe-user",
    __RequestVerificationToken: csrf,
  }).toString(),
);

function summarize(label, result) {
  const data = result.json?.data;
  const showCaptcha =
    typeof data === "object" && data !== null
      ? Boolean(data.ShowCaptcha)
      : false;
  return {
    label,
    status: result.status,
    success: result.json?.success,
    dataType: typeof data,
    showCaptcha,
  };
}

console.log(JSON.stringify([summarize("alias", alias), summarize("UserName", userName)], null, 2));
