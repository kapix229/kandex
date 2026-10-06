"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const { account } = useVulcanSession();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 border-r border-[var(--border)] bg-[#f7f4ee] px-4 py-5 lg:flex lg:flex-col">
      <Link href="/" className="mb-10 flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-lg font-black text-white shadow-[0_7px_16px_rgba(49,88,68,0.20)]">K</span>
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
            <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${active ? "bg-[var(--accent)] text-white shadow-[0_8px_18px_rgba(49,88,68,0.15)]" : "text-[#62675f] hover:bg-white hover:text-[var(--text)]"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-lg text-sm ${active ? "bg-white/10 text-white" : "bg-[#ebe9e2] text-[#6c716a] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)]"}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <Link href="/settings" className="block rounded-xl border border-[var(--border)] bg-white/80 p-4 transition hover:bg-white">
          <p className="text-xs font-bold text-[var(--text)]">EduVULCAN połączony</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{account?.fullName ?? "Aktywna sesja"}</p>
        </Link>
        <div className="rounded-xl border border-[var(--border)] bg-white/70 p-4">
          <p className="text-xs font-bold text-[var(--text)]">Skup się na nauce...</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Kalendarz, oceny i materiały w jednym miejscu.</p>
        </div>
      </div>
    </aside>
  );
}