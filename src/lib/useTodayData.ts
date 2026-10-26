"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addDays, startOfWeek, taipeiDayStart, today } from "@/lib/date";
import {
  DEFAULT_SETTINGS,
  type CourseSchedule,
  type Habit,
  type HabitLog,
  type StudySession,
  type Task,
  type Workout,
} from "@/lib/types";

export type CourseLite = { id: string; name: string };

export type TodayData = {
  date: string; // 今天（台北）
  weekStart: string; // 本週週一
  courses: CourseLite[];
  schedules: CourseSchedule[];
  tasks: Task[]; // 預計今天做、或截止日在今天之後（含今天）的待辦
  sessions: StudySession[]; // 本週讀書紀錄
  settings: typeof DEFAULT_SETTINGS;
  habits: Habit[];
  habitLogs: HabitLog[]; // 本週打卡紀錄
  workouts: Workout[]; // 本週運動紀錄
};

// 今日頁需要的所有資料，一次平行讀取
async function fetchTodayData(): Promise<TodayData> {
  const date = today();
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 7);

  const [courses, schedules, tasks, sessions, settings, habits, habitLogs, workouts] =
    await Promise.all([
      supabase.from("courses").select("id, name").order("created_at"),
      supabase.from("course_schedules").select("*"),
      supabase
        .from("tasks")
        .select("*")
        .or(`planned_date.eq.${date},due_date.gte.${date}`)
        .order("created_at"),
      supabase
        .from("study_sessions")
        .select("*")
        .gte("started_at", taipeiDayStart(weekStart))
        .lt("started_at", taipeiDayStart(weekEnd)),
      supabase.from("user_settings").select("*").maybeSingle(),
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_logs").select("*").gte("log_date", weekStart).lt("log_date", weekEnd),
      supabase.from("workouts").select("*").gte("workout_date", weekStart).lt("workout_date", weekEnd),
    ]);

  // 任何一個查詢失敗就整體顯示錯誤
  const failed = [courses, schedules, tasks, sessions, settings, habits, habitLogs, workouts].find(
    (r) => r.error,
  );
  if (failed?.error) throw new Error(failed.error.message);

  return {
    date,
    weekStart,
    courses: courses.data ?? [],
    schedules: schedules.data ?? [],
    tasks: tasks.data ?? [],
    sessions: sessions.data ?? [],
    // 還沒存過設定就用預設值
    settings: settings.data
      ? {
          daily_goal_hours: Number(settings.data.daily_goal_hours),
          focus_minutes: settings.data.focus_minutes,
          break_minutes: settings.data.break_minutes,
        }
      : DEFAULT_SETTINGS,
    habits: habits.data ?? [],
    habitLogs: habitLogs.data ?? [],
    workouts: workouts.data ?? [],
  };
}

export function useTodayData() {
  const [data, setData] = useState<TodayData | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setData(await fetchTodayData());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // 第一次進入頁面時讀取（離開頁面後才回來的結果就丟掉）
  useEffect(() => {
    let cancelled = false;
    fetchTodayData()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  // app 開著跨過午夜後，切回這個分頁時自動換成新的一天
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && data && data.date !== today()) reload();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [data, reload]);

  return { data, setData, error, reload };
}
