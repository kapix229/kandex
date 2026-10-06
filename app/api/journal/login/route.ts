import { getJournalAdapter } from "@/src/integrations";
import type { JournalProvider } from "@/src/types/journal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: JournalProvider;
      username?: unknown;
      password?: unknown;
    };

    const provider = body.provider ?? "eduvulcan";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return Response.json({ success: false, error: "Podaj login i hasło." }, { status: 400 });
    }

    const result = await getJournalAdapter(provider).login({ username, password });

    if (!result.success || !result.sessionId) {
      return Response.json(result, { status: result.success ? 200 : 401 });
    }

    const response = Response.json(result, { status: 200 });
    response.headers.append(
      "Set-Cookie",
      `eduvulcan_mobile_session=${encodeURIComponent(result.sessionId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
    return response;
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Logowanie nie powiodło się." },
      { status: 500 },
    );
  }
}
