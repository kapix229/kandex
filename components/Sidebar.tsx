"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

const navItems = [
  { href: "/", label: "Pulpit", icon: "◫" },
  { href: "/calendar", label: "Plan lekcji", icon: "▦" },
  { href: "/subjects", label: "Oceny", icon: "◈" },
  { href: "/assignments", label: "Zadania", icon: "✓" },
  { href: "/study", label: "Nauka", icon: "✳" },
  { href: "/settings", label: "Ustawienia", icon: "⚙" },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[var(--accent)] text-lg font-black text-white shadow-[0_8px_18px_rgba(49,91,67,0.18)]">K</span>
      <span>
        <span className="block text-[17px] font-extrabold tracking-tight text-[var(--text)]">Kandex</span>
        <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)]">STUDENT WORKSPACE</span>
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { account } = useVulcanSession();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[#f7f5ef]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <span className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)]">
            <span className="status-dot" /> EduVULCAN
          </span>
        </div>
        <nav aria-label="Nawigacja główna" className="muted-scrollbar mt-3 flex gap-1 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${isActive(item.href) ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:bg-white hover:text-[var(--text)]"}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-[var(--border)] bg-[#f7f5ef] px-5 py-6 lg:flex">
        <div className="mb-11 px-1"><Brand /></div>
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#96998f]">Twoja przestrzeń</div>
        <nav aria-label="Nawigacja główna" className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-[14px] px-3 py-3 text-[13px] font-semibold transition-all ${active ? "bg-[var(--accent)] text-white shadow-[0_8px_18px_rgba(49,91,67,0.14)]" : "text-[#6d726a] hover:bg-white hover:text-[var(--text)]"}`}>
                <span className={`grid h-8 w-8 place-items-center rounded-[10px] text-base transition ${active ? "bg-white/10 text-white" : "bg-[#ebe9e1] text-[#73786f] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)]"}`}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white/90" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-[18px] border border-[#dce3da] bg-[#eaf0e8] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]"><span className="status-dot" /> Połączenie z dziennikiem</div>
            <p className="mt-2 truncate text-xs font-semibold text-[#46564a]">{account?.fullName ?? "EduVULCAN"}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#788276]">Dane synchronizowane z Twojego konta.</p>
            <Link href="/settings" className="mt-3 inline-flex text-xs font-bold text-[var(--accent)] hover:underline">Ustawienia połączenia →</Link>
          </div>
          <div className="px-3 py-2 text-[10px] font-medium text-[#a0a197]">Spokojna głowa. Lepsza nauka.</div>
        </div>
      </aside>
    </>
  );
}
