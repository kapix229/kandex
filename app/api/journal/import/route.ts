import { cookies } from "next/headers";
import { getJournalAdapter } from "@/src/integrations";
import type { JournalProvider } from "@/src/types/journal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { provider?: JournalProvider };
    const provider = body.provider ?? "eduvulcan";
    if (!(await cookies()).get("vulcan_token")?.value) {
      return Response.json({ success: false, error: "Brak aktywnego połączenia z dziennikiem." }, { status: 401 });
    }
    const snapshot = await getJournalAdapter(provider).getSnapshot();
    return Response.json({ success: true, snapshot });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Import danych nie powiódł się." },
      { status: 500 }
    );
  }
}