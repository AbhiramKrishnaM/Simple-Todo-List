import * as React from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { useTasksStore } from "@/store/tasks";

type AddTaskProps = {
  onAdd?: (task: Task) => void;
  placeholder?: string;
  className?: string;
};

export default function AddTask({
  onAdd,
  placeholder = "Add new task",
  className,
}: AddTaskProps) {
  const [value, setValue] = React.useState("");
  const tasks = useTasksStore((s) => s.tasks);
  const remainingTasks = React.useMemo(
    () => tasks.filter((t) => !t.completed).length,
    [tasks]
  );
  const [showLimitAlert, setShowLimitAlert] = React.useState(false);

  function handleSubmit(event?: React.FormEvent) {
    if (event) event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    if (remainingTasks >= 7) {
      setShowLimitAlert(true);
      window.setTimeout(() => setShowLimitAlert(false), 3000);
      return;
    }

    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      priority: 1,
      timestamp: Date.now(),
      completed: false,
      meta: {},
    };

    onAdd?.(task);
    setValue("");
  }

  return (
    <>
      <AnimatePresence>
        {showLimitAlert && (
          <motion.div
            className="fixed top-4 right-4 z-50 w-[min(92vw,380px)]"
            initial={{ opacity: 0, y: -10, x: 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10, x: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Alert variant="destructive">
              <AlertDescription>
                You can only have up to 7 active tickets. Complete some first,
                then add new ones.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSubmit}
        className={cn("flex items-center gap-3 w-full max-w-xl", className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={
            // bottom-border only styling to match the UI reference
            "rounded-none border-0 border-b border-input px-2 focus-visible:ring-0 focus-visible:border-ring"
          }
          aria-label={placeholder}
        />
        <motion.div
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.1 }}
        >
          <Button
            type="submit"
            size="icon-sm"
            variant="outline"
            aria-label="Add task"
            className="cursor-pointer"
          >
            <Plus />
          </Button>
        </motion.div>
      </motion.form>
    </>
  );
}
