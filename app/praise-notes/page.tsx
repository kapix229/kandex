"use client";

import { useEffect, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import {
  AlertTriangle,
  Star,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";

type PraiseNote = {
  id: string;
  date: string;
  category: string;
  description: string;
  teacher?: string;
  type: "praise" | "note";
};

type EduVulcanEvent = {
  id: string;
  date: string;
  title: string;
  subject?: string;
  teacher?: string;
  type?: string;
};

export default function PraiseNotesPage() {
  const { account, signOut } = useVulcanSession();
  const [praises, setPraises] = useState<PraiseNote[]>([]);
  const [notes, setNotes] = useState<PraiseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"praise" | "notes">("praise");

  const loadPraiseNotes = async () => {
    setLoading(true);
    try {
      // Try to fetch from EduVULCAN API
      const res = await fetch("/api/eduvulcan/events", { cache: "no-store" });
      const data = await res.json();

      if (data.success && data.data) {
        // Transform events to praise/notes format
        const events = data.data as EduVulcanEvent[];
        const praiseItems: PraiseNote[] = [];
        const noteItems: PraiseNote[] = [];

        events.forEach((event) => {
          if (event.type === "praise" || event.title?.toLowerCase().includes("pochwała")) {
            praiseItems.push({
              id: event.id,
              date: event.date,
              category: event.subject || "Ogólne",
              description: event.title,
              teacher: event.teacher,
              type: "praise",
            });
          } else if (event.type === "note" || event.title?.toLowerCase().includes("uwaga")) {
            noteItems.push({
              id: event.id,
              date: event.date,
              category: event.subject || "Ogólne",
              description: event.title,
              teacher: event.teacher,
              type: "note",
            });
          }
        });

        setPraises(praiseItems);
        setNotes(noteItems);
      } else {
        // No data available - empty state
        setPraises([]);
        setNotes([]);
      }
    } catch (err) {
      console.error("Failed to load praise/notes:", err);
      setPraises([]);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Load praise/notes on mount
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      loadPraiseNotes();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const filteredItems = activeTab === "praise" ? praises : notes;

  // Group by month
  const groupedByMonth = filteredItems.reduce((acc, item) => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" }),
        items: [],
      };
    }
    acc[monthKey].items.push(item);
    return acc;
  }, {} as Record<string, { label: string; items: PraiseNote[] }>);

  const sortedMonths = Object.entries(groupedByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, value]) => ({ key, ...value }));

  async function handleLogout() {
    try {
      await fetch("/api/eduvulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dziennik</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Pochwały i uwagi</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Przeglądaj pochwały i uwagi z dziennika</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SyncButton onSync={loadPraiseNotes} label="Synchronizuj" disabled={loading} />
          {account && (
            <button onClick={handleLogout} className="btn-secondary">Wyloguj</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab("praise")}
            className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-all border-b-2 ${
              activeTab === "praise"
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-primary-muted)]/30"
                : "text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5" strokeWidth={2} />
              <span>Pochwały</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "praise" ? "bg-[var(--accent)] text-[var(--text-inverse)]" : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
              }`}>
                {praises.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-all border-b-2 ${
              activeTab === "notes"
                ? "border-[var(--warning)] text-[var(--warning)] bg-[var(--warning-muted)]/30"
                : "text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
              <span>Uwagi</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "notes" ? "bg-[var(--warning)] text-[var(--text-inverse)]" : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
              }`}>
                {notes.length}
              </span>
            </div>
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[var(--surface-hover)] rounded-xl border border-[var(--border)]" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              {activeTab === "praise" ? (
                <>
                  <Star className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Brak pochwał</h3>
                  <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
                    Gdy nauczyciele dodadzą pochwały w dzienniku, pojawią się one tutaj.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Brak uwag</h3>
                  <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
                    Gdy nauczyciele dodadzą uwagi w dzienniku, pojawią się one tutaj.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedMonths.map((month) => (
                <div key={month.key} className="animate-slide-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-[var(--border)]" />
                    <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)]">
                      {month.label}
                    </span>
                    <div className="h-px flex-1 bg-[var(--border)]" />
                  </div>
                  <div className="space-y-3">
                    {month.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                          activeTab === "praise"
                            ? "bg-[var(--success-muted)]/30 border-[var(--success-border)] hover:border-[var(--success)]"
                            : "bg-[var(--warning-muted)]/30 border-[var(--warning-border)] hover:border-[var(--warning)]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 grid h-12 w-12 place-items-center rounded-xl ${
                            activeTab === "praise"
                              ? "bg-[var(--success)] text-[var(--text-inverse)]"
                              : "bg-[var(--warning)] text-[var(--text-inverse)]"
                          }`}>
                            {activeTab === "praise" ? (
                              <Star className="h-6 w-6" strokeWidth={2} />
                            ) : (
                              <AlertTriangle className="h-6 w-6" strokeWidth={2} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <p className={`font-semibold ${activeTab === "praise" ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                                {item.category}
                              </p>
                              <span className={`flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${
                                activeTab === "praise"
                                  ? "bg-[var(--success)]/20 text-[var(--success)]"
                                  : "bg-[var(--warning)]/20 text-[var(--warning)]"
                              }`}>
                                {activeTab === "praise" ? "Pochwała" : "Uwaga"}
                              </span>
                            </div>
                            <p className="text-[var(--text)] mb-3">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-tertiary)]">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                                {formatDate(item.date)}
                              </span>
                              {item.teacher && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" strokeWidth={2} />
                                  {item.teacher}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {sortedMonths.length === 0 && (
                <div className="text-center py-16">
                  {activeTab === "praise" ? (
                <>
                  <Star className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Brak pochwał</h3>
                  <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
                    Gdy nauczyciele dodadzą pochwały w dzienniku, pojawią się one tutaj.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Brak uwag</h3>
                  <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
                    Gdy nauczyciele dodadzą uwagi w dzienniku, pojawią się one tutaj.
                  </p>
                </>
              )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Help section */}
      <div className="card p-5 bg-[var(--surface-hover)] border-[var(--border)]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)]">
            <MessageSquare className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-1">O pochwałach i uwagach</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Pochwały i uwagi są importowane z modułu &ldquo;Pochwały i uwagi&rdquo; w EduVULCAN.
              Dane są synchronizowane automatycznie przy każdym odświeżeniu. Jeśli nie widzisz
              oczekiwanych wpisów, sprawdź czy są dostępne w oryginalnym dzienniku.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}