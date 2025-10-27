import * as React from "react";
import AddTask from "./components/AddTask";
import TaskCard from "./components/TaskCard";
import Quote from "./components/Quote";
import type { Task } from "./types";
import { useTasksStore } from "./store/tasks";
import { motion, AnimatePresence } from "motion/react";
import ModeToggle from "@/components/ModeToggle";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

function App() {
  const tasks = useTasksStore((s) => s.tasks);
  const fetchTasks = useTasksStore((s) => s.fetchTasks);
  const createTask = useTasksStore((s) => s.createTask);
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const reorderTasks = useTasksStore((s) => s.reorderTasks);
  const error = useTasksStore((s) => s.error);

  // Track the active dragging item
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Fetch tasks on mount
  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Separate completed and uncompleted tasks
  const { uncompletedTasks, completedTasks } = React.useMemo(() => {
    const uncompleted = tasks.filter((task) => !task.completed);
    const completed = tasks.filter((task) => task.completed);

    // Sort by display_order if available, otherwise by timestamp
    const sortByOrder = (a: Task, b: Task) => {
      if (a.display_order !== undefined && b.display_order !== undefined) {
        return a.display_order - b.display_order;
      }
      return a.timestamp - b.timestamp;
    };

    return {
      uncompletedTasks: [...uncompleted].sort(sortByOrder),
      completedTasks: [...completed].sort(sortByOrder),
    };
  }, [tasks]);

  const hasTasks = tasks.length > 0;
  const remainingTasks = uncompletedTasks.length;

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleAdd(task: Task) {
    try {
      await createTask({
        title: task.title,
        priority: task.priority,
        completed: task.completed,
        meta: task.meta,
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = uncompletedTasks.findIndex(
      (task) => task.id === active.id
    );
    const newIndex = uncompletedTasks.findIndex((task) => task.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder uncompleted tasks
      const reordered = arrayMove(uncompletedTasks, oldIndex, newIndex);

      // Combine with completed tasks (keep them at the end)
      const allTasks = [...reordered, ...completedTasks];

      try {
        await reorderTasks(allTasks);
      } catch (error) {
        console.error("Failed to reorder tasks:", error);
      }
    }

    setActiveId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  // Find the active task being dragged
  const activeTask = activeId
    ? uncompletedTasks.find((task) => task.id === activeId)
    : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Navbar */}
      <div className="w-full h-16 flex justify-between items-center px-6 flex-shrink-0 border-b border-border/40">
        <div>hello</div>

        {/* Global top-right controls */}
        <div>
          <ModeToggle />
        </div>
      </div>

      {/* Main content area */}
      <motion.div
        className={[
          "flex flex-1 flex-col items-center gap-4 px-6 py-6 overflow-hidden",
          hasTasks ? "justify-start" : "justify-center",
        ].join(" ")}
        layout
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {/* Header + input; behaves like a fixed header once tasks exist */}
        <div className="w-full max-w-xl flex-shrink-0">
          <div className="mb-2 text-2xl font-bold text-foreground">
            Your To Do
          </div>
          <AddTask onAdd={handleAdd} />
          {error && (
            <div className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {hasTasks && (
          <motion.div
            className="w-full max-w-xl flex-1 overflow-y-auto px-2 pt-1 min-h-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div className="flex flex-col gap-4">
                {/* Uncompleted tasks - draggable */}
                <SortableContext
                  items={uncompletedTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence mode="popLayout">
                    {uncompletedTasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        checked={t.completed}
                        onToggle={(id) => handleToggle(id)}
                        onRemove={(id) => handleRemove(id)}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>

                {/* Completed tasks - not draggable */}
                <AnimatePresence mode="popLayout">
                  {completedTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      checked={t.completed}
                      onToggle={(id) => handleToggle(id)}
                      onRemove={(id) => handleRemove(id)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Drag Overlay - shows the card being dragged */}
              <DragOverlay
                dropAnimation={{
                  duration: 200,
                  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                }}
              >
                {activeTask ? (
                  <div className="rotate-3 scale-105 cursor-grabbing shadow-2xl">
                    <TaskCard
                      task={activeTask}
                      checked={activeTask.completed}
                      onToggle={() => {}}
                      onRemove={() => {}}
                      className="shadow-2xl ring-2 ring-primary/20"
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        )}

        {/* Remaining todos counter and motivational quote */}
        <div className="w-full max-w-xl flex-shrink-0">
          <div className="text-lg font-semibold text-foreground mb-2">
            Your remaining todos: {remainingTasks}
          </div>
          <Quote />
        </div>
      </motion.div>
    </div>
  );
}

export default App;
