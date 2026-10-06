import { cookies } from "next/headers";
import { fetchMobileSnapshot } from "@/services/eduvulcan-mobile";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const sessionId = (await cookies()).get("eduvulcan_mobile_session")?.value;
    if (!sessionId) return Response.json({ success: false, error: "Brak aktywnej sesji mobilnego API." }, { status: 401 });
    const snapshot = await fetchMobileSnapshot(sessionId);
    return Response.json({ success: true, snapshot });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Import danych nie powiódł się." }, { status: 502 });
  }
}