import type { Priority, RowColorTheme, RowColors } from "@/types";

export const PRIORITY_ORDER: Priority[] = [
  "very_urgent",
  "urgent",
  "medium",
  "low",
  "queue",
];

const INDICATOR_CLASSES: Record<RowColorTheme, string> = {
  red: "bg-red-400",
  yellow: "bg-yellow-400",
  blue: "bg-blue-400",
  green: "bg-green-400",
  purple: "bg-purple-400",
};

const DEFAULT_ROW_COLORS: RowColors = {
  very_urgent: "red",
  urgent: "yellow",
  medium: "blue",
  low: "green",
  queue: "purple",
};

export function getPriorityIndicatorClass(
  priority: Priority,
  rowColors: RowColors | null | undefined,
): string {
  const theme = rowColors?.[priority] ?? DEFAULT_ROW_COLORS[priority];
  return INDICATOR_CLASSES[theme];
}

export const ROW_COLOR_OPTIONS: { value: RowColorTheme; label: string }[] = [
  { value: "red", label: "Red" },
  { value: "yellow", label: "Yellow" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
];

export { DEFAULT_ROW_COLORS };
