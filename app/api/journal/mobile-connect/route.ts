import { cookies } from "next/headers";
import { connectWithMobileJwt } from "@/services/eduvulcan-mobile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { jwtToken?: unknown };
    const jwtToken = typeof body.jwtToken === "string" ? body.jwtToken.trim() : "";
    if (!jwtToken) return Response.json({ success: false, error: "Podaj token JWT z mobilnego API." }, { status: 400 });

    const session = await connectWithMobileJwt(jwtToken);
    const cookieStore = await cookies();
    cookieStore.set("eduvulcan_mobile_session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return Response.json({ success: true, account: session.account });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Nie udało się połączyć z mobilnym API." }, { status: 502 });
  }
}