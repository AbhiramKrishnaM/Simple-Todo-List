export type Priority = "very_urgent" | "urgent" | "medium" | "low";

export interface TaskMeta {
  priority?: Priority;
  /** Position within the priority row (1–5) for display order in that row. */
  position?: number;
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

export type RowColorTheme = "red" | "yellow" | "blue" | "green";

export interface RowColors {
  very_urgent: RowColorTheme;
  urgent: RowColorTheme;
  medium: RowColorTheme;
  low: RowColorTheme;
}
