import { cookies } from "next/headers";
import { fetchVulcanData, getSession } from "@/services/vulcan";

export const dynamic = "force-dynamic";

/**
 * GET /api/vulcan/data
 * Legacy endpoint kept for backwards compatibility. The dashboard no
 * longer needs a Vulcan data dump - the calendar and grades pages have
 * their own dedicated endpoints. This is a no-op that just validates
 * the session cookie.
 */
export async function GET() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("vulcan_token");

  if (!tokenCookie?.value) {
    return Response.json(
      { success: false, error: "Brak tokena sesji. Zaloguj się ponownie." },
      { status: 401 }
    );
  }

  const session = getSession(tokenCookie.value);
  if (!session || !session.account) {
    return Response.json(
      {
        success: false,
        error:
          "Sesja wygasła (serwer został zrestartowany). Zaloguj się ponownie.",
      },
      { status: 401 }
    );
  }

  try {
    const data = await fetchVulcanData(tokenCookie.value);
    return Response.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return Response.json(
      { success: false, error: `Nie udało się pobrać danych: ${message}` },
      { status: 500 }
    );
  }
}
