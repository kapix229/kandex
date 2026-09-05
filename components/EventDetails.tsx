"use client";

import { useMemo, useState } from "react";
import { VulcanEvent } from "@/types/vulcan";
import LearningMaterials from "./LearningMaterials";
import EditModal, { type EditModalFormData } from "./EditModal";
import {
  extractTopicsFromDescription,
  recommendMaterials,
} from "@/services/learning-materials";
import dayjs from "dayjs";
import "dayjs/locale/pl";

dayjs.locale("pl");

interface EventDetailsProps {
  event: VulcanEvent;
  onEventUpdate?: (updatedEvent: VulcanEvent) => void;
}

const eventTypeConfig = {
  assignment: { emoji: "📝", color: "purple" },
  test: { emoji: "📋", color: "orange" },
  exam: { emoji: "🎓", color: "red" },
  grade: { emoji: "⭐", color: "green" },
  note: { emoji: "📌", color: "blue" },
  event: { emoji: "📅", color: "cyan" },
};

export default function EventDetails({ event, onEventUpdate }: EventDetailsProps) {
  const [localEvent, setLocalEvent] = useState(event);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCompleteAnimation, setShowCompleteAnimation] = useState(false);

  const config = eventTypeConfig[localEvent.type];
  const today = dayjs();
  const eventDate = dayjs(localEvent.date);
  const daysUntil = eventDate.diff(today, "days");

  // AI-based topic extraction and material recommendation
  const { extractedTopic, suggestedMaterials } = useMemo(() => {
    const topic = extractTopicsFromDescription(
      localEvent.title,
      localEvent.description,
      localEvent.subject
    );
    const materials = recommendMaterials(topic);

    return {
      extractedTopic: topic,
      suggestedMaterials: materials,
    };
  }, [localEvent]);

  // Check if event needs study materials
  const needsStudyMaterials = ["assignment", "test", "exam"].includes(
    localEvent.type
  );

  // Toggle completion status
  const handleToggleCompletion = () => {
    const updatedEvent = { ...localEvent, completed: !localEvent.completed };
    setLocalEvent(updatedEvent);
    setShowCompleteAnimation(true);
    
    // Callback do parent component
    onEventUpdate?.(updatedEvent);

    // Resetuj animation
    setTimeout(() => setShowCompleteAnimation(false), 500);
  };

  // Handle edit save
  const handleEditSave = (formData: EditModalFormData) => {
    const updatedEvent = {
      ...localEvent,
      title: formData.title,
      description: formData.description,
    };
    setLocalEvent(updatedEvent);
    onEventUpdate?.(updatedEvent);
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border border-zinc-200 animate-fade-in space-y-4 transition-all duration-300 ${
      showCompleteAnimation ? "scale-105" : "scale-100"
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{config.emoji}</span>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-800">{localEvent.title}</h2>
          {localEvent.subject && (
            <p className="text-sm text-zinc-600">{localEvent.subject}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600">Status:</span>
          <button
            onClick={handleToggleCompletion}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer hover:shadow-md ${
              localEvent.completed
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
            }`}
          >
            {localEvent.completed ? "✓ Ukończone" : "⏳ W trakcie"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600">Priorytet:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              localEvent.priority === "high"
                ? "bg-red-100 text-red-700"
                : localEvent.priority === "normal"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
            }`}
          >
            {localEvent.priority === "high"
              ? "🔴 Wysoki"
              : localEvent.priority === "normal"
                ? "🟡 Normalny"
                : "🟢 Niski"}
          </span>
        </div>
      </div>

      {/* Date and time */}
      <div className="bg-zinc-50 rounded-lg p-4 mb-4 border border-zinc-200">
        <p className="text-sm text-zinc-600 mb-1">📅 Data</p>
        <p className="font-semibold text-zinc-800">
          {eventDate.format("dddd, D MMMM YYYY")}
        </p>
        {daysUntil >= 0 && (
          <p className="text-xs text-zinc-600 mt-2">
            {daysUntil === 0
              ? "Dzisiaj"
              : daysUntil === 1
                ? "Jutro"
                : `Za ${daysUntil} dni`}
          </p>
        )}
      </div>

      {/* Description */}
      {localEvent.description && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-1">Opis</p>
          <p className="text-sm text-blue-800">{localEvent.description}</p>
        </div>
      )}

      {/* AI Learning Materials Section */}
      {needsStudyMaterials && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <h3 className="font-semibold text-amber-900">
              Sugerowane materiały do nauki
            </h3>
          </div>

          <p className="text-xs text-amber-800 mb-3">
            Analiza AI: Znaleziono temat <strong>{extractedTopic.mainTopic}</strong>
          </p>

          <LearningMaterials
            materials={suggestedMaterials}
            keywords={extractedTopic.keywords}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleToggleCompletion}
          className={`flex-1 rounded-lg py-2 font-medium transition-all duration-200 ${
            localEvent.completed
              ? "bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-md"
              : "bg-green-600 text-white hover:bg-green-700 hover:shadow-md"
          }`}
        >
          {localEvent.completed ? "↩️ Oznacz jako niezrobione" : "✅ Oznacz jako gotowe"}
        </button>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex-1 bg-zinc-100 text-zinc-700 rounded-lg py-2 font-medium transition-all duration-200 hover:bg-zinc-200 hover:shadow-md"
        >
          ✏️ Edytuj
        </button>
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        eventTitle={localEvent.title}
        eventDescription={localEvent.description}
      />
    </div>
  );
}
