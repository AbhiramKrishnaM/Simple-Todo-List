import * as React from "react";
import { Plus } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

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

  function handleSubmit(event?: React.FormEvent) {
    if (event) event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      priority: 1, // This value will be replaced by backend auto-assignment
      timestamp: Date.now(),
      completed: false,
      meta: {},
    };

    onAdd?.(task);
    setValue("");
  }

  return (
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
  );
}
