import { addDays } from "@/lib/date";

/**
 * 連續打卡天數
 * - 今天已打卡：從今天往回數
 * - 今天還沒打卡：從昨天往回數（今天還有機會，不算中斷）
 * @param dates 這個習慣所有打卡日期（YYYY-MM-DD）
 */
export function streakOf(dates: Set<string>, today: string): number {
  let day = dates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}
