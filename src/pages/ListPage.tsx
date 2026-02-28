import * as React from "react";
import { Plus } from "lucide-react";
import AddTask from "../components/AddTask";
import AddTaskModal from "../components/AddTaskModal";
import TaskCard from "../components/TaskCard";
import type { Task } from "../types";
import { useTasksStore } from "../store/tasks";
import { useSettingsStore } from "../store/settings";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  PRIORITY_ORDER,
  getPriorityIndicatorClass,
} from "../lib/priorityColors";

const MAX_TASKS_PER_PRIORITY = 5;

function getPriority(task: Task): "very_urgent" | "urgent" | "medium" | "low" {
  const p = task.meta?.priority;
  if (p === "very_urgent" || p === "urgent" || p === "medium" || p === "low")
    return p;
  return "medium";
}

/** Returns the next priority to assign when adding from the top input: fill very_urgent first (up to 5), then urgent, medium, low. */
function getNextPriorityToFill(
  tasksByPriority: Record<"very_urgent" | "urgent" | "medium" | "low", Task[]>,
): "very_urgent" | "urgent" | "medium" | "low" {
  for (const p of PRIORITY_ORDER) {
    const uncompletedInRow = tasksByPriority[p].filter((t) => !t.completed);
    if (uncompletedInRow.length < MAX_TASKS_PER_PRIORITY) return p;
  }
  return "low";
}

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
  const [limitError, setLimitError] = React.useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addModalPriority, setAddModalPriority] = React.useState<
    "very_urgent" | "urgent" | "medium" | "low"
  >("medium");

  React.useEffect(() => {
    fetchTasks();
    fetchSettings();
  }, [fetchTasks, fetchSettings]);

  const { tasksByPriority } = React.useMemo(() => {
    const byPriority: Record<
      "very_urgent" | "urgent" | "medium" | "low",
      Task[]
    > = {
      very_urgent: [],
      urgent: [],
      medium: [],
      low: [],
    };

    tasks.forEach((t) => {
      byPriority[getPriority(t)].push(t);
    });

    // Within each priority row, sort by position (1–5)
    const sortByPosition = (a: Task, b: Task) => {
      const posA = a.meta?.position ?? 999;
      const posB = b.meta?.position ?? 999;
      if (posA !== posB) return posA - posB;
      return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
    };
    
    PRIORITY_ORDER.forEach((p) => {
      byPriority[p].sort(sortByPosition);
    });

    return {
      tasksByPriority: byPriority,
    };
  }, [tasks]);

  const uncompletedTasks = React.useMemo(
    () =>
      PRIORITY_ORDER.flatMap((p) =>
        tasksByPriority[p].filter((t) => !t.completed),
      ),
    [tasksByPriority],
  );

  const hasTasks = tasks.length > 0;
  const remainingTasks = uncompletedTasks.length;
  const taskLimit = settings?.numberOfTasks ?? 7;
  const rowColors = settings?.rowColors ?? null;

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
    const targetTask = tasks.find((t) => t.id === over.id);
    if (!draggedTask || !targetTask) return;

    const draggedPriority = getPriority(draggedTask);
    const targetPriority = getPriority(targetTask);

    if (draggedPriority !== targetPriority) return;

    const rowTasks = tasksByPriority[draggedPriority].filter(
      (t) => !t.completed,
    );
    const oldIndex = rowTasks.findIndex((t) => t.id === active.id);
    const newIndex = rowTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(rowTasks, oldIndex, newIndex);

    const updatesPromises = reordered.map((task, index) =>
      updateTask(task.id, {
        meta: { ...task.meta, priority: draggedPriority, position: index + 1 },
      }),
    );

    try {
      await Promise.all(updatesPromises);
      await fetchTasks();
    } catch (err) {
      console.error("Failed to reorder tasks:", err);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const activeTask =
    activeId != null ? (tasks.find((t) => t.id === activeId) ?? null) : null;

  async function handlePriorityChange(
    taskId: string,
    priority: "very_urgent" | "urgent" | "medium" | "low",
  ) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await updateTask(taskId, {
        meta: { ...task.meta, priority },
      });
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  }

  async function handleAdd(task: Task) {
    if (uncompletedTasks.length >= taskLimit) {
      setLimitError(
        `You've reached your task limit of ${taskLimit}. Complete or delete some tasks, or increase your limit in Settings.`,
      );
      setTimeout(() => {
        setLimitError(null);
      }, 5000);
      return;
    }

    setLimitError(null);
    const priority =
      task.meta?.priority ?? getNextPriorityToFill(tasksByPriority);
    const uncompletedInRow = tasksByPriority[priority].filter(
      (t) => !t.completed,
    );
    const position = Math.min(
      uncompletedInRow.length + 1,
      MAX_TASKS_PER_PRIORITY,
    );
    try {
      await createTask({
        title: task.title,
        completed: task.completed,
        meta: { ...task.meta, priority, position },
      });
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleTask(id);
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeTask(id);
    } catch (error) {
      console.error("Failed to remove task:", error);
    }
  }

  return (
    <div
      className={[
        "flex flex-1 flex-col items-center gap-4 px-6 py-6 overflow-hidden",
        hasTasks ? "justify-start" : "justify-center",
      ].join(" ")}
    >
      <div className="w-full max-w-4xl flex-shrink-0 flex flex-col items-center text-center">
        <div className="mb-2 text-2xl font-bold text-foreground">
          Your To Do
        </div>
        <div className="w-full max-w-md flex justify-center">
          <AddTask onAdd={handleAdd} placeholder="Add new task" />
        </div>
        <AddTaskModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onAdd={handleAdd}
          defaultPriority={addModalPriority}
          title="Add task"
        />
        {error && (
          <div className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive w-full max-w-md">
            {error}
          </div>
        )}
        {limitError && (
          <div className="mt-2 rounded-md bg-orange-500/10 border border-orange-500/20 px-3 py-2 text-sm text-orange-600 dark:text-orange-400 w-full max-w-md">
            {limitError}
          </div>
        )}
      </div>

      <div className="w-full flex-1 px-2 pt-1 min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 gap-6">
            {PRIORITY_ORDER.map((priority) => {
              const rowTasks = tasksByPriority[priority];
              const rowLabel =
                priority === "very_urgent"
                  ? "Very urgent"
                  : priority === "urgent"
                    ? "Urgent"
                    : priority === "medium"
                      ? "Medium"
                      : "Low";
              return (
                <div key={priority} className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {rowLabel}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalPriority(priority);
                      setAddModalOpen(true);
                    }}
                    className="w-fit min-w-[120px] min-h-[72px] flex items-center justify-center rounded-lg border-2 border-dashed border-input px-6 text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/30 transition-colors"
                    aria-label={`Add ${rowLabel} task`}
                  >
                    <Plus className="size-8" />
                  </button>
                  {rowTasks.length > 0 && (
                    <SortableContext
                      items={rowTasks.map((t) => t.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="flex flex-wrap gap-3">
                        {rowTasks.map((t) => (
                          <TaskCard
                            key={t.id}
                            task={t}
                            checked={t.completed}
                            onToggle={(id) => handleToggle(id)}
                            onRemove={(id) => handleRemove(id)}
                            onPriorityChange={handlePriorityChange}
                            cardClassName={undefined}
                            priorityIndicatorClass={getPriorityIndicatorClass(
                              priority,
                              rowColors,
                            )}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              );
            })}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeTask ? (
              <div className="rotate-2 scale-105 cursor-grabbing shadow-2xl">
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

      {settings?.showRemainingTodoCount !== false && (
        <div className="w-full max-w-4xl flex-shrink-0">
          <div className="text-lg font-semibold text-foreground mb-2">
            Your remaining todos: {remainingTasks} / {taskLimit}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListPage;
