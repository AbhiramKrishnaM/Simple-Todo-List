import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types";

type TaskNotesModalProps = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, notes: string) => void;
};

export default function TaskNotesModal({
  task,
  open,
  onOpenChange,
  onSave,
}: TaskNotesModalProps) {
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (task && open) {
      setNotes((task.meta?.notes as string) || "");
    }
  }, [task, open]);

  const handleSave = () => {
    if (task) {
      onSave(task.id, notes);
      onOpenChange(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
          <DialogDescription>
            Add notes, steps, or additional details for this task
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Textarea
            placeholder="Add your notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px] text-base"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Notes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
