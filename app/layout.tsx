import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistant";
import { VulcanSessionProvider } from "@/src/components/VulcanSessionProvider";
import { resolveInitialSession } from "@/services/vulcan-session";

export const metadata: Metadata = {
  title: "Kandex — Twój asystent nauki",
  description: "Nowoczesny panel ucznia z integracją z dziennikiem Vulcan",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("vulcan_token");
  const initial = resolveInitialSession({ tokenCookie: tokenCookie?.value });

  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full">
        <VulcanSessionProvider initialLoggedIn={initial.loggedIn} initialAccount={initial.account}>
          <div className="app-shell flex min-h-screen">
            <Sidebar />
            <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
              <div className="mx-auto max-w-[1500px]">{children}</div>
            </main>
            <aside className="hidden w-[360px] shrink-0 border-l border-slate-200/70 bg-white/45 p-4 xl:flex xl:flex-col">
              <AIAssistant />
            </aside>
          </div>
        </VulcanSessionProvider>
      </body>
    </html>
  );
}
