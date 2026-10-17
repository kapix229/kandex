"use client";

import { VulcanEvent } from "@/types/vulcan";

interface EventBadgeProps {
  event: VulcanEvent;
  compact?: boolean;
}

const eventTypeConfig = {
  assignment: { bg: "bg-[#7c5cff]/15", text: "text-[#c7beff]", label: "Zadanie" },
  test: { bg: "bg-[#ffb74d]/15", text: "text-[#ffd08a]", label: "Sprawdzian" },
  exam: { bg: "bg-[#ff5c7c]/15", text: "text-[#ffb0bf]", label: "Egzamin" },
  grade: { bg: "bg-[#00e676]/[0.12]", text: "text-[#8cf0b0]", label: "Ocena" },
  note: { bg: "bg-[#4fc3f7]/[0.12]", text: "text-[#a8e4ff]", label: "Notatka" },
  event: { bg: "bg-[#00e5ff]/[0.12]", text: "text-[#9df5ff]", label: "Wydarzenie" },
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
        {event.completed && <span className="text-[#8cf0b0]">✓ Ukończone</span>}
      </div>
    </div>
  );
}
