import type { JournalAdapter } from "@/src/integrations/types";

export const librusAdapter: JournalAdapter = {
  provider: "librus",
  async getSnapshot() {
    throw new Error("Integracja Librus nie jest jeszcze dostępna.");
  },
};