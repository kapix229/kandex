import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistant";
import { VulcanSessionProvider } from "@/src/components/VulcanSessionProvider";
import { resolveInitialSession } from "@/services/vulcan-session";

export const metadata: Metadata = {
  title: "Kandex - Twój asystent nauki",
  description: "Dashboard ucznia z integracją z dziennikiem Vulcan",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the httpOnly session cookie on the server so the initial
  // render of every page already knows whether the user is logged in.
  // `cookies()` is async in Next.js 16, so we await it explicitly.
  // We intentionally avoid making this a dynamic route - the cookie
  // is per-request, not build-time, so this just means the layout
  // renders on demand.
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("vulcan_token");
  const headerStore = await headers();

  const initial = resolveInitialSession({
    tokenCookie: tokenCookie?.value,
    userAgent: headerStore.get("user-agent"),
  });

  return (
    <html
      lang="pl"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <VulcanSessionProvider
          initialLoggedIn={initial.loggedIn}
          initialAccount={initial.account}
        >
          <main className="flex h-screen bg-[#f5f7fb] text-zinc-800">
            <Sidebar />

            {/* Main content */}
            <section className="flex-1 p-8 overflow-auto animate-fade-in">
              {children}
            </section>

            {/* Right panel - AI Assistant */}
            <aside className="w-80 border-l border-zinc-200 animate-slide-in-right flex flex-col">
              <AIAssistant />
            </aside>
          </main>
        </VulcanSessionProvider>
      </body>
    </html>
  );
}
