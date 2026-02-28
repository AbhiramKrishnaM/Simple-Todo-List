import * as React from "react";
import { motion } from "motion/react";
import { useSettingsStore } from "../store/settings";
import type { RowColors, RowColorTheme } from "../types";
import {
  ROW_COLOR_OPTIONS,
  DEFAULT_ROW_COLORS,
} from "../lib/priorityColors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const ROW_LABELS: Record<keyof RowColors, string> = {
  very_urgent: "Very urgent row",
  urgent: "Urgent row",
  medium: "Medium row",
  low: "Low row",
};

function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const isLoading = useSettingsStore((s) => s.isLoading);

  const [numberOfTasks, setNumberOfTasks] = React.useState(7);
  const [showRemainingTodoCount, setShowRemainingTodoCount] =
    React.useState(true);
  const [rowColors, setRowColors] = React.useState<RowColors>(DEFAULT_ROW_COLORS);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  React.useEffect(() => {
    if (settings) {
      setNumberOfTasks(settings.numberOfTasks);
      setShowRemainingTodoCount(settings.showRemainingTodoCount ?? true);
      if (settings.rowColors) {
        setRowColors({
          very_urgent: settings.rowColors.very_urgent ?? DEFAULT_ROW_COLORS.very_urgent,
          urgent: settings.rowColors.urgent ?? DEFAULT_ROW_COLORS.urgent,
          medium: settings.rowColors.medium ?? DEFAULT_ROW_COLORS.medium,
          low: settings.rowColors.low ?? DEFAULT_ROW_COLORS.low,
        });
      }
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      await updateSettings({
        numberOfTasks,
        showRemainingTodoCount,
        rowColors,
      });
      setSuccessMessage("Settings saved successfully!");

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

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground">
                    Priority row colors
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Choose which color theme to use for each priority row on the
                    list page.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(Object.keys(ROW_LABELS) as (keyof RowColors)[]).map(
                      (key) => (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-3"
                        >
                          <label className="text-sm font-medium text-foreground shrink-0">
                            {ROW_LABELS[key]}
                          </label>
                          <Select
                            value={rowColors[key]}
                            onValueChange={(v) =>
                              setRowColors((prev) => ({
                                ...prev,
                                [key]: v as RowColorTheme,
                              }))
                            }
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROW_COLOR_OPTIONS.map((opt) => (
                                <SelectItem
                                  key={opt.value}
                                  value={opt.value}
                                >
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <label
                    htmlFor="show-remaining"
                    className="text-sm font-medium text-foreground"
                  >
                    Show Remaining Todo Count
                  </label>
                  <button
                    id="show-remaining"
                    role="switch"
                    aria-checked={showRemainingTodoCount}
                    onClick={() =>
                      setShowRemainingTodoCount((prev) => !prev)
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                      showRemainingTodoCount ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        showRemainingTodoCount
                          ? "translate-x-5"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

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
