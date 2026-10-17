const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36";
const BASE = "https://eduvulcan.pl";
const username = process.env.EDUVULCAN_TEST_USER ?? "";

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
const csrf = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)?.[1] ?? "";

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
  body: new URLSearchParams({
    UserName: username,
    __RequestVerificationToken: csrf,
  }).toString(),
  redirect: "manual",
});

const json = await response.json();
console.log(
  JSON.stringify(
    {
      usernameLen: username.length,
      status: response.status,
      success: json.success,
      data: json.data,
    },
    null,
    2,
  ),
);
