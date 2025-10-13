import * as React from "react";
import AddTask from "./components/AddTask";
import TaskCard from "./components/TaskCard";
import Quote from "./components/Quote";
import type { Task } from "./types";
import { useTasksStore } from "./store/tasks";
import { motion, AnimatePresence } from "motion/react";
import ModeToggle from "@/components/ModeToggle";

function App() {
  const tasks = useTasksStore((s) => s.tasks);
  const fetchTasks = useTasksStore((s) => s.fetchTasks);
  const createTask = useTasksStore((s) => s.createTask);
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const scheduleAutoDelete = useTasksStore((s) => s.scheduleAutoDelete);
  const completedTaskTimers = useTasksStore((s) => s.completedTaskTimers);
  const error = useTasksStore((s) => s.error);

  // Fetch tasks on mount
  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Schedule auto-deletion timers for existing completed tasks
  React.useEffect(() => {
    const completedTasks = tasks.filter((task) => task.completed);
    completedTasks.forEach((task) => {
      // Only schedule if not already scheduled
      if (!completedTaskTimers.has(task.id)) {
        console.log(
          `⏰ Scheduling auto-deletion for completed task: "${task.title}"`
        );
        scheduleAutoDelete(task.id);
      }
    });
  }, [tasks, completedTaskTimers, scheduleAutoDelete]);

  // Sort tasks locally to avoid infinite re-renders
  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return a.timestamp - b.timestamp;
    });
  }, [tasks]);

  const hasTasks = tasks.length > 0;
  const remainingTasks = tasks.filter((task) => !task.completed).length;

  async function handleAdd(task: Task) {
    try {
      await createTask({
        title: task.title,
        priority: task.priority,
        completed: task.completed,
        meta: task.meta,
      });
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleTask(id);
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeTask(id);
    } catch (error) {
      console.error("Failed to remove task:", error);
    }
  }

  return (
    <>
      <motion.div
        className={[
          "flex h-screen flex-col items-center gap-4 px-6 py-10",
          hasTasks ? "justify-start" : "justify-center",
        ].join(" ")}
        layout
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {/* Global top-right controls */}
        <div className="fixed right-4 top-4 z-50">
          <ModeToggle />
        </div>
        {/* Header + input; behaves like a fixed header once tasks exist */}
        <div className="w-full max-w-xl">
          <div className="mb-2 text-2xl font-bold text-foreground">
            Your To Do
          </div>
          <AddTask onAdd={handleAdd} />
          {error && (
            <div className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {hasTasks && (
          <motion.div
            className="w-full max-w-xl flex-1 overflow-y-auto px-2 pt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {sortedTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    checked={t.completed}
                    onToggle={(id) => handleToggle(id)}
                    onRemove={(id) => handleRemove(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Remaining todos counter and motivational quote */}
        <div className="mt-6 w-full max-w-xl">
          <div className="text-lg font-semibold text-foreground mb-2">
            Your remaining todos: {remainingTasks}
          </div>
          <Quote />
        </div>
      </motion.div>
    </>
  );
}

export default App;
