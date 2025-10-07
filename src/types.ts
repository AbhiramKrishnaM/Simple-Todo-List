export type TaskPriority = number;

export interface TaskMeta {
  [key: string]: unknown;
}

export interface Task {
  title: string;
  timestamp: number;
  priority: TaskPriority;
  meta?: TaskMeta;
}
