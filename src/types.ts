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
  meta?: TaskMeta;
}
