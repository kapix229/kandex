"use client";

import { useState } from "react";

interface SyncButtonProps {
  onSync: () => Promise<void>;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function SyncButton({
  onSync,
  label = "Odśwież dane",
  disabled = false,
  className = "",
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleClick = async () => {
    if (isSyncing || disabled) return;
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSyncing || disabled}
      className={`
        flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200
        ${isSyncing || disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:bg-white/[0.06] hover:border-[var(--accent)]"}
        bg-[var(--surface-muted)] border-[var(--border-strong)] text-[var(--text)]
        ${className}
      `}
      title="Odśwież dane z dziennika"
    >
      <svg
        className={`h-4 w-4 transition-transform duration-300 ${isSyncing ? "animate-spin" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
      <span>{isSyncing ? "Synchronizuję..." : label}</span>
    </button>
  );
}