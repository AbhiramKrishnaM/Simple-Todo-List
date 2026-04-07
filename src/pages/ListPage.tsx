import * as React from "react";
import { Plus } from "lucide-react";
import AddTaskModal from "../components/AddTaskModal";
import TaskCard from "../components/TaskCard";
import TaskNotesModal from "../components/TaskNotesModal";
import type { Task, Priority, RowColors } from "../types";
import { useTasksStore } from "../store/tasks";
import { useSettingsStore } from "../store/settings";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  rectIntersection,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { getPriorityIndicatorClass } from "../lib/priorityColors";
import { cn } from "../lib/utils";

// Column order: left → right
const KANBAN_COLUMNS: Priority[] = [
  "low",
  "medium",
  "urgent",
  "very_urgent",
  "queue",
];

const COLUMN_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  urgent: "Urgent",
  very_urgent: "Very Urgent",
  queue: "Queue",
};

function getPriority(task: Task): Priority {
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

// --- KanbanColumn component ---
type KanbanColumnProps = {
  priority: Priority;
  tasks: Task[];
  rowColors: RowColors | null;
  onAddClick: () => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onCardClick: (task: Task) => void;
};

function KanbanColumn({
  priority,
  tasks,
  rowColors,
  onAddClick,
  onToggle,
  onRemove,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `droppable-${priority}` });

  const uncompletedCount = tasks.filter((t) => !t.completed).length;
  const isVeryUrgent = priority === "very_urgent";
  const isQueue = priority === "queue";
  const isFull = isVeryUrgent && uncompletedCount >= 1;
  const colorDot = getPriorityIndicatorClass(priority, rowColors);

  return (
    <div className="flex flex-col flex-1 min-w-[180px] h-full rounded-xl border border-border/60 bg-muted/20">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn("size-2.5 rounded-full flex-shrink-0", colorDot)} />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">
            {COLUMN_LABELS[priority]}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {isVeryUrgent ? `${uncompletedCount}/1` : uncompletedCount}
          </span>
          {isFull && (
            <span className="text-[10px] font-semibold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-md">
              FULL
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 hover:bg-muted"
          aria-label={`Add task to ${COLUMN_LABELS[priority]}`}
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* Queue subtitle */}
      {isQueue && (
        <p className="text-[10px] text-muted-foreground px-3 pb-1.5 -mt-1 leading-tight">
          Overflow from Very Urgent
        </p>
      )}

      {/* Divider */}
      <div className="mx-3 border-t border-border/40 mb-2 flex-shrink-0" />

      {/* Droppable task list */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto px-2 pb-2 rounded-b-xl transition-colors",
          isOver && "bg-primary/5 ring-1 ring-inset ring-primary/30",
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 pt-1">
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                checked={t.completed}
                onToggle={onToggle}
                onRemove={onRemove}
                onCardClick={onCardClick}
                priorityIndicatorClass={getPriorityIndicatorClass(
                  priority,
                  rowColors,
                )}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center py-10 text-xs text-muted-foreground/60">
                No tasks
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main ListPage ---
function ListPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const fetchTasks = useTasksStore((s) => s.fetchTasks);
  const createTask = useTasksStore((s) => s.createTask);
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const error = useTasksStore((s) => s.error);

  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{
    type: "error" | "info";
    message: string;
  } | null>(null);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addModalPriority, setAddModalPriority] =
    React.useState<Priority>("medium");
  const [notesModalOpen, setNotesModalOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  React.useEffect(() => {
    fetchTasks();
    fetchSettings();
  }, [fetchTasks, fetchSettings]);

  const tasksByPriority = React.useMemo(() => {
    const byPriority: Record<Priority, Task[]> = {
      very_urgent: [],
      urgent: [],
      medium: [],
      low: [],
      queue: [],
    };

    tasks.forEach((t) => {
      byPriority[getPriority(t)].push(t);
    });

    const sortByPosition = (a: Task, b: Task) => {
      const posA = a.meta?.position ?? 999;
      const posB = b.meta?.position ?? 999;
      if (posA !== posB) return posA - posB;
      return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
    };

    KANBAN_COLUMNS.forEach((p) => {
      byPriority[p].sort(sortByPosition);
    });

    return byPriority;
  }, [tasks]);

  const uncompletedTasks = React.useMemo(
    () =>
      KANBAN_COLUMNS.flatMap((p) =>
        tasksByPriority[p].filter((t) => !t.completed),
      ),
    [tasksByPriority],
  );

  const taskLimit = settings?.numberOfTasks ?? 7;
  const rowColors = settings?.rowColors ?? null;

  function showNotification(type: "error" | "info", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    const draggedPriority = getPriority(draggedTask);
    const overId = over.id as string;

    let targetPriority: Priority;

    if (overId.startsWith("droppable-")) {
      targetPriority = overId.replace("droppable-", "") as Priority;
    } else {
      const targetTask = tasks.find((t) => t.id === over.id);
      if (!targetTask) return;
      targetPriority = getPriority(targetTask);
    }

    // Very Urgent overflow: only 1 uncompleted task allowed
    if (targetPriority === "very_urgent") {
      const veryUrgentUncompleted = tasksByPriority.very_urgent.filter(
        (t) => !t.completed && t.id !== draggedTask.id,
      );
      if (veryUrgentUncompleted.length >= 1) {
        targetPriority = "queue";
        showNotification(
          "info",
          "Very Urgent is full — task moved to Queue instead.",
        );
      }
    }

    if (draggedPriority !== targetPriority) {
      try {
        await updateTask(draggedTask.id, {
          meta: { ...draggedTask.meta, priority: targetPriority },
        });
        await fetchTasks();
      } catch (err) {
        console.error("Failed to change priority:", err);
      }
      return;
    }

    // Same column reorder
    if (!overId.startsWith("droppable-")) {
      const colTasks = tasksByPriority[draggedPriority].filter(
        (t) => !t.completed,
      );
      const oldIndex = colTasks.findIndex((t) => t.id === active.id);
      const newIndex = colTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(colTasks, oldIndex, newIndex);
      const updates = reordered.map((task, index) =>
        updateTask(task.id, {
          meta: { ...task.meta, priority: draggedPriority, position: index + 1 },
        }),
      );

      try {
        await Promise.all(updates);
        await fetchTasks();
      } catch (err) {
        console.error("Failed to reorder tasks:", err);
      }
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const activeTask =
    activeId != null ? (tasks.find((t) => t.id === activeId) ?? null) : null;

  function handleCardClick(task: Task) {
    setSelectedTask(task);
    setNotesModalOpen(true);
  }

  async function handleNotesSave(taskId: string, notes: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await updateTask(taskId, { meta: { ...task.meta, notes } });
    } catch (err) {
      console.error("Failed to update notes:", err);
    }
  }

  async function handleAdd(task: Task) {
    if (uncompletedTasks.length >= taskLimit) {
      showNotification(
        "error",
        `You've reached your task limit of ${taskLimit}. Complete or delete some tasks, or increase your limit in Settings.`,
      );
      return;
    }

    let priority: Priority = task.meta?.priority ?? "medium";

    // Very Urgent overflow
    if (priority === "very_urgent") {
      const veryUrgentUncompleted = tasksByPriority.very_urgent.filter(
        (t) => !t.completed,
      );
      if (veryUrgentUncompleted.length >= 1) {
        priority = "queue";
        showNotification(
          "info",
          "Very Urgent is full — task added to Queue instead.",
        );
      }
    }

    const uncompletedInCol = tasksByPriority[priority].filter(
      (t) => !t.completed,
    );
    const position = uncompletedInCol.length + 1;

    try {
      await createTask({
        title: task.title,
        completed: task.completed,
        meta: { ...task.meta, priority, position },
      });
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  }

  function handleAddForColumn(priority: Priority) {
    setAddModalPriority(priority);
    setAddModalOpen(true);
  }

  async function handleToggle(id: string) {
    try {
      await toggleTask(id);
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeTask(id);
    } catch (err) {
      console.error("Failed to remove task:", err);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Notifications */}
      {(notification || error) && (
        <div className="flex-shrink-0 flex flex-col items-center gap-2 px-6 pt-3 pb-1">
          {notification && (
            <div
              className={cn(
                "rounded-md px-3 py-2 text-sm w-full max-w-lg text-center",
                notification.type === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400",
              )}
            >
              {notification.message}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive w-full max-w-lg text-center">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex flex-1 min-h-0 overflow-x-auto px-6 pb-4 pt-4">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 h-full w-full">
            {KANBAN_COLUMNS.map((priority) => (
              <KanbanColumn
                key={priority}
                priority={priority}
                tasks={tasksByPriority[priority]}
                rowColors={rowColors}
                onAddClick={() => handleAddForColumn(priority)}
                onToggle={handleToggle}
                onRemove={handleRemove}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeTask ? (
              <div className="rotate-1 scale-105 cursor-grabbing w-64">
                <TaskCard
                  task={activeTask}
                  checked={activeTask.completed}
                  onToggle={() => {}}
                  onRemove={() => {}}
                  className="shadow-2xl ring-2 ring-primary/20"
                  priorityIndicatorClass={getPriorityIndicatorClass(
                    getPriority(activeTask),
                    rowColors,
                  )}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Footer */}
      {tasks.length > 0 && (() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        const pct = Math.round((completed / total) * 100);
        return (
          <div className="flex-shrink-0 px-6 py-3 border-t border-border/40 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completed} of {total} completed</span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}

      <AddTaskModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleAdd}
        defaultPriority={addModalPriority}
        title={`Add task to ${COLUMN_LABELS[addModalPriority]}`}
      />

      <TaskNotesModal
        task={selectedTask}
        open={notesModalOpen}
        onOpenChange={setNotesModalOpen}
        onSave={handleNotesSave}
      />
    </div>
  );
}

export default ListPage;
