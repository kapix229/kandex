"use client";

import { useSyncExternalStore } from "react";

export type JournalProvider = "eduvulcan" | "librus";

const STORAGE_KEY = "kandex-journal-provider";
const CHANGE_EVENT = "kandex-journal-provider-change";

function getSnapshot(): JournalProvider | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "eduvulcan" || value === "librus" ? value : null;
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function setJournalProvider(provider: JournalProvider) {
  window.localStorage.setItem(STORAGE_KEY, provider);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useJournalProvider() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
