import { create } from "zustand";
import { settingsService, type Settings } from "@/api/SettingsService";

type SettingsState = {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;

  // Fetch settings from API
  fetchSettings: () => Promise<void>;

  // Update settings via API
  updateSettings: (settings: Settings) => Promise<void>;

  // Get number of tasks limit
  getTaskLimit: () => number;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingsService.getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch settings";
      set({ error: errorMessage, isLoading: false });
      console.error("Error fetching settings:", error);
    }
  },

  updateSettings: async (newSettings) => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingsService.updateSettings(newSettings);
      set({ settings, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update settings";
      set({ error: errorMessage, isLoading: false });
      console.error("Error updating settings:", error);
      throw error;
    }
  },

  getTaskLimit: () => {
    const settings = get().settings;
    return settings?.numberOfTasks ?? 7; // Default to 7 if not loaded
  },
}));
