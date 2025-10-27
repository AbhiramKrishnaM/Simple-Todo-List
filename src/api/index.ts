// Export the main service
export { taskService, default as TaskService } from "./TaskService";
export { settingsService, default as SettingsService } from "./SettingsService";

// Export types
export type {
  ApiResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  TasksResponse,
  HealthResponse,
} from "./types";
export type { Settings, SettingsResponse } from "./SettingsService";

// Export API client if needed for direct use
export { apiClient } from "./config";
