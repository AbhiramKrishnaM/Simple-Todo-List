import * as React from "react";
import { motion } from "motion/react";
import { useSettingsStore } from "../store/settings";

function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const isLoading = useSettingsStore((s) => s.isLoading);

  const [numberOfTasks, setNumberOfTasks] = React.useState(7);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );

  // Load settings on mount
  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update local state when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setNumberOfTasks(settings.numberOfTasks);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      await updateSettings({ numberOfTasks });
      setSuccessMessage("Settings saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleIncrement = () => {
    if (numberOfTasks < 100) {
      setNumberOfTasks(numberOfTasks + 1);
    }
  };

  const handleDecrement = () => {
    if (numberOfTasks > 1) {
      setNumberOfTasks(numberOfTasks - 1);
    }
  };

  return (
    <motion.div
      className="flex flex-1 flex-col items-center gap-6 px-6 py-8 overflow-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

        {/* Task Limit Configuration Section */}
        <div className="space-y-6">
          <motion.div
            className="p-6 rounded-lg border border-border bg-card"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Task Limit Configuration
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Set the maximum number of tasks you can work on at a time
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Number Input Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleDecrement}
                    disabled={numberOfTasks <= 1 || isSaving}
                    className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold text-xl transition-colors"
                  >
                    -
                  </button>

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-5xl font-bold text-foreground">
                      {numberOfTasks}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      tasks at a time
                    </span>
                  </div>

                  <button
                    onClick={handleIncrement}
                    disabled={numberOfTasks >= 100 || isSaving}
                    className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>

                {/* Error/Success Messages */}
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                    {successMessage}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default SettingsPage;
