import * as React from "react";
import { X, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
  onPriorityChange?: (
    taskId: string,
    priority: "very_urgent" | "urgent" | "medium" | "low",
  ) => void;
  className?: string;
  cardClassName?: string;
  priorityIndicatorClass?: string;
};

const PRIORITY_LABELS: Record<
  "very_urgent" | "urgent" | "medium" | "low",
  string
> = {
  very_urgent: "Very urgent",
  urgent: "Urgent",
  medium: "Medium",
  low: "Low",
};

function getTaskPriority(
  task: Task,
): "very_urgent" | "urgent" | "medium" | "low" {
  const p = task.meta?.priority;
  if (p === "very_urgent" || p === "urgent" || p === "medium" || p === "low")
    return p;
  return "medium";
}

export default function TaskCard({
  task,
  checked,
  onToggle,
  onRemove,
  onPriorityChange,
  className,
  cardClassName,
  priorityIndicatorClass,
}: TaskCardProps) {
  const [isChecked, setIsChecked] = React.useState<boolean>(Boolean(checked));

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

  const priority = getTaskPriority(task);
  const isCompletedState = Boolean(checked);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col w-full min-w-[180px] max-w-[260px] rounded-2xl px-4 py-3 min-h-[72px]",
        !isCompletedState &&
          "bg-background border border-input shadow-md",
        isCompletedState && "bg-gray-100 border-0 shadow-none opacity-90",
        cardClassName,
        isDragging && "opacity-0",
        className,
      )}
      role="group"
      aria-disabled={isCompletedState}
    >
      <div className="flex w-full items-center gap-2">
        {!checked && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing shrink-0 text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="size-5" />
          </div>
        )}

        {priorityIndicatorClass && (
          <div
            className={cn(
              "size-5 shrink-0 rounded border border-gray-300",
              priorityIndicatorClass,
            )}
            title={`Priority: ${PRIORITY_LABELS[priority]}`}
            aria-hidden
          />
        )}

        <Checkbox
          checked={isChecked}
          onCheckedChange={(v) => handleCheckedChange(Boolean(v))}
          aria-label={isChecked ? "Mark task as not done" : "Mark task as done"}
          className="size-5 rounded-md shrink-0"
        />

        <span
          className={cn(
            "flex-1 text-[15px] font-medium min-w-0 truncate text-gray-700",
            isChecked && "line-through text-gray-400",
          )}
        >
          {task.title}
        </span>

        {!checked && onPriorityChange && (
          <Select
            value={priority}
            onValueChange={(v) =>
              onPriorityChange(
                task.id,
                v as "very_urgent" | "urgent" | "medium" | "low",
              )
            }
          >
            <SelectTrigger
              className="w-[90px] h-8 shrink-0 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="very_urgent">
                {PRIORITY_LABELS.very_urgent}
              </SelectItem>
              <SelectItem value="urgent">{PRIORITY_LABELS.urgent}</SelectItem>
              <SelectItem value="medium">{PRIORITY_LABELS.medium}</SelectItem>
              <SelectItem value="low">{PRIORITY_LABELS.low}</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Remove task"
          onClick={handleRemove}
          className={cn(
            "shrink-0 text-gray-500 hover:text-gray-900",
            isCompletedState && "opacity-70",
          )}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
