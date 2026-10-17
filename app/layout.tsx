import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistant";
import AIMobileLauncher from "@/components/AIMobileLauncher";
import { VulcanSessionProvider } from "@/src/components/VulcanSessionProvider";
import { resolveInitialSession } from "@/services/vulcan-session";
import { getMobileSession } from "@/services/eduvulcan-mobile";

export const metadata: Metadata = {
  title: "Kandex — Twój asystent nauki",
  description: "Kandex — neutralna warstwa danych nad EduVULCAN i kolejnymi dziennikami.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("vulcan_token");
  const mobileSessionId = cookieStore.get("eduvulcan_mobile_session")?.value;
  let initial = resolveInitialSession({ tokenCookie: tokenCookie?.value });

  // Credential login uses the persistent EduVULCAN mobile session cookie.
  // Resolve it server-side so refreshing the page does not send the user back to onboarding.
  if (mobileSessionId) {
    try {
      const mobileSession = await getMobileSession(mobileSessionId);
      initial = mobileSession?.account?.fullName
        ? { loggedIn: true, account: mobileSession.account }
        : { loggedIn: false, account: null };
    } catch {
      initial = { loggedIn: false, account: null };
    }
  }

  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full">
        <VulcanSessionProvider initialLoggedIn={initial.loggedIn} initialAccount={initial.account}>
          {initial.loggedIn ? (
            <div className="app-shell flex min-h-screen flex-col lg:flex-row">
              <Sidebar />
              <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
                <div className="mx-auto max-w-[1280px]">{children}</div>
              </main>
              <aside className="hidden w-[360px] shrink-0 border-l border-[var(--border)] bg-[var(--surface)]/75 p-4 backdrop-blur-xl xl:flex xl:flex-col">
                <AIAssistant />
              </aside>
              <AIMobileLauncher />
            </div>
          ) : (
            children
          )}
        </VulcanSessionProvider>
      </body>
    </html>
  );
}