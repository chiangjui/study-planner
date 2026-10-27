// 行事曆事件類別與顏色（顏色定義在 globals.css 的 --color-cat-*）
// class 字串要完整寫出來，Tailwind 才掃描得到

import { isPlannedOn, type Task, type TaskType } from "@/lib/types";

export type Category = "class" | TaskType | "workout";

export const CATEGORY: Record<
  Category,
  {
    label: string;
    chip: string; // 一般事件：淡淡的底色 + 左邊色條
    plan: string; // 預計執行：同色虛線框
    dot: string; // 小圓點（手機月曆、圖例）
  }
> = {
  class: {
    label: "課程",
    chip: "bg-cat-class/25 border-l-2 border-cat-class",
    plan: "border border-dashed border-cat-class/70 text-muted",
    dot: "bg-cat-class",
  },
  exam: {
    label: "考試",
    chip: "bg-cat-exam/25 border-l-2 border-cat-exam",
    plan: "border border-dashed border-cat-exam/70 text-muted",
    dot: "bg-cat-exam",
  },
  homework: {
    label: "作業",
    chip: "bg-cat-homework/25 border-l-2 border-cat-homework",
    plan: "border border-dashed border-cat-homework/70 text-muted",
    dot: "bg-cat-homework",
  },
  report: {
    label: "報告",
    chip: "bg-cat-report/25 border-l-2 border-cat-report",
    plan: "border border-dashed border-cat-report/70 text-muted",
    dot: "bg-cat-report",
  },
  general: {
    label: "一般",
    chip: "bg-cat-general/25 border-l-2 border-cat-general",
    plan: "border border-dashed border-cat-general/70 text-muted",
    dot: "bg-cat-general",
  },
  workout: {
    label: "運動",
    chip: "bg-cat-workout/25 border-l-2 border-cat-workout",
    plan: "border border-dashed border-cat-workout/70 text-muted",
    dot: "bg-cat-workout",
  },
};

export const CATEGORY_ORDER: Category[] = ["class", "exam", "homework", "report", "general", "workout"];

/**
 * 這個待辦在某一天要怎麼顯示
 * - "event"：當天的事件（截止日是這天；或沒有截止日、但預計執行包含這天）
 * - "plan"：有截止日在別天，這天是預計執行的日子 → 虛線框
 * - null：這天不顯示
 */
export function taskOnDay(t: Task, day: string): "event" | "plan" | null {
  if (t.due_date === day) return "event";
  if (!isPlannedOn(t, day)) return null;
  return t.due_date ? "plan" : "event";
}
