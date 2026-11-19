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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="workspace-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[var(--border)] animate-slide-in-down">
        <h2 className="text-2xl font-bold text-[var(--text)] mb-4">Edytuj zdarzenie</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              Tytuł
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[#0a0e1a] text-[var(--text)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition"
              placeholder="Wpisz tytuł zdarzenia"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              Opis
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[#0a0e1a] text-[var(--text)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition resize-none h-24"
              placeholder="Wpisz szczegółowy opis"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#00cfe8] text-white py-2.5 font-bold transition-all duration-200 hover:brightness-110 hover:shadow-[0_8px_24px_rgba(124,92,255,0.3)]"
            >
              Zapisz zmiany
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] text-[var(--text)] py-2.5 font-bold transition-all duration-200 hover:bg-white/[0.08]"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
