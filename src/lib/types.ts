// 對應 supabase/schema.sql 的資料表型別
// 日期（date）在前端是 "YYYY-MM-DD" 字串，時間（time）是 "HH:MM:SS" 字串

export type GradingItem = { item: string; percent: number };
export type WeeklyTopic = { week: number; date: string; topic: string };

export type Course = {
  id: string;
  user_id: string;
  name: string;
  teacher: string | null;
  credits: number;
  grading: GradingItem[];
  weekly_topics: WeeklyTopic[];
  notes: string | null;
  created_at: string;
};

export type CourseSchedule = {
  id: string;
  user_id: string;
  course_id: string;
  weekday: number; // 1 = 週一 … 7 = 週日
  start_time: string;
  end_time: string;
  period_label: string | null;
  room: string | null;
};

export type TaskType = "homework" | "exam" | "report" | "general";

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  homework: "作業",
  exam: "考試",
  report: "報告",
  general: "一般",
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  course_id: string | null;
  type: TaskType;
  due_date: string | null;
  planned_date: string | null; // 預計執行第一天
  planned_end_date: string | null; // 預計執行最後一天（可以跨多天）
  start_time: string | null; // 有時間的話會排進行事曆時間軸
  end_time: string | null;
  done: boolean; // 整筆完成
  done_dates?: string[]; // 跨多天的待辦：已完成的日期（舊資料可能沒有這個欄位）
  created_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  course_id: string | null;
  started_at: string;
  duration_minutes: number;
  created_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
};

export type Workout = {
  id: string;
  user_id: string;
  workout_date: string;
  kind: string;
  duration_minutes: number;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  daily_goal_hours: number;
  focus_minutes: number;
  break_minutes: number;
  updated_at: string;
};

// 這個待辦的預計執行範圍是否包含某一天
export function isPlannedOn(task: Task, date: string) {
  if (!task.planned_date) return false;
  return task.planned_date <= date && (task.planned_end_date ?? task.planned_date) >= date;
}

// 跨多天的預計執行（例如 27–29）
export function isMultiDayPlan(task: Task) {
  return Boolean(task.planned_date && task.planned_end_date && task.planned_end_date > task.planned_date);
}

// 這一天的勾選是「只代表這一天」：跨多天的預計執行、而且這天不是截止日
export function isDayLevel(task: Task, date: string) {
  return isMultiDayPlan(task) && isPlannedOn(task, date) && task.due_date !== date;
}

// 這個待辦在某一天算不算已完成：整筆完成，或那一天已勾選
export function isDoneOn(task: Task, date: string) {
  return task.done || (task.done_dates ?? []).includes(date);
}

// 還沒存過設定時使用的預設值（與 schema.sql 的 default 一致）
export const DEFAULT_SETTINGS = {
  daily_goal_hours: 4,
  focus_minutes: 25,
  break_minutes: 5,
};
