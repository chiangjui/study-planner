// 今日待辦的「×」要做什麼

import { addDays } from "@/lib/date";
import { isPlannedOn, type Task } from "@/lib/types";

/**
 * - "skip"：只把今天從預計執行拿掉（待辦保留），例如 27–29 → 28–29
 * - "delete"：刪除整筆待辦（今天就是截止日；或預計執行只有今天、又沒有截止日）
 */
export function todayRemoval(task: Task, date: string): "skip" | "delete" {
  if (task.due_date === date) return "delete";
  if (!isPlannedOn(task, date)) return "delete";
  const end = task.planned_end_date ?? task.planned_date;
  const onlyToday = task.planned_date === date && end === date;
  return onlyToday && !task.due_date ? "delete" : "skip";
}

// 把今天從預計執行拿掉後的新範圍
// （預計執行只能是一段連續日期；今天在中間時，前面的日子已經過去了，所以從明天開始）
export function skipDayPatch(task: Task, date: string): Pick<Task, "planned_date" | "planned_end_date"> {
  const start = task.planned_date!;
  const end = task.planned_end_date ?? start;
  if (start === end) return { planned_date: null, planned_end_date: null };
  if (date === end) return { planned_date: start, planned_end_date: addDays(date, -1) };
  return { planned_date: addDays(date, 1), planned_end_date: end };
}
