"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import {
  Search,
  Command,
  Bell,
  Timer,
  Brain,
  User,
  ChevronDown,
  LogOut,
  Settings,
  X,
} from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/learning": "My Learning",
  "/ai-tutor": "AI Tutor",
  "/grades": "Grades",
  "/timetable": "Timetable",
  "/attendance": "Attendance",
  "/assignments": "Homework & Tests",
  "/notices": "School Notices",
  "/praise-notes": "Praise & Notes",
  "/flashcards": "Flashcards",
  "/progress": "Study Progress",
  "/achievements": "Achievements",
  "/calendar": "Calendar",
  "/settings": "Settings",
};

export default function TopBar() {
  const pathname = usePathname();
  const { account, signOut } = useVulcanSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Command palette shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentPageTitle = pageTitles[pathname] || "Kandex";

  const handleLogout = async () => {
    try {
      await fetch("/api/eduvulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[48px] border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl lg:ml-[240px] transition-all duration-300">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left: Breadcrumb + Search */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Page title / breadcrumb */}
          <div className="hidden sm:block truncate">
            <h1 className="text-sm font-semibold text-[var(--text)] truncate max-w-[300px]">
              {currentPageTitle}
            </h1>
          </div>

          {/* Global search */}
          <div className="relative flex-1 max-w-md">
            <button
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center gap-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-tertiary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface)] focus-within:border-[var(--border-focus)] focus-within:ring-2 focus-within:ring-[var(--accent-primary-muted)]"
              aria-label="Szukaj (⌘K)"
            >
              <Search className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
              <span className="truncate">Szukaj ocen, zadań, lekcji…</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-tertiary)] border border-[var(--border)]">
                <Command className="h-3 w-3" strokeWidth={2} />
                <span>K</span>
              </kbd>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 ml-4">
          {/* AI Tutor shortcut */}
          <button
            onClick={() => setAiTutorOpen(true)}
            className="relative rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] transition-all"
            aria-label="AI Tutor"
            title="AI Tutor"
          >
            <Brain className="h-5 w-5" strokeWidth={2} />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--accent)] text-[var(--text-inverse)] text-[10px] font-bold flex items-center justify-center animate-pulse">
              AI
            </span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all"
              aria-label="Powiadomienia"
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--danger)] text-[var(--text-inverse)] text-[10px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 animate-scale-in glass-card rounded-2xl border border-[var(--border)] shadow-xl p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text)]">Powiadomienia</h3>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
                    aria-label="Zamknij"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <div className="px-4 py-3 text-sm text-[var(--text-tertiary)] text-center">
                    Brak nowych powiadomień
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-[var(--border)]">
                  <Link
                    href="/settings"
                    className="block text-center text-sm font-medium text-[var(--accent)] hover:underline"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Zobacz wszystkie
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Session timer (when on study pages) */}
          {["/learning", "/ai-tutor", "/flashcards", "/progress"].includes(pathname) && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary-muted)] px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
              <Timer className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="tabular-nums font-mono">24:17</span>
            </div>
          )}

          {/* Profile menu */}
          <div className="relative ml-1" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[var(--surface-hover)] transition-all"
              aria-label="Menu profilu"
              aria-expanded={profileOpen}
            >
              <div className="h-8 w-8 rounded-xl bg-[var(--accent-primary-muted)] flex items-center justify-center">
                <User className="h-5 w-5 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <span className="hidden sm:block text-sm font-medium text-[var(--text)] truncate max-w-[120px]">
                {account?.fullName?.split(" ")[0] ?? "Uczeń"}
              </span>
              <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" strokeWidth={2} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 animate-scale-in glass-card rounded-2xl border border-[var(--border)] shadow-xl p-2 overflow-hidden">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--text)]">{account?.fullName ?? "Uczeń"}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">EduVULCAN</p>
                </div>
                <hr className="border-[var(--border)] mx-2 my-1" />
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="h-4 w-4" strokeWidth={2} />
                  Ustawienia
                </Link>
                <Link
                  href="/?chooseJournal=1"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  Zmień dziennik
                </Link>
                <hr className="border-[var(--border)] mx-2 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  Wyloguj
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}