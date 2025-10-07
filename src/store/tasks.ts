import { create } from "zustand";
import type { Task } from "@/types";

type TasksState = {
  tasks: Task[];

  createTask: (
    input: Omit<Task, "id" | "timestamp"> & Partial<Pick<Task, "timestamp">>
  ) => Task;

  addTask: (task: Task) => void;

  removeTask: (taskId: string) => void;

  updateTask: (taskId: string, updates: Partial<Omit<Task, "id">>) => void;

  getTasks: () => Task[];
  setTasks: (tasks: Task[]) => void;

  clearTasks: () => void;
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],

  createTask: (input) => {
    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title,
      priority: input.priority,
      timestamp: input.timestamp ?? Date.now(),
      completed: input.completed ?? false,
      meta: input.meta ?? {},
    };
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  removeTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
  getTasks: () => get().tasks,

  setTasks: (tasks) => set({ tasks }),

  clearTasks: () => set({ tasks: [] }),
}));
