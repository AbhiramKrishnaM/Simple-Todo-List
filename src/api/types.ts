import type { Task } from "@/types";

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// Request types
export interface CreateTaskRequest {
  title: string;
  completed?: boolean;
  meta?: Record<string, unknown>;
}

export interface UpdateTaskRequest {
  title?: string;
  completed?: boolean;
  meta?: Record<string, unknown>;
}

// List API returns data as object keyed by index
export interface TaskListItem {
  id: string;
  title: string;
  completed: boolean;
  meta?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  display_order?: number;
  priority?: string;
  position?: number;
}

export type TasksListData = Record<string, TaskListItem>;

// Response types
export type TaskResponse = ApiResponse<Task>;
export type TasksResponse = ApiResponse<Task[] | TasksListData>;
export type HealthResponse = {
  status: string;
  message: string;
  database: string;
};
