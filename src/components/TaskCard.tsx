import * as React from "react";
import { X } from "lucide-react";

import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type TaskCardProps = {
  task: Task;
  checked?: boolean;
  onToggle?: (taskId: string, checked: boolean) => void;
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

  React.useEffect(() => {
    if (typeof checked === "boolean") setIsChecked(checked);
  }, [checked]);

  function handleCheckedChange(next: boolean) {
    setIsChecked(next);
    onToggle?.(task.id, next);
  }

  function handleRemove() {
    onRemove?.(task.id);
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-xl items-center gap-3 rounded-2xl border border-input px-4 py-3 shadow-sm",
        className
      )}
      role="group"
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={(v) => handleCheckedChange(Boolean(v))}
        aria-label={isChecked ? "Mark task as not done" : "Mark task as done"}
        className="size-5 rounded-md"
      />

      <span
        className={cn(
          "flex-1 text-[15px] font-medium text-gray-700",
          isChecked && "line-through text-gray-400"
        )}
      >
        {task.title}
      </span>

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
  );
}
