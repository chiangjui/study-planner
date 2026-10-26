"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePomodoro } from "@/lib/pomodoro";
import { useTodayData } from "@/lib/useTodayData";
import type { Habit, Task } from "@/lib/types";
import TaskDialog, { applyTaskChange, type TaskChange, type TaskDialogState } from "@/components/TaskDialog";
import TopBar from "@/components/today/TopBar";
import TodayTasksCard from "@/components/today/TodayTasksCard";
import PomodoroCard from "@/components/today/PomodoroCard";
import HabitsCard from "@/components/today/HabitsCard";
import { DeadlinesCard, ProgressCard, StudyHoursCard, WorkoutCard } from "@/components/today/StatCards";
import { HabitRateCard, WeeklyStudyCard } from "@/components/today/ChartCards";

// 今日頁：Bento Grid 儀表板
export default function TodayPage() {
  const { data, setData, error, reload } = useTodayData();
  const { onRecorded } = usePomodoro();
  const [dialog, setDialog] = useState<TaskDialogState>(null);

  // 番茄鐘記錄了一筆讀書紀錄 → 直接加進畫面，讀書時數與長條圖會即時更新
  useEffect(
    () => onRecorded((session) => setData((d) => d && { ...d, sessions: [...d.sessions, session] })),
    [onRecorded, setData],
  );

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm text-secondary">讀取資料失敗：{error}</p>
        <button className="btn-primary" onClick={reload}>
          Retry
        </button>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="card-title">Loading…</p>
      </main>
    );
  }

  const { date } = data;
  // 今日待辦 = 預計執行日是今天 + 今天截止
  const todayTasks = data.tasks.filter((t) => t.planned_date === date || t.due_date === date);

  // 勾選／取消待辦：先更新畫面再寫入資料庫，失敗就重新讀取還原
  async function toggleTask(task: Task) {
    setData((d) => d && { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)) });
    const { error } = await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
    if (error) reload();
  }

  // 快速新增：預計執行日設為今天
  async function addTask(title: string) {
    const { data: row, error } = await supabase
      .from("tasks")
      .insert({ title, planned_date: date })
      .select()
      .single();
    if (error) return alert(`新增失敗：${error.message}`);
    setData((d) => d && { ...d, tasks: [...d.tasks, row] });
  }

  // 編輯視窗存檔或刪除後，更新畫面上的待辦
  function handleTaskChange(change: TaskChange) {
    setData((d) => d && { ...d, tasks: applyTaskChange(d.tasks, change) });
  }

  // 習慣打卡：今天已打卡就刪除那筆，否則新增一筆
  async function toggleHabit(habit: Habit) {
    const existing = data!.habitLogs.find((l) => l.habit_id === habit.id && l.log_date === date);
    if (existing) {
      setData((d) => d && { ...d, habitLogs: d.habitLogs.filter((l) => l.id !== existing.id) });
      const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
      if (error) reload();
    } else {
      const { data: row, error } = await supabase
        .from("habit_logs")
        .insert({ habit_id: habit.id, log_date: date })
        .select()
        .single();
      if (error) return reload();
      setData((d) => d && { ...d, habitLogs: [...d.habitLogs, row] });
    }
  }

  return (
    <main className="mx-auto max-w-[1360px] px-4 py-4 md:px-8 md:py-6">
      <TopBar data={data} />

      {/*
        桌機（≥1280px）4 欄格狀版面；平板 2 欄；手機 1 欄。
        手機版依 DOM 順序排列，所以今日待辦、番茄鐘放最前面。
      */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:auto-rows-[minmax(180px,auto)] xl:grid-cols-4">
        <TodayTasksCard
          className="md:col-span-2 xl:row-span-2"
          tasks={todayTasks}
          date={date}
          courses={data.courses}
          onToggle={toggleTask}
          onAdd={addTask}
          onEdit={(task) => setDialog({ task })}
        />
        <PomodoroCard
          className="xl:row-span-2"
          courses={data.courses}
          focusMinutes={data.settings.focus_minutes}
          breakMinutes={data.settings.break_minutes}
        />
        <ProgressCard tasks={todayTasks} />
        <StudyHoursCard sessions={data.sessions} date={date} goalHours={data.settings.daily_goal_hours} />
        <DeadlinesCard
          className="xl:row-span-2"
          tasks={data.tasks}
          date={date}
          courses={data.courses}
          onAdd={() => setDialog({ defaults: { type: "homework" } })}
          onEdit={(task) => setDialog({ task })}
        />
        <WeeklyStudyCard className="md:col-span-2" sessions={data.sessions} courses={data.courses} />
        <HabitRateCard
          className="xl:row-span-2"
          habits={data.habits}
          logs={data.habitLogs}
          date={date}
          weekStart={data.weekStart}
        />
        <HabitsCard habits={data.habits} logs={data.habitLogs} date={date} onToggle={toggleHabit} />
        <WorkoutCard workouts={data.workouts} date={date} />
      </div>

      <TaskDialog state={dialog} courses={data.courses} onClose={() => setDialog(null)} onChange={handleTaskChange} />
    </main>
  );
}
