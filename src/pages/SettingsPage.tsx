import * as React from "react";
import { motion } from "motion/react";
import { useTasksStore } from "../store/tasks";

function SettingsPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const removeTask = useTasksStore((s) => s.removeTask);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleClearCompleted = async () => {
    setIsDeleting(true);
    try {
      const completedTasks = tasks.filter((t) => t.completed);
      await Promise.all(completedTasks.map((t) => removeTask(t.id)));
    } catch (error) {
      console.error("Failed to clear completed tasks:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all tasks? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await Promise.all(tasks.map((t) => removeTask(t.id)));
    } catch (error) {
      console.error("Failed to clear all tasks:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <motion.div
      className="flex flex-1 flex-col items-center gap-6 px-6 py-8 overflow-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

        {/* Task Management Section */}
        <div className="space-y-6">
          <motion.div
            className="p-6 rounded-lg border border-border bg-card"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Task Management
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your tasks and data
            </p>

            <div className="space-y-3">
              <button
                onClick={handleClearCompleted}
                disabled={completedCount === 0 || isDeleting}
                className="w-full px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-700 disabled:bg-muted disabled:text-muted-foreground text-white font-medium transition-colors"
              >
                Clear Completed Tasks ({completedCount})
              </button>

              <button
                onClick={handleClearAll}
                disabled={tasks.length === 0 || isDeleting}
                className="w-full px-4 py-2 rounded-md bg-destructive hover:bg-destructive/90 disabled:bg-muted disabled:text-muted-foreground text-destructive-foreground font-medium transition-colors"
              >
                Delete All Tasks
              </button>
            </div>
          </motion.div>

          {/* App Info Section */}
          <motion.div
            className="p-6 rounded-lg border border-border bg-card"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              About
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Version:</span>{" "}
                1.0.0
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Total Tasks:
                </span>{" "}
                {tasks.length}
              </p>
              <p>
                <span className="font-medium text-foreground">Completed:</span>{" "}
                {tasks.filter((t) => t.completed).length}
              </p>
              <p>
                <span className="font-medium text-foreground">Pending:</span>{" "}
                {tasks.filter((t) => !t.completed).length}
              </p>
            </div>
          </motion.div>

          {/* Preferences Section */}
          <motion.div
            className="p-6 rounded-lg border border-border bg-card"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Preferences
            </h3>
            <p className="text-sm text-muted-foreground">
              Theme settings can be adjusted using the toggle in the top
              navigation bar.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default SettingsPage;
