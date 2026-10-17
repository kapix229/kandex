import { writeFileSync } from "node:fs";
import { load } from "cheerio";

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
writeFileSync(new URL("./eduvulcan-login.html", import.meta.url), html);

const page = load(html);
const csrf = page("input[name='__RequestVerificationToken']").attr("value") ?? "";
const form = page("form").first();
const inputs = form
  .find("input, button, select, textarea")
  .map((_, el) => {
    const n = page(el);
    return {
      tag: el.tagName,
      name: n.attr("name") ?? "",
      id: n.attr("id") ?? "",
      type: n.attr("type") ?? "",
      valuePresent: Boolean(n.attr("value")),
    };
  })
  .get();

const captcha = page(".captcha-wrapper").first();
console.log(
  JSON.stringify(
    {
      status: loginPage.status,
      cookieNames: cookie
        .split("; ")
        .map((c) => c.split("=")[0])
        .filter(Boolean),
      csrfPresent: Boolean(csrf),
      formAction: form.attr("action") ?? null,
      formId: form.attr("id") ?? null,
      form1Present: page("#form1").length > 0,
      btNextPresent: page("#btNext").length > 0,
      userNameIdPresent: page("#UserName").length > 0,
      passwordPresent: page("input[name='Password'], #Password").length > 0,
      inputs,
      captcha: {
        present: captcha.length > 0,
        challenge: Boolean(captcha.attr("data-challenge")),
        difficulty: captcha.attr("data-difficulty") ?? null,
        rounds: captcha.attr("data-rounds") ?? null,
      },
      validationSample: page(".validation-summary-errors, .message-snackbar-content")
        .text()
        .trim()
        .slice(0, 200),
    },
    null,
    2,
  ),
);

async function probeQuery(label, body) {
  const response = await fetch(`${BASE}/Account/QueryUserInfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
      "User-Agent": UA,
      Origin: BASE,
      Referer: `${BASE}/logowanie`,
      "X-Requested-With": "XMLHttpRequest",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body,
    redirect: "manual",
  });
  cookie = mergeCookies(cookie, response);
  const text = await response.text();
  console.log(
    JSON.stringify(
      {
        label,
        status: response.status,
        bodyPreview: text.slice(0, 400),
      },
      null,
      2,
    ),
  );
}

await probeQuery(
  "alias+csrf",
  new URLSearchParams({
    alias: "probe-nonexistent-user",
    __RequestVerificationToken: csrf,
  }).toString(),
);
await probeQuery(
  "UserName+csrf",
  new URLSearchParams({
    UserName: "probe-nonexistent-user",
    __RequestVerificationToken: csrf,
  }).toString(),
);
await probeQuery(
  "UserName-only",
  new URLSearchParams({ UserName: "probe-nonexistent-user" }).toString(),
);
