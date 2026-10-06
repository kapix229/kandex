import type { JournalCredentials, JournalConnectionResult } from "@/src/integrations/types";

/**
 * Contract for ordinary EduVULCAN credentials.
 * Browser automation/scraping is intentionally not implemented here.
 */
export async function loginWithCredentials(
  _credentials: JournalCredentials,
): Promise<JournalConnectionResult> {
  return {
    success: false,
    error:
      "Logowanie EduVULCAN loginem i hasłem nie jest jeszcze obsługiwane przez oficjalny interfejs. Nie wykonujemy nieoficjalnego logowania do portalu.",
  };
}
