// Export the main service
export { taskService, default as TaskService } from "./TaskService";

// Export types
export type {
  ApiResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  TasksResponse,
  HealthResponse,
} from "./types";

// Export API client if needed for direct use
export { apiClient } from "./config";
