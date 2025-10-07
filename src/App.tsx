import AddTask from "./components/AddTask";

function App() {
  function handleAdd(task: string) {}

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen gap-6 px-6">
        <div className="text-2xl font-bold text-gray-700">Your To Do</div>
        <AddTask onAdd={handleAdd} />
      </div>
    </>
  );
}

export default App;
