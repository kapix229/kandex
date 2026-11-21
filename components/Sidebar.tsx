"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import {
  LayoutDashboard,
  Calendar,
  Award,
  ClipboardList,
  Activity,
  Settings,
  Brain,
  BookOpen,
  Target,
  Trophy,
  MessageSquare,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/learning", label: "My Learning", icon: BookOpen },
      { href: "/ai-tutor", label: "AI Tutor", icon: Brain },
    ],
  },
  {
    label: "SCHOOL JOURNAL",
    items: [
      { href: "/grades", label: "Grades", icon: Award },
      { href: "/timetable", label: "Timetable", icon: Calendar },
      { href: "/attendance", label: "Attendance", icon: Activity },
      { href: "/assignments", label: "Homework & Tests", icon: ClipboardList },
      { href: "/notices", label: "School Notices", icon: Bell },
      { href: "/praise-notes", label: "Praise & Notes", icon: MessageSquare },
    ],
  },
  {
    label: "PERSONAL",
    items: [
      { href: "/flashcards", label: "Flashcards", icon: Target },
      { href: "/progress", label: "Study Progress", icon: Trophy },
      { href: "/achievements", label: "Achievements", icon: Award },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { account, signOut } = useVulcanSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

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
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 text-sm font-extrabold text-[var(--text)]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[var(--text-inverse)]">K</span>
          Kandex
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
            aria-label="Otwórz menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sticky top-0 z-30 hidden h-screen flex-col overflow-y-auto sidebar-transition border-r border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl lg:flex ${
          collapsed ? "w-[56px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-4 py-4 border-b border-[var(--border)] shrink-0 transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)] text-lg font-black shrink-0">
            K
          </span>
          {!collapsed && (
            <span className="overflow-hidden whitespace-nowrap">
              <span className="block text-lg font-extrabold tracking-tight text-[var(--text)]">Kandex</span>
              <span className="block text-[11px] font-medium text-[var(--text-tertiary)]">study workspace</span>
            </span>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6" role="navigation" aria-label="Główna nawigacja">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className="animate-slide-in-left" style={{ animationDelay: `${groupIndex * 40}ms` }}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1" role="list">
                {group.items.map((item, itemIndex) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? "bg-[var(--accent-primary-muted)] text-[var(--accent)] shadow-sm"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                        }`}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                      >
                        <span
                          className={`flex-shrink-0 grid h-9 w-9 place-items-center rounded-lg transition-all ${
                            active
                              ? "bg-[var(--accent-primary-muted)] text-[var(--accent)]"
                              : "text-[var(--text-tertiary)] group-hover:text-[var(--accent)]"
                          }`}
                          aria-hidden="true"
                        >
                          <item.icon className="h-5 w-5" strokeWidth={2} />
                        </span>
                        {!collapsed && (
                          <span className="overflow-hidden whitespace-nowrap">{item.label}</span>
                        )}
                        {active && !collapsed && (
                          <span className="ml-auto w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Collapse/Expand toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all"
            aria-label={collapsed ? "Rozwiń menu" : "Zwiń menu"}
            title={collapsed ? "Rozwiń menu" : "Zwiń menu"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            {!collapsed && <span>Zwiń</span>}
          </button>
        </nav>

        {/* Bottom section - User profile & actions */}
        <div className="border-t border-[var(--border)] p-3 space-y-2">
          {/* User profile */}
          <Link
            href="/settings"
            className={`group flex items-center gap-3 rounded-xl p-3 transition-all ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Profil i ustawienia" : undefined}
          >
            <div className="flex-shrink-0 grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)]">
              <User className="h-5 w-5" strokeWidth={2} />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-semibold text-[var(--text)] truncate">
                  {account?.fullName ?? "Uczeń"}
                </p>
                <p className="text-[10px] font-medium text-[var(--text-tertiary)] truncate">
                  EduVULCAN połączony
                </p>
              </div>
            )}
          </Link>

          {/* Switch journal */}
          <Link
            href="/?chooseJournal=1"
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-hover)] hover:text-[var(--text)] ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Zmień dziennik" : undefined}
          >
            <span className="flex-shrink-0 grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-hover)] text-[var(--text-tertiary)] group-hover:text-[var(--accent)]">
              <X className="h-4 w-4" strokeWidth={2} />
            </span>
            {!collapsed && <span>Zmień dziennik</span>}
          </Link>

          {/* Logout */}
          {logoutError && (
            <p role="alert" className={`text-[10px] text-[var(--danger)] ${collapsed ? "text-center" : ""}`}>
              {logoutError}
            </p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--danger)] transition-all hover:bg-[var(--danger-muted)] disabled:opacity-60 ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Wyloguj" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
            {!collapsed && <span>Wyloguj</span>}
            {loggingOut && !collapsed && <span className="ml-auto animate-pulse">...</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar panel */}
      {mobileOpen && (
        <aside
          className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-[280px] max-w-full flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] animate-slide-in-right"
          role="dialog"
          aria-label="Menu nawigacji"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <span className="text-lg font-extrabold text-[var(--text)]">Kandex</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
              aria-label="Zamknij menu"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-6">
            {navGroups.map((group, groupIndex) => (
              <div key={group.label} className="animate-slide-in-left" style={{ animationDelay: `${groupIndex * 40}ms` }}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  {group.label}
                </p>
                <ul className="space-y-1" role="list">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                            active
                              ? "bg-[var(--accent-primary-muted)] text-[var(--accent)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span
                            className={`flex-shrink-0 grid h-9 w-9 place-items-center rounded-lg transition-all ${
                              active
                                ? "bg-[var(--accent-primary-muted)] text-[var(--accent)]"
                                : "text-[var(--text-tertiary)] group-hover:text-[var(--accent)]"
                            }`}
                            aria-hidden="true"
                          >
                            <item.icon className="h-5 w-5" strokeWidth={2} />
                          </span>
                          <span>{item.label}</span>
                          {active && <span className="ml-auto w-2 h-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="border-t border-[var(--border)] pt-4 space-y-2">
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent-primary-muted)] text-[var(--accent)]">
                  <User className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text)]">{account?.fullName ?? "Uczeń"}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Profil i ustawienia</p>
                </div>
              </Link>

              <Link
                href="/?chooseJournal=1"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface-hover)] text-[var(--text-tertiary)]">
                  <X className="h-5 w-5" strokeWidth={2} />
                </span>
                <span>Zmień dziennik</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] disabled:opacity-60 transition-all"
              >
                <LogOut className="h-5 w-5" strokeWidth={2} />
                <span>{loggingOut ? "Wylogowywanie..." : "Wyloguj"}</span>
              </button>
            </div>
          </nav>
        </aside>
      )}
    </>
  );
}