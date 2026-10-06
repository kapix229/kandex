import type { JournalAdapter, JournalConnectionResult, JournalCredentials } from "@/src/integrations/types";

export const librusAdapter: JournalAdapter = {
  provider: "librus",
  async login(credentials: JournalCredentials): Promise<JournalConnectionResult> {
    void credentials;
    return { success: false, error: "Integracja Librus nie jest jeszcze dostępna." };
  },
  async getSnapshot() {
    throw new Error("Integracja Librus nie jest jeszcze dostępna.");
  },
};
