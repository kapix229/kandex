import type { JournalProvider, JournalSnapshot } from "@/src/types/journal";

export type JournalCredentials = {
  username: string;
  password: string;
};

export type JournalConnectionResult = {
  success: boolean;
  sessionId?: string;
  account?: {
    fullName: string;
    studentId?: number;
  };
  error?: string;
};

export type JournalAdapter = {
  provider: JournalProvider;
  login(credentials: JournalCredentials): Promise<JournalConnectionResult>;
  getSnapshot(): Promise<JournalSnapshot>;
};