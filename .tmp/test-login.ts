import { loginWithCredentials } from "../src/integrations/eduvulcan/credentials";

async function main() {
  const username = process.env.EDUVULCAN_TEST_USER ?? "";
  const password = process.env.EDUVULCAN_TEST_PASS ?? "";

  if (!username || !password) {
    console.log(JSON.stringify({ success: false, error: "Missing env credentials" }));
    process.exit(1);
  }

  const result = await loginWithCredentials({ username, password });

  console.log(
    JSON.stringify(
      {
        success: result.success,
        hasSessionId: Boolean(result.sessionId),
        accountName: result.account?.fullName ?? null,
        studentId: result.account?.studentId ?? null,
        errorCodeHint: result.error
          ? /captcha/i.test(result.error)
            ? "CAPTCHA"
            : /hasło|login|credentials/i.test(result.error)
              ? "CREDENTIALS_OR_MESSAGE"
              : /api\/ap|mobil/i.test(result.error)
                ? "MOBILE_API"
                : /zgód|consent/i.test(result.error)
                  ? "CONSENT"
                  : "OTHER"
          : null,
        errorPreview: result.error ? result.error.slice(0, 300) : null,
      },
      null,
      2,
    ),
  );

  process.exit(result.success ? 0 : 2);
}

main().catch((error) => {
  console.log(
    JSON.stringify({
      success: false,
      errorType: error instanceof Error ? error.name : "UnknownError",
      errorPreview: error instanceof Error ? error.message.slice(0, 300) : "unknown",
    }),
  );
  process.exit(1);
});
