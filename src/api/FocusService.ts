import apiClient from "./config";
import type { FocusSession, Task } from "@/types";

interface FocusSessionResponse {
  success: boolean;
  data: FocusSession | null;
  message?: string;
}

interface UpdateFocusDurationResponse {
  success: boolean;
  data: Task;
  message?: string;
}

/**
 * FocusService - Handles all focus session API operations
 */
class FocusService {
  private readonly endpoint = "/focus";

  /**
   * Get the currently active focus session
   */
  async getActiveSession(): Promise<FocusSession | null> {
    try {
      const response =
        await apiClient.get<FocusSessionResponse>(`${this.endpoint}/active`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch active session:", error);
      throw new Error("Failed to fetch active focus session");
    }
  }

  /**
   * Start a focus session for a task
   */
  async startFocus(taskId: string): Promise<FocusSession> {
    try {
      const response = await apiClient.post<FocusSessionResponse>(
        `${this.endpoint}/${taskId}/start`
      );
      if (!response.data.data) {
        throw new Error("Failed to start focus session");
      }
      return response.data.data;
    } catch (error) {
      console.error(`Failed to start focus for task ${taskId}:`, error);
      throw new Error("Failed to start focus session");
    }
  }

  /**
   * Pause the active focus session
   */
  async pauseFocus(taskId: string): Promise<FocusSession> {
    try {
      const response = await apiClient.post<FocusSessionResponse>(
        `${this.endpoint}/${taskId}/pause`
      );
      if (!response.data.data) {
        throw new Error("Failed to pause focus session");
      }
      return response.data.data;
    } catch (error) {
      console.error(`Failed to pause focus for task ${taskId}:`, error);
      throw new Error("Failed to pause focus session");
    }
  }

  /**
   * Resume a paused focus session
   */
  async resumeFocus(taskId: string): Promise<FocusSession> {
    try {
      const response = await apiClient.post<FocusSessionResponse>(
        `${this.endpoint}/${taskId}/resume`
      );
      if (!response.data.data) {
        throw new Error("Failed to resume focus session");
      }
      return response.data.data;
    } catch (error) {
      console.error(`Failed to resume focus for task ${taskId}:`, error);
      throw new Error("Failed to resume focus session");
    }
  }

  /**
   * Stop the active focus session
   */
  async stopFocus(taskId: string): Promise<FocusSession> {
    try {
      const response = await apiClient.post<FocusSessionResponse>(
        `${this.endpoint}/${taskId}/stop`
      );
      if (!response.data.data) {
        throw new Error("Failed to stop focus session");
      }
      return response.data.data;
    } catch (error) {
      console.error(`Failed to stop focus for task ${taskId}:`, error);
      throw new Error("Failed to stop focus session");
    }
  }

  /**
   * Update the focus duration for a task
   */
  async updateFocusDuration(
    taskId: string,
    duration: number | null
  ): Promise<Task> {
    try {
      const response = await apiClient.patch<UpdateFocusDurationResponse>(
        `/tasks/${taskId}/focus-duration`,
        { focus_duration: duration }
      );
      if (!response.data.data) {
        throw new Error("Failed to update focus duration");
      }
      return response.data.data;
    } catch (error) {
      console.error(
        `Failed to update focus duration for task ${taskId}:`,
        error
      );
      throw new Error("Failed to update focus duration");
    }
  }
}

// Export a singleton instance
export const focusService = new FocusService();
export default FocusService;
