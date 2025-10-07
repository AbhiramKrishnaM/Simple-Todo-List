import AddTask from "./components/AddTask";
import TaskCard from "./components/TaskCard";
import type { Task } from "./types";
import { useTasksStore } from "./store/tasks";
import { motion, AnimatePresence } from "motion/react";

function App() {
  const tasks = useTasksStore((s) => s.tasks);
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const hasTasks = tasks.length > 0;

  function handleAdd(task: Task) {
    addTask(task);
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
        {/* Header + input; behaves like a fixed header once tasks exist */}
        <div className="w-full max-w-xl">
          <div className="text-2xl font-bold text-gray-700">Your To Do</div>
          <AddTask onAdd={handleAdd} />
        </div>

        {hasTasks && (
          <motion.div
            className="w-full max-w-xl flex-1 overflow-y-auto px-2 pt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {tasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    checked={(() => {
                      const val = (
                        t.meta as Record<string, unknown> | undefined
                      )?.done;
                      return typeof val === "boolean" ? val : false;
                    })()}
                    onToggle={(id, checked) =>
                      updateTask(id, {
                        meta: { ...(t.meta ?? {}), done: checked },
                      })
                    }
                    onRemove={(id) => removeTask(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

export default App;
