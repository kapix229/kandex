// Vulcan Event types for calendar integration
export interface VulcanEvent {
  id: string;
  title: string;
  description?: string;
  type: "assignment" | "test" | "exam" | "grade" | "note" | "event";
  subject?: string;
  date: Date;
  dueDate?: Date;
  completed: boolean;
  priority: "low" | "normal" | "high";
  color?: string;
}

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: VulcanEvent[];
}

export interface MonthView {
  year: number;
  month: number;
  days: CalendarDay[];
}

// Vulcan Grade types
export interface VulcanGrade {
  id: string;
  subject: string;
  title: string;
  value: number;   // 1-6 in Polish system
  weight: number;  // 1, 2, 3 - column weight from Vulcan
  teacher: string;
  date: Date;
  comment?: string;
}

export interface VulcanGradeSummary {
  subject: string;
  average: number;
  count: number;
  grades: VulcanGrade[];
}
