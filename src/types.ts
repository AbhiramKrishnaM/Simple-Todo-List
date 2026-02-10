export type TaskPriority = number;

export interface TaskMeta {
  [key: string]: unknown;
}

export interface Task {
  id: string;
  title: string;
  timestamp: number;
  priority: TaskPriority;
  completed: boolean;
  display_order?: number;
  meta?: TaskMeta;
  focus_duration?: number; // in minutes
}

export interface FocusSession {
  id: number;
  task_id: string;
  started_at: string;
  paused_at: string | null;
  stopped_at: string | null;
  elapsed_seconds: number;
  is_active: boolean;
  created_at: string;
  // Joined fields from task
  title?: string;
  focus_duration?: number;
}
