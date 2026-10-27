// 日期工具：全部以 Asia/Taipei 為準
// 日期字串格式一律是 "YYYY-MM-DD"，和資料庫的 date 欄位一致

const TZ = "Asia/Taipei";

export const WEEKDAY_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const WEEKDAY_ZH = ["一", "二", "三", "四", "五", "六", "日"];

// 某個時間點在台北是哪一天，例如 "2026-10-27"
export function taipeiDate(at: Date = new Date()): string {
  // en-CA 的日期格式剛好是 YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(at);
}

// 今天（台北）
export function today(): string {
  return taipeiDate();
}

// 現在台北時間 "HH:MM"，用來和課表的 start_time / end_time 比較
export function taipeiTime(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at);
}

// 日期字串加減天數
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 星期幾：1 = 週一 … 7 = 週日（和 course_schedules.weekday 一致）
export function weekdayOf(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = 週日
  return day === 0 ? 7 : day;
}

// 兩個日期相差幾天（to - from），例如明天 = 1
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

// 這個日期所在那週的週一
export function startOfWeek(date: string): string {
  return addDays(date, 1 - weekdayOf(date));
}

// 台北某天 00:00 的時間點（ISO 字串），用來查詢 timestamptz 欄位的範圍
export function taipeiDayStart(date: string): string {
  return `${date}T00:00:00+08:00`;
}

// "13:10:00" → "13:10"
export function shortTime(time: string): string {
  return time.slice(0, 5);
}

// "2026-10-27" → "10/27"
export function shortDate(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

// 這個日期所在月份的第一天，例如 "2026-10-27" → "2026-10-01"
export function startOfMonth(date: string): string {
  return `${date.slice(0, 8)}01`;
}

// 月份加減（回傳那個月的第一天）
export function addMonths(date: string, months: number): string {
  const d = new Date(`${startOfMonth(date)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
