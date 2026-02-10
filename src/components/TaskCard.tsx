import * as React from "react";
import { X, GripVertical, Play, Pause, Square, Timer } from "lucide-react";
import { motion } from "motion/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFocusStore } from "@/store/focus";
import { focusService } from "@api";
import alarmSound from "@/assets/alarm.mp3";

type TaskCardProps = {
  task: Task;
  checked?: boolean;
  onToggle?: (taskId: string) => void;
  onRemove?: (taskId: string) => void;
  className?: string;
};

const DURATION_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "20 min", value: 20 },
  { label: "30 min", value: 30 },
];

export default function TaskCard({
  task,
  checked,
  onToggle,
  onRemove,
  className,
}: TaskCardProps) {
  const [isChecked, setIsChecked] = React.useState<boolean>(Boolean(checked));
  const [showDurationPicker, setShowDurationPicker] = React.useState(false);
  const [customDuration, setCustomDuration] = React.useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: checked }); // Disable drag for completed tasks

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Focus store - use selectors for reactive updates
  const activeSession = useFocusStore((state) => state.activeSession);
  const elapsedTime = useFocusStore((state) => state.elapsedTime);
  const startFocus = useFocusStore((state) => state.startFocus);
  const pauseFocus = useFocusStore((state) => state.pauseFocus);
  const resumeFocus = useFocusStore((state) => state.resumeFocus);
  const stopFocus = useFocusStore((state) => state.stopFocus);
  const isPaused = useFocusStore((state) => state.isPaused);

  const isFocused = activeSession?.task_id === task.id;
  const isAnotherTaskFocused = activeSession?.is_active && !isFocused;
  // Only disable if another task is focused (not if this task is completed)
  const isDisabled = isAnotherTaskFocused;

  // Create audio instance for alarm
  const alarmAudio = React.useMemo(() => new Audio(alarmSound), []);

  // Function to play alarm once
  const playAlarm = React.useCallback(() => {
    alarmAudio.currentTime = 0;
    alarmAudio.play().catch((error) => {
      console.error("Failed to play alarm:", error);
    });
  }, [alarmAudio]);

  React.useEffect(() => {
    if (typeof checked === "boolean") setIsChecked(checked);
  }, [checked]);

  // Handle stop button click
  const handleStopClick = React.useCallback(async () => {
    try {
      await stopFocus();
    } catch (error) {
      console.error("Stop focus failed:", error);
    }
  }, [stopFocus]);

  // Track if timer already completed to prevent multiple calls
  const timerCompletedRef = React.useRef(false);

  // Check if timer completed
  React.useEffect(() => {
    if (isFocused && activeSession?.focus_duration && !timerCompletedRef.current) {
      const durationSeconds = activeSession.focus_duration * 60;
      if (elapsedTime >= durationSeconds) {
        // Mark as completed to prevent multiple calls
        timerCompletedRef.current = true;
        
        // Timer completed - play alarm once, auto stop, and mark as complete
        playAlarm();
        handleStopClick();
        
        // Mark task as completed
        setIsChecked(true);
        onToggle?.(task.id);
      }
    }
    
    // Reset flag when session changes or ends
    if (!isFocused) {
      timerCompletedRef.current = false;
    }
  }, [elapsedTime, isFocused, activeSession, handleStopClick, playAlarm, onToggle, task.id]);

  async function handleCheckedChange(next: boolean) {
    // If task is being marked as completed and has active timer, stop it first
    if (next && isFocused) {
      try {
        await handleStopClick();
      } catch (error) {
        console.error("Failed to stop timer when completing task:", error);
      }
    }
    
    setIsChecked(next);
    onToggle?.(task.id);
  }

  function handleRemove() {
    onRemove?.(task.id);
  }

  // Format time as MM:SS
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Handle timer button click
  function handleTimerClick() {
    if (!isDisabled && !isFocused) {
      setShowDurationPicker(!showDurationPicker);
    }
  }

  // Handle duration selection
  async function handleDurationSelect(duration: number) {
    setShowDurationPicker(false);
    setCustomDuration("");
    try {
      // Update task with duration first
      await focusService.updateFocusDuration(task.id, duration);
      // Then start the timer immediately
      await startFocus(task.id);
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  }

  // Handle custom duration submission
  async function handleCustomDurationSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duration = parseInt(customDuration, 10);
    
    if (isNaN(duration) || duration <= 0) {
      alert("Please enter a valid duration (positive number)");
      return;
    }
    
    if (duration > 480) {
      alert("Maximum duration is 480 minutes (8 hours)");
      return;
    }
    
    await handleDurationSelect(duration);
  }

  // Handle pause/resume
  async function handlePauseResumeClick() {
    try {
      if (isPaused()) {
        await resumeFocus();
      } else {
        await pauseFocus();
      }
    } catch (error) {
      console.error("Pause/resume failed:", error);
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col w-full rounded-2xl border border-input px-4 py-3 shadow-sm bg-background",
        isDragging && "opacity-0",
        isFocused && "ring-2 ring-blue-500 border-blue-500",
        isDisabled && !isFocused && "opacity-40 pointer-events-none",
        className
      )}
      role="group"
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0 : 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: 300,
        scale: 0.8,
        transition: { duration: 0.2, ease: "easeIn" },
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        layout: { duration: 0.2 },
      }}
      whileHover={{
        scale: isDragging ? 1 : 1.02,
        transition: { duration: 0.1 },
      }}
    >
      {/* Main row */}
      <div className="flex w-full items-center gap-3">
        {/* Drag handle - only show for uncompleted tasks and when not disabled */}
        {!checked && !isDisabled && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="size-5" />
          </div>
        )}

        {/* Checkbox - always enabled so user can check/uncheck */}
        <Checkbox
          checked={isChecked}
          onCheckedChange={(v) => handleCheckedChange(Boolean(v))}
          aria-label={isChecked ? "Mark task as not done" : "Mark task as done"}
          className="size-5 rounded-md"
        />

        <motion.span
          className={cn(
            "flex-1 text-[15px] font-medium text-gray-700",
            isChecked && "line-through text-gray-400"
          )}
          animate={{
            opacity: isChecked ? 0.7 : 1,
            color: isChecked ? "#9ca3af" : "#374151",
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {task.title}
        </motion.span>

        {/* Timer display or button */}
        {!checked && !isFocused && !isDisabled && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Set timer"
            onClick={handleTimerClick}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          >
            <Timer className="size-4" />
          </Button>
        )}

        {/* Show timer countdown when focused */}
        {!checked && isFocused && activeSession && (
          <div className="flex items-center gap-1 text-sm font-mono font-semibold text-blue-600">
            <Timer className="size-4" />
            <span>
              {formatTime(elapsedTime)}
              {activeSession.focus_duration && (
                <span className="text-gray-400">
                  /{formatTime(activeSession.focus_duration * 60)}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Remove button - always visible */}
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Remove task"
          onClick={handleRemove}
          disabled={isDisabled}
          className="text-gray-500 hover:text-gray-900"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Duration picker - show when timer button clicked */}
      {showDurationPicker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-gray-200"
        >
          <p className="text-sm font-medium mb-3 text-gray-700">
            Select Focus Duration
          </p>
          
          {/* Preset durations */}
          <div className="flex flex-wrap gap-2 mb-3">
            {DURATION_OPTIONS.map((option) => (
              <Button
                key={option.label}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleDurationSelect(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Custom duration input */}
          <form onSubmit={handleCustomDurationSubmit} className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="480"
              placeholder="Custom (mins)"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="text-sm h-8"
            />
            <Button
              type="submit"
              size="sm"
              variant="default"
              className="text-xs"
            >
              Start
            </Button>
          </form>
        </motion.div>
      )}

      {/* Timer display - show when focused */}
      {isFocused && activeSession && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {/* Timer display */}
            <div className="flex items-center gap-2">
              <Timer className="size-5 text-blue-500" />
              <span className="text-2xl font-mono font-semibold text-blue-600">
                {formatTime(elapsedTime)}
              </span>
              {activeSession.focus_duration && (
                <span className="text-sm text-gray-500">
                  / {formatTime(activeSession.focus_duration * 60)}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {activeSession.focus_duration && (
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      (elapsedTime / (activeSession.focus_duration * 60)) * 100,
                      100
                    )}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>

          {/* Timer controls */}
          <div className="flex items-center gap-2">
            {/* Pause/Resume button */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePauseResumeClick}
              className="flex items-center gap-1"
            >
              {isPaused() ? (
                <>
                  <Play className="size-3" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="size-3" />
                  Pause
                </>
              )}
            </Button>

            {/* Stop button */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleStopClick}
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <Square className="size-3" />
              Stop
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
