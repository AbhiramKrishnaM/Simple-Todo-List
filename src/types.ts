export interface TaskMeta {
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
