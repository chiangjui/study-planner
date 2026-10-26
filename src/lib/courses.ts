import { shortTime, WEEKDAY_ZH } from "@/lib/date";
import type { CourseSchedule } from "@/lib/types";

// 上課時段顯示文字，例如「週一 13:10–15:00」
export function formatSlot(s: Pick<CourseSchedule, "weekday" | "start_time" | "end_time">) {
  return `週${WEEKDAY_ZH[s.weekday - 1]} ${shortTime(s.start_time)}–${shortTime(s.end_time)}`;
}

// 依星期、開始時間排序
export function sortSlots<T extends Pick<CourseSchedule, "weekday" | "start_time">>(slots: T[]) {
  return [...slots].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
}
