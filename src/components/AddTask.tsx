import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AddTaskProps = {
  onAdd?: (value: string) => void;
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
    onAdd?.(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-3 w-full max-w-xl", className)}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={
          // bottom-border only styling to match the UI reference
          "rounded-none border-0 border-b border-input px-0 focus-visible:ring-0 focus-visible:border-ring"
        }
        aria-label={placeholder}
      />
      <Button
        type="submit"
        size="icon-sm"
        variant="outline"
        aria-label="Add task"
        className="cursor-pointer"
      >
        <Plus />
      </Button>
    </form>
  );
}
