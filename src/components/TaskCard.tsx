import * as React from "react";
import { X, GripVertical } from "lucide-react";
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
  onCardClick?: (task: Task) => void;
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
  onCardClick,
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

  function handleCardClick() {
    onCardClick?.(task);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col rounded-2xl px-4 py-3 min-h-[72px] w-auto",
        !isCompletedState && "bg-background border border-input shadow-md",
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
            onClick={(e) => e.stopPropagation()}
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

        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={(v) => handleCheckedChange(Boolean(v))}
            aria-label={
              isChecked ? "Mark task as not done" : "Mark task as done"
            }
            className="size-5 shrink-0 rounded-md"
          />
        </div>

        <div className="flex-1 cursor-pointer" onClick={handleCardClick}>
          <span
            className={cn(
              "text-[15px] font-medium text-gray-700 break-words whitespace-nowrap transition-colors",
              isChecked && "line-through text-gray-400",
              !isChecked && "hover:text-blue-600",
            )}
          >
            {task.title}
          </span>
        </div>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Remove task"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
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
