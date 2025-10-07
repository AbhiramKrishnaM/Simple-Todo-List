import AddTask from "./components/AddTask";
import type { Task } from "./types";
import { useTasksStore } from "./store/tasks";

function App() {
  const addTask = useTasksStore((s) => s.addTask);

  function handleAdd(task: Task) {
    addTask(task);
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen gap-6 px-6">
        <div className="text-2xl font-bold text-gray-700 w-full max-w-xl">
          Your To Do
        </div>
        <AddTask onAdd={handleAdd} />
      </div>
    </>
  );
}

export default App;
