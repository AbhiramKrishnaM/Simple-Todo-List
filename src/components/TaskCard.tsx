import * as React from "react";
import { X, Clock } from "lucide-react";
import { motion } from "motion/react";

import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useTasksStore } from "@/store/tasks";

type TaskCardProps = {
  task: Task;
  checked?: boolean;
  onToggle?: (taskId: string) => void;
  onRemove?: (taskId: string) => void;
  className?: string;
};

export default function TaskCard({
  task,
  checked,
  onToggle,
  onRemove,
  className,
}: TaskCardProps) {
  const [isChecked, setIsChecked] = React.useState<boolean>(Boolean(checked));
  const completedTaskTimers = useTasksStore((s) => s.completedTaskTimers);

  // Check if this task has an auto-deletion timer scheduled
  const hasAutoDeleteTimer = completedTaskTimers.has(task.id);

  React.useEffect(() => {
    if (typeof checked === "boolean") setIsChecked(checked);
  }, [checked]);

  function handleCheckedChange(next: boolean) {
    setIsChecked(next);
    onToggle?.(task.id);
  }

  function handleRemove() {
    onRemove?.(task.id);
  }

  return (
    <motion.div
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-input px-4 py-3 shadow-sm",
        className
      )}
      role="group"
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: 300,
        scale: 0.8,
        transition: { duration: 0.2, ease: "easeIn" },
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        layout: { duration: 0.2 },
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.1 },
      }}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={(v) => handleCheckedChange(Boolean(v))}
        aria-label={isChecked ? "Mark task as not done" : "Mark task as done"}
        className="size-5 rounded-md"
      />

      <motion.span
        className={cn(
          "flex-1 text-[15px] font-medium text-gray-700",
          isChecked && "line-through text-gray-400"
        )}
        animate={{
          opacity: isChecked ? 0.7 : 1,
          color: isChecked ? "#9ca3af" : "#374151",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {task.title}
      </motion.span>

      {/* Auto-deletion timer indicator */}
      {isChecked && hasAutoDeleteTimer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1 text-xs text-orange-500"
          title="Will be auto-deleted soon"
        >
          <Clock className="size-3" />
          <span>Auto-delete</span>
        </motion.div>
      )}

      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Remove task"
        onClick={handleRemove}
        className="text-gray-500 hover:text-gray-900"
      >
        <X className="size-4" />
      </Button>
    </motion.div>
  );
}
