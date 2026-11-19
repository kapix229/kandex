"use client";

import { useState } from "react";
import AIAssistant from "@/components/AIAssistant";

export default function AIMobileLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden">
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Asystent AI">
          <div className="flex h-[min(82dvh,720px)] w-full max-w-lg flex-col">
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-lg" aria-label="Zamknij asystenta">
                Zamknij ✕
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <AIAssistant />
            </div>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[var(--accent-secondary)]/40 bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[#211e24] shadow-[0_12px_36px_rgba(0,0,0,0.4)] transition hover:brightness-110" aria-label="Otwórz asystenta AI">
        <span aria-hidden="true">✦</span>
        Asystent AI
      </button>
    </div>
  );
}
