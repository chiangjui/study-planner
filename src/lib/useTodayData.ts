"use client";

import { useStore } from "@/lib/store";
import { addDays, startOfWeek, taipeiDate, today } from "@/lib/date";
import { DEFAULT_SETTINGS, isPlannedOn, type CourseSchedule, type Habit, type HabitLog, type StudySession, type Task, type Workout } from "@/lib/types";

export type CourseLite = { id: string; name: string };

export type TodayData = {
  date: string; // 今天（台北）
  weekStart: string; // 本週週一
  courses: CourseLite[];
  schedules: CourseSchedule[];
  tasks: Task[]; // 預計執行範圍包含今天、或截止日在今天之後（含今天）的待辦
  sessions: StudySession[]; // 本週讀書紀錄
  settings: typeof DEFAULT_SETTINGS;
  habits: Habit[];
  habitLogs: HabitLog[]; // 本週打卡紀錄
  workouts: Workout[]; // 本週運動紀錄
};

const byCreated = (a: { created_at: string }, b: { created_at: string }) => a.created_at.localeCompare(b.created_at);

// 今日頁需要的資料：從本機資料庫篩選出來（離線也能用）
export function useTodayData(): TodayData | null {
  const { data: db } = useStore();
  if (!db) return null;

  // 每次畫面更新都重新算「今天」，跨過午夜後切回來就會是新的一天
  const date = today();
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 7);
  const settings = db.user_settings[0];

  return {
    date,
    weekStart,
    courses: [...db.courses].sort(byCreated).map((c) => ({ id: c.id, name: c.name })),
    schedules: db.course_schedules,
    tasks: db.tasks.filter((t) => isPlannedOn(t, date) || (t.due_date && t.due_date >= date)).sort(byCreated),
    sessions: db.study_sessions.filter((s) => {
      const day = taipeiDate(new Date(s.started_at));
      return day >= weekStart && day < weekEnd;
    }),
    // 還沒存過設定就用預設值
    settings: settings
      ? {
          daily_goal_hours: Number(settings.daily_goal_hours),
          focus_minutes: settings.focus_minutes,
          break_minutes: settings.break_minutes,
        }
      : DEFAULT_SETTINGS,
    habits: [...db.habits].sort(byCreated),
    habitLogs: db.habit_logs.filter((l) => l.log_date >= weekStart && l.log_date < weekEnd),
    workouts: db.workouts.filter((w) => w.workout_date >= weekStart && w.workout_date < weekEnd),
  };
}
