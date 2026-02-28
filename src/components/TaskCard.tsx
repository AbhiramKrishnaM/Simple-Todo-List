import * as React from "react";
import { X, GripVertical } from "lucide-react";
import { motion } from "motion/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useTasksStore } from "@/store/tasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TaskCardProps = {
  task: Task;
  checked?: boolean;
  onToggle?: (taskId: string) => void;
  onRemove?: (taskId: string) => void;
  className?: string;
  maxTasks?: number;
};

export default function TaskCard({
  task,
  checked,
  onToggle,
  onRemove,
  className,
  maxTasks = 7,
}: TaskCardProps) {
  const [isChecked, setIsChecked] = React.useState<boolean>(Boolean(checked));

  const assignPriority = useTasksStore((state) => state.assignPriority);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: checked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  React.useEffect(() => {
    if (typeof checked === "boolean") setIsChecked(checked);
  }, [checked]);

  async function handleCheckedChange(next: boolean) {
    setIsChecked(next);
    onToggle?.(task.id);
  }

  function handleRemove() {
    onRemove?.(task.id);
  }

  async function handlePriorityChange(newPriority: string) {
    const priority = parseInt(newPriority, 10);
    if (isNaN(priority) || priority < 1 || priority > maxTasks) {
      return;
    }

    try {
      await assignPriority(task.id, priority);
    } catch (error) {
      console.error("Failed to assign priority:", error);
    }
  }

  const priorityOptions = React.useMemo(() => {
    return Array.from({ length: maxTasks }, (_, i) => i + 1);
  }, [maxTasks]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col w-full rounded-2xl border border-input px-4 py-3 shadow-sm bg-background",
        isDragging && "opacity-0",
        className,
      )}
      role="group"
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0 : 1, y: 0, scale: 1 }}
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
      <div className="flex w-full items-center gap-3">
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

        {!checked && (
          <Select
            value={task.priority.toString()}
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="w-16 h-8 text-xs font-semibold">
              <SelectValue placeholder="#" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((priority) => (
                <SelectItem
                  key={priority}
                  value={priority.toString()}
                  className="text-xs"
                >
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <motion.span
          className={cn(
            "flex-1 text-[15px] font-medium text-gray-700",
            isChecked && "line-through text-gray-400",
          )}
          animate={{
            opacity: isChecked ? 0.7 : 1,
            color: isChecked ? "#9ca3af" : "#374151",
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {task.title}
        </motion.span>

        {/* Remove button - always visible */}
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
      </div>
    </motion.div>
  );
}
