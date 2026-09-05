"use client";

import { VulcanEvent } from "@/types/vulcan";

interface EventBadgeProps {
  event: VulcanEvent;
  compact?: boolean;
}

const eventTypeConfig = {
  assignment: { bg: "bg-purple-100", text: "text-purple-700", label: "Zadanie" },
  test: { bg: "bg-orange-100", text: "text-orange-700", label: "Sprawdzian" },
  exam: { bg: "bg-red-100", text: "text-red-700", label: "Egzamin" },
  grade: { bg: "bg-green-100", text: "text-green-700", label: "Ocena" },
  note: { bg: "bg-blue-100", text: "text-blue-700", label: "Notatka" },
  event: { bg: "bg-cyan-100", text: "text-cyan-700", label: "Wydarzenie" },
};

export default function EventBadge({ event, compact }: EventBadgeProps) {
  const config = eventTypeConfig[event.type];
  const priorityEmoji = event.priority === "high" ? "🔴" : event.priority === "normal" ? "🟡" : "";

  if (compact) {
    return (
      <div
        className={`text-xs px-1.5 py-0.5 rounded font-medium truncate ${config.bg} ${config.text}`}
        title={event.title}
      >
        {event.title.slice(0, 12)}
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg ${config.bg} border border-current border-opacity-20 animate-slide-in-left`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${config.text}`}>
            {config.label}
          </p>
          <h4 className={`text-base font-bold ${config.text}`}>
            {event.title}
          </h4>
        </div>
        <span className="text-lg">{priorityEmoji}</span>
      </div>

      {event.description && (
        <p className={`text-xs ${config.text} opacity-75 mb-2`}>
          {event.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className={`${config.text} opacity-75`}>
          {event.subject && `${event.subject}`}
        </span>
        {event.completed && <span className="text-green-600">✓ Ukończone</span>}
      </div>
    </div>
  );
}
