"use client";

import { useState } from "react";
import { VulcanEvent } from "@/types/vulcan";
import EventBadge from "./EventBadge";
import dayjs from "dayjs";
import "dayjs/locale/pl";

dayjs.locale("pl");

interface CalendarProps {
  events?: VulcanEvent[];
  onDateSelect?: (date: Date) => void;
}

export default function Calendar({ events = [], onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        new Date(event.date).toDateString() === date.toDateString()
    );
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = firstDayOfMonth(currentDate);
    const daysCount = daysInMonth(currentDate);

    const days = [];
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = daysInMonth(prevMonth);

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push({
        date: new Date(year, month - 1, day),
        dayOfMonth: day,
        isCurrentMonth: false,
        events: [],
      });
    }

    // Current month days
    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        events: getEventsForDate(date),
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        dayOfMonth: day,
        isCurrentMonth: false,
        events: [],
      });
    }

    return days;
  };

  const days = generateCalendarDays();
  const monthName = dayjs(currentDate).format("MMMM YYYY");
  const weekDays = ["Nie", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];

  return (
    <div className="glass-card rounded-3xl p-6 shadow-sm border-[var(--border)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--text)]">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
              )
            }
            className="p-2 rounded-2xl hover:bg-white/[0.025]/[0.06] transition-colors duration-200"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 rounded-2xl hover:bg-[#7c5cff]/15 text-sm font-medium text-[#b8aaff] transition-colors duration-200"
          >
            Dziś
          </button>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
              )
            }
            className="p-2 rounded-2xl hover:bg-white/[0.06] transition-colors duration-200"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-[var(--text-tertiary)] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => {
              setSelectedDate(day.date);
              onDateSelect?.(day.date);
            }}
            className={`aspect-square p-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
              day.isCurrentMonth
                ? day.isToday
                  ? "bg-[#7c5cff]/20 border-[#8b70ff] shadow-[0_0_18px_rgba(124,92,255,0.16)] font-bold"
                  : selectedDate?.toDateString() === day.date.toDateString()
                    ? "bg-[#7c5cff]/12 border-[#7c5cff]/60 shadow-md ring-1 ring-[#7c5cff]/40"
                    : "bg-white/[0.025]/[0.025] border-[var(--border)] hover:bg-white/[0.025]/[0.06] hover:border-[var(--border-strong)]"
                : "bg-black/10 border-[var(--border)]"
            }`}
          >
            <div
              className={`text-sm font-semibold mb-1 ${
                day.isToday
                  ? "text-[#d1c8ff]"
                  : selectedDate?.toDateString() === day.date.toDateString()
                    ? "text-[#b8aaff]"
                    : day.isCurrentMonth
                      ? "text-[var(--text)]"
                      : "text-[var(--text-tertiary)]"
              }`}
            >
              {day.dayOfMonth}
            </div>

            {/* Event indicators */}
            {day.events.length > 0 && (
              <div className="space-y-0.5">
                {day.events.slice(0, 2).map((event) => (
                  <EventBadge key={event.id} event={event} compact />
                ))}
                {day.events.length > 2 && (
                  <div className="text-xs text-[var(--text-tertiary)] font-medium">
                    +{day.events.length - 2}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upcoming events preview */}
      {events.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
            Nadchodzące zdarzenia
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {events
              .filter((e) => new Date(e.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-slate-50 rounded-2xl border-slate-200/70 hover:bg-white/[0.06] transition-colors duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text)]">
                        {event.title}
                      </p>
                      {event.subject && (
                        <p className="text-xs text-[var(--text-tertiary)]">{event.subject}</p>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {dayjs(event.date).format("D MMM")}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
