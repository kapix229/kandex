"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Przegląd", icon: "⌂" },
  { href: "/calendar", label: "Kalendarz", icon: "▣" },
  { href: "/subjects", label: "Oceny", icon: "✓" },
  { href: "/settings", label: "Ustawienia", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 border-r border-[#e6eaf1] bg-[#fbfcfe] px-4 py-5 lg:flex lg:flex-col">
      <Link href="/" className="mb-9 flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#6b35ef] text-lg font-black text-white shadow-[0_8px_18px_rgba(107,53,239,0.22)]">K</span>
        <span>
          <span className="block text-lg font-extrabold tracking-tight text-[#0b1020]">Kandex</span>
          <span className="block text-[11px] font-medium text-[#91a0b7]">study workspace</span>
        </span>
      </Link>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#91a0b7]">Nawigacja</p>
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${active ? "bg-[#11182b] text-white shadow-[0_8px_18px_rgba(17,24,43,0.12)]" : "text-[#52627b] hover:bg-[#f1f4f8] hover:text-[#0b1020]"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-xl text-sm ${active ? "bg-white/10 text-white" : "bg-[#f0f3f8] text-[#6f8099] group-hover:bg-white"}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-[#dfe8ff] bg-gradient-to-br from-[#f1f4ff] to-[#edfbff] p-4">
        <p className="text-xs font-bold text-[#15203a]">Skup się na nauce.</p>
        <p className="mt-1 text-xs leading-relaxed text-[#71819a]">Kalendarz, oceny i materiały w jednym miejscu.</p>
      </div>
    </aside>
  );
}
