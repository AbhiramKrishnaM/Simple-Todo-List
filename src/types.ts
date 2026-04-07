export type Priority = "very_urgent" | "urgent" | "medium" | "low" | "queue";

export interface TaskMeta {
  priority?: Priority;
  /** Position within the priority column for display order. */
  position?: number;
  /** Notes or additional details for the task */
  notes?: string;
  [key: string]: unknown;
}

export interface Task {
  id: string;
  title: string;
  timestamp: number;
  completed: boolean;
  display_order?: number;
  meta?: TaskMeta;
}

export type RowColorTheme = "red" | "yellow" | "blue" | "green" | "purple";

export interface RowColors {
  very_urgent: RowColorTheme;
  urgent: RowColorTheme;
  medium: RowColorTheme;
  low: RowColorTheme;
  queue: RowColorTheme;
}
