import type { JournalProvider, JournalSnapshot } from "@/src/types/journal";

export type JournalAdapter = {
  provider: JournalProvider;
  getSnapshot(): Promise<JournalSnapshot>;
};