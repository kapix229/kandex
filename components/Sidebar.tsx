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
    <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 border-r border-slate-200/70 bg-white/65 px-4 py-5 backdrop-blur-2xl lg:flex lg:flex-col">
      <Link href="/" className="mb-9 flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-lg font-black text-white shadow-lg shadow-indigo-500/20">K</span>
        <span>
          <span className="block text-lg font-extrabold tracking-tight text-slate-900">Kandex</span>
          <span className="block text-[11px] font-medium text-slate-400">study workspace</span>
        </span>
      </Link>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Nawigacja</p>
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-xl text-sm ${active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white"}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-cyan-50 p-4">
        <p className="text-xs font-bold text-slate-900">Skup się na nauce.</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">Kalendarz, oceny i materiały w jednym miejscu.</p>
      </div>
    </aside>
  );
}
