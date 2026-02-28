import * as React from "react";
import MDEditor from "@uiw/react-md-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
          <DialogDescription>
            Add notes, steps, or additional details for this task. Supports Markdown formatting.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-4" data-color-mode="light">
          <MDEditor
            value={notes}
            onChange={(val) => setNotes(val || "")}
            preview="live"
            height={400}
            visibleDragbar={false}
            textareaProps={{
              placeholder: "# Add your notes here\n\nSupports:\n- **Bold** and *italic*\n- Lists and checklists\n- Code blocks\n- Links and more!"
            }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
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
