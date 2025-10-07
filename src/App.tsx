import AddTask from "./components/AddTask";
import TaskCard from "./components/TaskCard";
import type { Task } from "./types";
import { useTasksStore } from "./store/tasks";

function App() {
  const tasks = useTasksStore((s) => s.tasks);
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const removeTask = useTasksStore((s) => s.removeTask);

  function handleAdd(task: Task) {
    addTask(task);
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen gap-6 px-6 py-10">
        <div className="text-2xl font-bold text-gray-700 w-full max-w-xl">
          Your To Do
        </div>
        <AddTask onAdd={handleAdd} />
        <div className="flex w-full max-w-xl flex-col gap-4">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              checked={(() => {
                const val = (t.meta as Record<string, unknown> | undefined)
                  ?.done;
                return typeof val === "boolean" ? val : false;
              })()}
              onToggle={(id, checked) =>
                updateTask(id, { meta: { ...(t.meta ?? {}), done: checked } })
              }
              onRemove={(id) => removeTask(id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
