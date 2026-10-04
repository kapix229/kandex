"use client";

import Link from "next/link";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import CalendarMini from "@/src/components/CalendarMini";

export default function DashboardClient() {
  const { account } = useVulcanSession();
  const firstName = account?.fullName?.split(" ")[0] || "Uczniu";

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-indigo-600">Twój panel nauki</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Cześć, {firstName} 👋</h1>
          <p className="mt-2 text-sm text-slate-500">Wszystko, co ważne w szkole, w jednym miejscu.</p>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${account ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
          <span className={`h-2 w-2 rounded-full ${account ? "bg-emerald-500" : "bg-slate-300"}`} />
          {account ? "Vulcan połączony" : "Vulcan niepołączony"}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["📅", "Najbliższe wydarzenia", "Sprawdź swój plan", "/calendar"],
          ["📊", "Twoje oceny", "Zobacz średnie i szczegóły", "/subjects"],
          ["✨", "Asystent AI", "Zapytaj o dowolny temat", "#ai"],
        ].map(([icon, title, text, href]) => (
          <Link key={title} href={href} className="glass-card group rounded-3xl p-5 transition-transform hover:-translate-y-1">
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-xl">{icon}</span>
            <h2 className="font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
            <span className="mt-4 inline-block text-xs font-bold text-indigo-600">Otwórz →</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <section className="glass-card rounded-3xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan</p><h2 className="mt-1 text-xl font-extrabold text-slate-950">Twój kalendarz</h2></div>
            <Link href="/calendar" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">Pełny widok</Link>
          </div>
          <CalendarMini />
        </section>
        <section className="glass-card rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-950">Kandex</h2>
          <div className="mt-6 space-y-3">
            {[
              ["Dziennik", account ? "Połączony" : "Oczekuje", !!account],
              ["Import danych", "Automatyczny", false],
              ["Asystent", "Gotowy", true],
            ].map(([label, value, ok]) => (
              <div key={label as string} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">{label}</span>
                <span className={`text-xs font-bold ${ok ? "text-emerald-600" : "text-slate-500"}`}>{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
