import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistant";
import { VulcanSessionProvider } from "@/src/components/VulcanSessionProvider";
import { resolveInitialSession } from "@/services/vulcan-session";
import { getMobileSession } from "@/services/eduvulcan-mobile";
import { EDUVULCAN_SESSION_COOKIE } from "@/services/eduvulcan-api";
import type { VulcanAccount } from "@/services/vulcan-session";

export const metadata: Metadata = {
  title: "Kandex — Twój asystent nauki",
  description: "Kandex — Twój spokojny workspace do nauki i danych szkolnych.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const initial = resolveInitialSession({
    tokenCookie: cookieStore.get("vulcan_token")?.value,
  });

  // EduVULCAN and the legacy Vulcan integration use separate session cookies.
  // Resolve the EduVULCAN session on the server so its pages share the same
  // authenticated shell without exposing the httpOnly cookie to the browser.
  let eduAccount: VulcanAccount | null = null;
  const eduSessionId = cookieStore.get(EDUVULCAN_SESSION_COOKIE)?.value;
  if (eduSessionId) {
    try {
      const session = await getMobileSession(eduSessionId);
      if (session) eduAccount = session.account;
    } catch {
      // The pages themselves will show a useful synchronization error if the
      // backing session store is temporarily unavailable.
    }
  }

  const account = eduAccount ?? initial.account;
  const loggedIn = Boolean(eduAccount || initial.loggedIn);

  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full">
        <VulcanSessionProvider initialLoggedIn={loggedIn} initialAccount={account}>
          {loggedIn ? (
            <div className="app-shell flex min-h-screen">
              <Sidebar />
              <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
                <div className="mx-auto max-w-[1600px]">{children}</div>
              </main>
              <aside className="hidden w-[340px] shrink-0 border-l border-[var(--border)] bg-[#f7f5f0] p-5 2xl:flex 2xl:flex-col">
                <AIAssistant />
              </aside>
            </div>
          ) : (
            children
          )}
        </VulcanSessionProvider>
      </body>
    </html>
  );
}
