import type { JournalProvider } from "@/src/types/journal";
import type { JournalAdapter } from "@/src/integrations/types";
import { eduvulcanAdapter } from "@/src/integrations/eduvulcan/adapter";
import { librusAdapter } from "@/src/integrations/librus/adapter";

const adapters: Record<JournalProvider, JournalAdapter> = {
  eduvulcan: eduvulcanAdapter,
  librus: librusAdapter,
};

export function getJournalAdapter(provider: JournalProvider): JournalAdapter {
  return adapters[provider];
}