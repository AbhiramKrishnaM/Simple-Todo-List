import apiClient from "./config";
import type { RowColors } from "@/types";

export interface Settings {
  numberOfTasks: number;
  showRemainingTodoCount?: boolean;
  rowColors?: RowColors;
}

export interface SettingsResponse {
  success: boolean;
  data: Settings;
  message?: string;
}

/**
 * SettingsService - Handles all settings-related API operations
 */
class SettingsService {
  private readonly endpoint = "/settings";

  /**
   * Fetch settings from the server
   */
  async getSettings(): Promise<Settings> {
    try {
      const response = await apiClient.get<SettingsResponse>(this.endpoint);
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      throw new Error("Failed to fetch settings from server");
    }
  }

  /**
   * Update settings on the server
   */
  async updateSettings(settings: Settings): Promise<Settings> {
    try {
      const response = await apiClient.put<SettingsResponse>(
        this.endpoint,
        settings
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw new Error("Failed to update settings on server");
    }
  }
}

// Export a singleton instance
export const settingsService = new SettingsService();
export default SettingsService;
