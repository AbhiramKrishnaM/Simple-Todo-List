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
  priority?: number;
  completed?: boolean;
  meta?: Record<string, unknown>;
}

export interface UpdateTaskRequest {
  title?: string;
  priority?: number;
  completed?: boolean;
  meta?: Record<string, unknown>;
}

// Response types
export type TaskResponse = ApiResponse<Task>;
export type TasksResponse = ApiResponse<Task[]>;
export type HealthResponse = {
  status: string;
  message: string;
  database: string;
};
