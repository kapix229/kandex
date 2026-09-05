"use client";

import { useState } from "react";

export type EditModalFormData = {
  title: string;
  description: string;
};

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: EditModalFormData) => void;
  eventTitle: string;
  eventDescription?: string;
}

export default function EditModal({
  isOpen,
  onClose,
  onSave,
  eventTitle,
  eventDescription,
}: EditModalProps) {
  const [formData, setFormData] = useState<EditModalFormData>({
    title: eventTitle,
    description: eventDescription || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-xl border border-zinc-200 animate-slide-in-down">
        <h2 className="text-2xl font-bold text-zinc-800 mb-4">Edytuj zdarzenie</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Tytuł
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Wpisz tytuł zdarzenia"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Opis
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
              placeholder="Wpisz szczegółowy opis"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-semibold transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
            >
              Zapisz zmiany
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-200 text-zinc-700 rounded-lg py-2 font-semibold transition-all duration-200 hover:bg-zinc-300"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
