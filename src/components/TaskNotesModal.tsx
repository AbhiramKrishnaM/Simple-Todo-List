import * as React from "react";
import MDEditor from "@uiw/react-md-editor";
import { Download } from "lucide-react";
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
  onSave: (taskId: string, title: string, notes: string) => void;
};

export default function TaskNotesModal({
  task,
  open,
  onOpenChange,
  onSave,
}: TaskNotesModalProps) {
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setNotes((task.meta?.notes as string) || "");
    }
  }, [task, open]);

  const handleSave = () => {
    if (task) {
      onSave(task.id, title.trim() || task.title, notes);
      onOpenChange(false);
    }
  };

  const handleDownload = () => {
    if (!task) return;
    const content = `# ${title || task.title}\n\n${notes}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || task.title).replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle asChild>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold w-full pr-6 bg-transparent border-0 outline-none focus:ring-0 rounded px-0 py-0.5 focus:bg-gray-50 dark:focus:bg-gray-800/50 focus:px-2"
              placeholder="Task title"
            />
          </DialogTitle>
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
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDownload}
            disabled={!notes.trim()}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Download className="size-4" />
            Download .md
          </Button>
          <div className="flex gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
