export type JournalProvider = "eduvulcan" | "librus";

export type Student = {
  id: string;
  fullName: string;
  className?: string;
  schoolName?: string;
};

export type Grade = {
  id: string;
  subject: string;
  value: number;
  date: string;
  weight: number;
  teacher?: string;
  type?: string;
  title?: string;
};

export type Subject = {
  id: string;
  name: string;
  average: number;
  gradeCount: number;
};

export type ScheduleItem = {
  id: string;
  subject: string;
  teacher?: string;
  room?: string;
  startsAt: string;
  endsAt?: string;
};

export type Assignment = {
  id: string;
  title: string;
  subject?: string;
  dueDate?: string;
  completed: boolean;
  priority?: "low" | "normal" | "high";
};

export type JournalSnapshot = {
  provider: JournalProvider;
  importedAt: string;
  student: Student | null;
  grades: Grade[];
  subjects: Subject[];
  schedule: ScheduleItem[];
  assignments: Assignment[];
};

export type JournalConnection = {
  provider: JournalProvider;
  connected: boolean;
  accountName?: string;
  student?: Student | null;
};
