"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href;
  };

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/calendar", label: "Kalendarz" },
    { href: "/subjects", label: "Oceny" },
    { href: "/settings", label: "Ustawienia" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 p-5 flex flex-col animate-slide-in-left">

      {/* Logo */}
      <div className="mb-10 animate-slide-in-down">
        <h1 className="text-2xl font-bold text-blue-500">
          Kandex
        </h1>

        <p className="text-sm text-zinc-400 mt-1">
          Osobisty asystent nauki dla uczniów
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {navItems.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              animation: `slideInLeft 0.4s ease-out ${index * 0.05}s both`,
            }}
            className={`p-3 rounded-xl transition-all duration-200 ${
              isActive(item.href)
                ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                : "text-zinc-700 hover:bg-zinc-100 hover:translate-x-1"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto">
      </div>

    </aside>
  );
}

