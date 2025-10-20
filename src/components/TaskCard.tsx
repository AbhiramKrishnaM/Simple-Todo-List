import * as React from "react";
import { X, GripVertical } from "lucide-react";
import { motion } from "motion/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: checked }); // Disable drag for completed tasks

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-input px-4 py-3 shadow-sm bg-background",
        isDragging && "opacity-50 shadow-lg z-50",
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
        scale: isDragging ? 1 : 1.02,
        transition: { duration: 0.1 },
      }}
    >
      {/* Drag handle - only show for uncompleted tasks */}
      {!checked && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="size-5" />
        </div>
      )}

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
