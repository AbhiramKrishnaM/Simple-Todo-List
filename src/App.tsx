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
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
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
  }

  return (
    <>
      <motion.div
        className={[
          "flex h-screen flex-col items-center gap-4 px-6 py-10",
          hasTasks ? "justify-start" : "justify-center",
        ].join(" ")}
        layout
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {/* Global top-right controls */}
        <div className="fixed right-4 top-4 z-50">
          <ModeToggle />
        </div>
        {/* Header + input; behaves like a fixed header once tasks exist */}
        <div className="w-full max-w-xl">
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
            className="w-full max-w-xl flex-1 overflow-y-auto px-2 pt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
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
            </DndContext>
          </motion.div>
        )}

        {/* Remaining todos counter and motivational quote */}
        <div className="mt-6 w-full max-w-xl">
          <div className="text-lg font-semibold text-foreground mb-2">
            Your remaining todos: {remainingTasks}
          </div>
          <Quote />
        </div>
      </motion.div>
    </>
  );
}

export default App;
