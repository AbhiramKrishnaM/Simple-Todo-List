import { create } from "zustand";
import type { FocusSession } from "@/types";
import { focusService } from "@api";

type FocusState = {
  // Current active session
  activeSession: FocusSession | null;
  
  // Client-side elapsed time (in seconds)
  elapsedTime: number;
  
  // Timer interval reference
  timerInterval: NodeJS.Timeout | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Computed helpers
  isPaused: () => boolean;
  isActive: () => boolean;
  getCurrentTaskId: () => string | null;
  
  // Actions
  fetchActiveSession: () => Promise<void>;
  startFocus: (taskId: string) => Promise<void>;
  pauseFocus: () => Promise<void>;
  resumeFocus: () => Promise<void>;
  stopFocus: () => Promise<void>;
  
  // Timer management
  startTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  
  // Cleanup
  clearSession: () => void;
  setError: (error: string | null) => void;
};

export const useFocusStore = create<FocusState>((set, get) => ({
  activeSession: null,
  elapsedTime: 0,
  timerInterval: null,
  isLoading: false,
  error: null,

  // Check if session is paused
  isPaused: () => {
    const session = get().activeSession;
    return session ? session.paused_at !== null : false;
  },

  // Check if there's an active session
  isActive: () => {
    const session = get().activeSession;
    return session ? session.is_active : false;
  },

  // Get current focused task ID
  getCurrentTaskId: () => {
    const session = get().activeSession;
    return session ? session.task_id : null;
  },

  // Fetch active session from server
  fetchActiveSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await focusService.getActiveSession();
      
      if (session) {
        // Calculate elapsed time from server data
        const startedAt = new Date(session.started_at).getTime();
        const now = Date.now();
        
        let elapsed = session.elapsed_seconds;
        
        // If not paused, add time since started_at
        if (!session.paused_at) {
          const additionalSeconds = Math.floor((now - startedAt) / 1000);
          elapsed += additionalSeconds;
        }
        
        set({ 
          activeSession: session, 
          elapsedTime: elapsed,
          isLoading: false 
        });
        
        // Start timer if not paused
        if (!session.paused_at) {
          get().startTimer();
        }
      } else {
        set({ 
          activeSession: null, 
          elapsedTime: 0,
          isLoading: false 
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch active session";
      set({ error: errorMessage, isLoading: false });
      console.error("Error fetching active session:", error);
    }
  },

  // Start focus session
  startFocus: async (taskId: string) => {
    set({ isLoading: true, error: null });
    
    // Stop current timer if any
    get().stopTimer();
    
    try {
      const session = await focusService.startFocus(taskId);
      
      set({
        activeSession: session,
        elapsedTime: 0,
        isLoading: false,
      });
      
      // Start the client-side timer
      get().startTimer();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start focus";
      set({ error: errorMessage, isLoading: false });
      console.error("Error starting focus:", error);
      throw error;
    }
  },

  // Pause focus session
  pauseFocus: async () => {
    const taskId = get().getCurrentTaskId();
    if (!taskId) return;

    set({ isLoading: true, error: null });
    
    // Stop the timer
    get().stopTimer();
    
    try {
      const session = await focusService.pauseFocus(taskId);
      
      set({
        activeSession: session,
        elapsedTime: session.elapsed_seconds,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to pause focus";
      set({ error: errorMessage, isLoading: false });
      console.error("Error pausing focus:", error);
      throw error;
    }
  },

  // Resume focus session
  resumeFocus: async () => {
    const taskId = get().getCurrentTaskId();
    if (!taskId) return;

    set({ isLoading: true, error: null });
    
    try {
      const session = await focusService.resumeFocus(taskId);
      
      set({
        activeSession: session,
        isLoading: false,
      });
      
      // Restart the timer
      get().startTimer();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resume focus";
      set({ error: errorMessage, isLoading: false });
      console.error("Error resuming focus:", error);
      throw error;
    }
  },

  // Stop focus session
  stopFocus: async () => {
    const taskId = get().getCurrentTaskId();
    if (!taskId) return;

    set({ isLoading: true, error: null });
    
    // Stop the timer
    get().stopTimer();
    
    try {
      await focusService.stopFocus(taskId);
      
      set({
        activeSession: null,
        elapsedTime: 0,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to stop focus";
      set({ error: errorMessage, isLoading: false });
      console.error("Error stopping focus:", error);
      throw error;
    }
  },

  // Start the client-side timer
  startTimer: () => {
    // Clear existing interval if any
    const currentInterval = get().timerInterval;
    if (currentInterval) {
      clearInterval(currentInterval);
    }
    
    // Start new interval that ticks every second
    const interval = setInterval(() => {
      get().tick();
    }, 1000);
    
    set({ timerInterval: interval });
  },

  // Stop the client-side timer
  stopTimer: () => {
    const interval = get().timerInterval;
    if (interval) {
      clearInterval(interval);
      set({ timerInterval: null });
    }
  },

  // Increment elapsed time
  tick: () => {
    set((state) => ({
      elapsedTime: state.elapsedTime + 1,
    }));
  },

  // Clear session data
  clearSession: () => {
    get().stopTimer();
    set({
      activeSession: null,
      elapsedTime: 0,
      timerInterval: null,
    });
  },

  // Set error
  setError: (error) => set({ error }),
}));
