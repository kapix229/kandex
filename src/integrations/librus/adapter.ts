import type { JournalAdapter, JournalConnectionResult } from "@/src/integrations/types";

export const librusAdapter: JournalAdapter = {
  provider: "librus",
  async login(): Promise<JournalConnectionResult> {
    return { success: false, error: "Integracja Librus nie jest jeszcze dostępna." };
  },
  async getSnapshot() {
    throw new Error("Integracja Librus nie jest jeszcze dostępna.");
  },
};
