"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

const navItems = [
  { href: "/", label: "Dashboard", icon: "◉" },
  { href: "/calendar", label: "Plan lekcji", icon: "▣" },
  { href: "/subjects", label: "Oceny", icon: "✓" },
  { href: "/assignments", label: "Zadania", icon: "⌁" },
  { href: "/study", label: "Nauka", icon: "✦" },
  { href: "/settings", label: "Ustawienia", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { account, signOut } = useVulcanSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/eduvulcan/login", { method: "DELETE" });
      if (!response.ok) throw new Error("Nie udało się zakończyć sesji.");
      signOut();
      router.replace("/");
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Nie udało się wylogować.");
    } finally {
      setLoggingOut(false);
    }
  }
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[#0c1120]/95 px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2 text-sm font-extrabold text-[var(--text)]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#7c5cff] to-[#00cfe8] text-white">K</span>
          Kandex
        </Link>
        <div className="flex items-center gap-2">
          <a href="/?chooseJournal=1" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--text)]">Zmień dziennik</a>
          <button type="button" onClick={handleLogout} disabled={loggingOut} className="rounded-lg border border-[#ff5c7c]/30 px-3 py-2 text-xs font-bold text-[#ff9eae] disabled:opacity-60">
            {loggingOut ? "..." : "Wyloguj"}
          </button>
        </div>
      </div>
      <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 border-r border-[var(--border)] bg-[#0c1120]/90 backdrop-blur-xl px-4 py-5 lg:flex lg:flex-col">
      <Link href="/" className="mb-10 flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#00cfe8] text-lg font-black text-white shadow-[0_0_26px_rgba(124,92,255,0.28)]">K</span>
        <span>
          <span className="block text-lg font-extrabold tracking-tight text-[var(--text)]">Kandex</span>
          <span className="block text-[11px] font-medium text-[var(--text-muted)]">study workspace</span>
        </span>
      </Link>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Aplikacja</p>
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${active ? "bg-[var(--accent-soft)] text-white ring-1 ring-inset ring-[#7c5cff]/35 shadow-[0_8px_22px_rgba(0,0,0,0.18)]" : "text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text)]"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-lg text-sm ${active ? "bg-[#7c5cff]/20 text-[#b8aaff]" : "bg-white/[0.05] text-[var(--text-tertiary)] group-hover:bg-[#7c5cff]/15 group-hover:text-[#b8aaff]"}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <Link href="/settings" className="block rounded-xl border border-[var(--border)] bg-white/[0.035] p-4 transition hover:bg-white/[0.07]">
          <p className="text-xs font-bold text-[var(--text)]">EduVULCAN połączony</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{account?.fullName ?? "Aktywna sesja"}</p>
        </Link>
        <a href="/?chooseJournal=1" className="block rounded-xl border border-[var(--border)] px-4 py-3 text-center text-xs font-bold text-[var(--text)] transition hover:bg-white/[0.06]">
          ← Zmień dziennik
        </a>
        <div className="rounded-xl border border-[var(--border)] bg-white/[0.025] p-4">
          <p className="text-xs font-bold text-[var(--text)]">Skup się na nauce...</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Kalendarz, oceny i materiały w jednym miejscu.</p>
        </div>
        {logoutError && <p role="alert" className="text-xs text-[#ff9eae]">{logoutError}</p>}
        <button type="button" onClick={handleLogout} disabled={loggingOut} className="w-full rounded-xl border border-[#ff5c7c]/30 px-4 py-3 text-center text-xs font-bold text-[#ff9eae] transition hover:bg-[#ff5c7c]/[0.08] disabled:opacity-60">
          {loggingOut ? "Wylogowywanie..." : "Wyloguj"}
        </button>
      </div>
      </aside>
    </>
  );
}