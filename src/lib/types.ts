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
  planned_date: string | null;
  done: boolean;
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

// 還沒存過設定時使用的預設值（與 schema.sql 的 default 一致）
export const DEFAULT_SETTINGS = {
  daily_goal_hours: 4,
  focus_minutes: 25,
  break_minutes: 5,
};
