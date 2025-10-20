import apiClient from "./config";
import type { Task } from "@/types";
import type {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  TasksResponse,
  HealthResponse,
} from "./types";

/**
 * TaskService - Handles all task-related API operations
 */
class TaskService {
  private readonly endpoint = "/tasks";

  /**
   * Fetch all tasks from the server
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get<TasksResponse>(this.endpoint);
      return response.data.data || [];
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      throw new Error("Failed to fetch tasks from server");
    }
  }

  /**
   * Fetch a single task by ID
   */
  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await apiClient.get<TaskResponse>(
        `${this.endpoint}/${id}`
      );
      if (!response.data.data) {
        throw new Error("Task not found");
      }
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch task ${id}:`, error);
      throw new Error("Failed to fetch task from server");
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    try {
      const response = await apiClient.post<TaskResponse>(
        this.endpoint,
        taskData
      );
      if (!response.data.data) {
        throw new Error("Failed to create task");
      }
      return response.data.data;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw new Error("Failed to create task on server");
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    try {
      const response = await apiClient.put<TaskResponse>(
        `${this.endpoint}/${id}`,
        updates
      );
      if (!response.data.data) {
        throw new Error("Failed to update task");
      }
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update task ${id}:`, error);
      throw new Error("Failed to update task on server");
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTask(id: string): Promise<Task> {
    try {
      const response = await apiClient.patch<TaskResponse>(
        `${this.endpoint}/${id}/toggle`
      );
      if (!response.data.data) {
        throw new Error("Failed to toggle task");
      }
      return response.data.data;
    } catch (error) {
      console.error(`Failed to toggle task ${id}:`, error);
      throw new Error("Failed to toggle task on server");
    }
  }

  /**
   * Delete a task by ID
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.endpoint}/${id}`);
    } catch (error) {
      console.error(`Failed to delete task ${id}:`, error);
      throw new Error("Failed to delete task from server");
    }
  }

  /**
   * Delete all tasks
   */
  async deleteAllTasks(): Promise<void> {
    try {
      await apiClient.delete(this.endpoint);
    } catch (error) {
      console.error("Failed to delete all tasks:", error);
      throw new Error("Failed to delete all tasks from server");
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get<HealthResponse>("/health");
      return response.data;
    } catch (error) {
      console.error("Health check failed:", error);
      throw new Error("Server health check failed");
    }
  }

  /**
   * Bulk update task order
   */
  async reorderTasks(
    tasks: { id: string; display_order: number }[]
  ): Promise<void> {
    try {
      await apiClient.patch(`${this.endpoint}/bulk-reorder`, { tasks });
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      throw new Error("Failed to reorder tasks on server");
    }
  }
}

// Export a singleton instance
export const taskService = new TaskService();
export default TaskService;
