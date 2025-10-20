import { create } from "zustand";
import type { Task } from "@/types";
import { taskService } from "@api";

type TasksState = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Fetch all tasks from API
  fetchTasks: () => Promise<void>;

  // Create a new task via API
  createTask: (
    input: Omit<Task, "id" | "timestamp"> & Partial<Pick<Task, "timestamp">>
  ) => Promise<Task>;

  // Add task to local state (for optimistic updates)
  addTask: (task: Task) => void;

  // Remove task via API
  removeTask: (taskId: string) => Promise<void>;

  // Update task via API
  updateTask: (
    taskId: string,
    updates: Partial<Omit<Task, "id">>
  ) => Promise<void>;

  // Toggle task completion via API
  toggleTask: (taskId: string) => Promise<void>;

  // Local state management
  getTasks: () => Task[];
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => Promise<void>;

  // Reorder tasks
  reorderTasks: (tasks: Task[]) => Promise<void>;

  // Error handling
  setError: (error: string | null) => void;
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getAllTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch tasks";
      set({ error: errorMessage, isLoading: false });
      console.error("Error fetching tasks:", error);
    }
  },

  createTask: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.createTask({
        title: input.title,
        priority: input.priority,
        completed: input.completed ?? false,
        meta: input.meta ?? {},
      });
      set((state) => ({
        tasks: [task, ...state.tasks],
        isLoading: false,
      }));
      return task;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create task";
      set({ error: errorMessage, isLoading: false });
      console.error("Error creating task:", error);
      throw error;
    }
  },

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  removeTask: async (taskId) => {
    set({ isLoading: true, error: null });
    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));

    try {
      await taskService.deleteTask(taskId);
      set({ isLoading: false });
    } catch (error) {
      // Revert on error
      set({ tasks: previousTasks });
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete task";
      set({ error: errorMessage, isLoading: false });
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  updateTask: async (taskId, updates) => {
    set({ isLoading: true, error: null });
    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    try {
      const updatedTask = await taskService.updateTask(taskId, updates);
      // Update with server response
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        isLoading: false,
      }));
    } catch (error) {
      // Revert on error
      set({ tasks: previousTasks });
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update task";
      set({ error: errorMessage, isLoading: false });
      console.error("Error updating task:", error);
      throw error;
    }
  },

  toggleTask: async (taskId) => {
    set({ isLoading: true, error: null });
    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));

    try {
      const updatedTask = await taskService.toggleTask(taskId);
      // Update with server response
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        isLoading: false,
      }));
    } catch (error) {
      // Revert on error
      set({ tasks: previousTasks });
      const errorMessage =
        error instanceof Error ? error.message : "Failed to toggle task";
      set({ error: errorMessage, isLoading: false });
      console.error("Error toggling task:", error);
      throw error;
    }
  },

  getTasks: () => get().tasks,

  setTasks: (tasks) => set({ tasks }),

  clearTasks: async () => {
    set({ isLoading: true, error: null });
    const previousTasks = get().tasks;
    set({ tasks: [] });

    try {
      await taskService.deleteAllTasks();
      set({ isLoading: false });
    } catch (error) {
      // Revert on error
      set({ tasks: previousTasks });
      const errorMessage =
        error instanceof Error ? error.message : "Failed to clear tasks";
      set({ error: errorMessage, isLoading: false });
      console.error("Error clearing tasks:", error);
      throw error;
    }
  },

  reorderTasks: async (reorderedTasks) => {
    // Optimistic update
    const previousTasks = get().tasks;
    set({ tasks: reorderedTasks });

    try {
      // Prepare data for API
      const tasksWithOrder = reorderedTasks.map((task, index) => ({
        id: task.id,
        display_order: index,
      }));

      await taskService.reorderTasks(tasksWithOrder);

      // Update local state with new order
      set((state) => ({
        tasks: state.tasks.map((task, index) => ({
          ...task,
          display_order: index,
        })),
      }));
    } catch (error) {
      // Revert on error
      set({ tasks: previousTasks });
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reorder tasks";
      set({ error: errorMessage });
      console.error("Error reordering tasks:", error);
      throw error;
    }
  },

  setError: (error) => set({ error }),
}));
