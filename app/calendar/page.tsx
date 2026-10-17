"use client";

import { useEffect, useState } from "react";
import Calendar from "@/components/Calendar";
import EventDetails from "@/components/EventDetails";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import { VulcanEvent } from "@/types/vulcan";

type EventsResponse = {
  success: boolean;
  events?: Array<Omit<VulcanEvent, "date" | "dueDate"> & {
    date: string;
    dueDate?: string;
  }>;
  error?: string;
};

export default function CalendarPage() {
  const { account, signOut } = useVulcanSession();
  const [events, setEvents] = useState<VulcanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<VulcanEvent | null>(null);

  async function handleLogout() {
    try {
      await fetch("/api/eduvulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/eduvulcan/events", { cache: "no-store" });
        const data: EventsResponse = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setAuthError(data.error ?? "Nie udało się pobrać wydarzeń.");
          setEvents([]);
          return;
        }

        // API returns ISO strings - convert back to Date objects the calendar expects.
        const parsed: VulcanEvent[] = (data.events ?? []).map((e) => ({
          ...e,
          date: new Date(e.date),
          dueDate: e.dueDate ? new Date(e.dueDate) : undefined,
        }));

        setEvents(parsed);
        setAuthError(null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Nieznany błąd";
        setAuthError(`Błąd sieci: ${message}`);
        setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dayEvents = selectedDate
    ? events.filter(
        (e) => new Date(e.date).toDateString() === selectedDate.toDateString()
      )
    : [];

  const handleEventUpdate = (updatedEvent: VulcanEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );
    setSelectedEvent(updatedEvent);
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-in-down flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Kalendarz</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Śledzenie zadań, sprawdzianów i ocen z Vulcana
          </p>
        </div>
        {account && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-tertiary)]">
              Zalogowano jako <span className="font-semibold">{account.fullName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text)] px-3 py-1.5 rounded-xl text-sm hover:bg-white/[0.08]"
            >
              Wyloguj
            </button>
          </div>
        )}
      </div>

      {authError && (
        <div role="alert" className="bg-[#ff5c7c]/[0.08] border border-[#ff5c7c]/25 text-[#ffb0bf] rounded-2xl px-4 py-3 text-sm">{authError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="glass-card rounded-3xl border-[var(--border)] p-12 text-center text-[var(--text-tertiary)]">
              Pobieranie kalendarza z EduVULCAN…
            </div>
          ) : events.length === 0 ? (
            <div className="glass-card rounded-3xl border-[var(--border)] p-12 text-center text-[var(--text-muted)]">
              Brak wydarzeń do wyświetlenia. Gdy dziennik udostępni terminy, pojawią się tutaj.
            </div>
          ) : (
            <Calendar
              events={events}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setSelectedEvent(null);
              }}
            />
          )}
        </div>

        <div className="space-y-4">
          {selectedDate && (
            <div className="glass-card rounded-3xl p-6 border-[var(--border)] animate-fade-in">
              <h3 className="text-lg font-bold text-[var(--text)] mb-3">
                {selectedDate.toLocaleDateString("pl-PL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              {dayEvents.length > 0 ? (
                <div className="space-y-3">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-3 rounded-2xl border border-[var(--border)] hover:bg-white/[0.06] transition-colors duration-200"
                    >
                      <p className="font-semibold text-[var(--text)] text-sm">
                        {event.title}
                      </p>
                      {event.subject && (
                        <p className="text-xs text-[var(--text-muted)]">{event.subject}</p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  Brak zdarzeń w tym dniu
                </p>
              )}
            </div>
          )}

          {/* Event Details */}
          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onEventUpdate={handleEventUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
