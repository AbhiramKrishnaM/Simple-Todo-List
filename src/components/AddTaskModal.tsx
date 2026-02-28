import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task } from "@/types";

type Priority = "very_urgent" | "urgent" | "medium" | "low";

type AddTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (task: Task) => void;
  defaultPriority?: Priority;
  title?: string;
};

export default function AddTaskModal({
  open,
  onOpenChange,
  onAdd,
  defaultPriority = "medium",
  title = "Add task",
}: AddTaskModalProps) {
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (open) setValue("");
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      timestamp: Date.now(),
      completed: false,
      meta: { priority: defaultPriority },
    };

    onAdd?.(task);
    setValue("");
    onOpenChange(false);
  }

  function handleCancel() {
    setValue("");
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-modal-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-input bg-background p-4 shadow-lg"
      >
        <h2 id="add-task-modal-title" className="sr-only">
          {title}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Task title..."
            className="w-full"
            autoFocus
            aria-label="Task title"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!value.trim()}>
              Add
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
