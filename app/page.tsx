"use client";

import Link from "next/link";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import CalendarMini from "@/src/components/CalendarMini";

const quickLinks = [
  { icon: "▣", title: "Najbliższe wydarzenia", text: "Sprawdź swój plan", href: "/calendar" },
  { icon: "▥", title: "Twoje oceny", text: "Zobacz średnie i szczegóły", href: "/subjects" },
  { icon: "✦", title: "Asystent AI", text: "Zapytaj o dowolny temat", href: "#ai" },
];

export default function DashboardClient() {
  const { account } = useVulcanSession();
  const firstName = account?.fullName?.split(" ")[0] || "Uczniu";

  const statuses = [
    ["Zeskanuj dziennik", account ? "Pomyślny" : "Oczekuje", account],
    ["Dostosuj oceny", "Konfiguracja...", false],
    ["Import danych", "Automatyczny", true],
    ["Asystent", "Gotowy", true],
  ] as const;

  return (
    <div className="animate-fade-in space-y-7">
      <header>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Kandex Student Workspace</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">Cześć, {firstName} 👋</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">Twoje konto do nauki. Wszystko, co ważne w szkole, w jednym miejscu.</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-3">
            {quickLinks.map((item) => (
              <Link key={item.title} href={item.href} className="workspace-card group rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(52,55,48,0.10)]">
                <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-[var(--surface-muted)] text-lg font-bold text-[var(--accent)]">{item.icon}</span>
                <h2 className="font-bold text-[var(--text)]">{item.title}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{item.text}</p>
                <span className="mt-4 inline-block text-xs font-bold text-[var(--accent)]">Otwórz →</span>
              </Link>
            ))}
          </section>

          <section className="workspace-card rounded-2xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Plan</p>
                <h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">PLAN Twojego tygodnia</h2>
              </div>
              <Link href="/calendar" className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold text-[var(--text)] transition hover:bg-white">Pełny widok</Link>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:p-5">
              <h3 className="text-base font-bold text-[var(--text)]">📅 Tygodniowy kalendarz wydarzeń</h3>
              <div className="mt-4">
                <CalendarMini />
              </div>
            </div>
          </section>
        </div>

        <aside className="workspace-card h-fit rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Dziennik</p>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--text)]">EduVULCAN</h2>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${account ? "bg-[var(--success)]" : "bg-slate-300"}`} />
          </div>
          <p className="mt-2 text-xs font-semibold text-[var(--text-muted)]">{account ? "Połączony" : "Niepołączony"}</p>
          <div className="my-5 h-px bg-[var(--border)]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">STATUS Kandex</p>
          <div className="mt-4 space-y-2">
            {statuses.map(([label, value, ok]) => (
              <div key={label} className="rounded-xl bg-[var(--surface-muted)] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[var(--text)]">{label}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`} />
                </div>
                <p className={`mt-1 text-[11px] font-semibold ${ok ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>{value}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
