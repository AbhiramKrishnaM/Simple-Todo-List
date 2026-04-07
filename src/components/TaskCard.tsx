import * as React from "react";
import { X, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Task, Priority } from "@/types";
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

const PRIORITY_LABELS: Record<Priority, string> = {
  very_urgent: "Very urgent",
  urgent: "Urgent",
  medium: "Medium",
  low: "Low",
  queue: "Queue",
};

function getTaskPriority(task: Task): Priority {
  const p = task.meta?.priority;
  if (
    p === "very_urgent" ||
    p === "urgent" ||
    p === "medium" ||
    p === "low" ||
    p === "queue"
  )
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
        "flex flex-col rounded-xl px-3 py-2.5 w-full",
        !isCompletedState && "bg-background border border-input shadow-sm",
        isCompletedState && "bg-gray-100 dark:bg-gray-800/50 border-0 shadow-none opacity-70",
        cardClassName,
        isDragging && "opacity-0",
        className,
      )}
      role="group"
      aria-disabled={isCompletedState}
    >
      <div className="flex w-full items-start gap-2">
        {!checked && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing shrink-0 text-gray-400 hover:text-gray-600 mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="size-4" />
          </div>
        )}
        {priorityIndicatorClass && (
          <div
            className={cn(
              "size-4 shrink-0 rounded border border-gray-300 mt-0.5",
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
          className="mt-0.5"
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={(v) => handleCheckedChange(Boolean(v))}
            aria-label={
              isChecked ? "Mark task as not done" : "Mark task as done"
            }
            className="size-4 shrink-0 rounded-md"
          />
        </div>

        <div className="flex-1 cursor-pointer min-w-0" onClick={handleCardClick}>
          <span
            className={cn(
              "text-sm font-medium text-gray-700 dark:text-gray-300 break-words transition-colors",
              isChecked && "line-through text-gray-400",
              !isChecked && "hover:text-blue-600 dark:hover:text-blue-400",
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
            "shrink-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 -mt-0.5",
            isCompletedState && "opacity-70",
          )}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
