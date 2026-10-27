"use client";

import { useState } from "react";
import { deleteRow, insertRow, saveSettings, updateRow } from "@/lib/store";
import { useTodayData } from "@/lib/useTodayData";
import { isPlannedOn, type Habit, type Task } from "@/lib/types";
import StoreLoading from "@/components/StoreLoading";
import TaskDialog, { type TaskDialogState } from "@/components/TaskDialog";
import TopBar from "@/components/today/TopBar";
import TodayTasksCard from "@/components/today/TodayTasksCard";
import PomodoroCard from "@/components/today/PomodoroCard";
import HabitsCard from "@/components/today/HabitsCard";
import { DeadlinesCard, ProgressCard, StudyHoursCard, WorkoutCard } from "@/components/today/StatCards";
import { HabitRateCard, WeeklyStudyCard } from "@/components/today/ChartCards";

// 今日頁：Bento Grid 儀表板
// 資料讀寫都經過本機資料庫（store），離線也能用，上線後自動同步
export default function TodayPage() {
  const data = useTodayData();
  const [dialog, setDialog] = useState<TaskDialogState>(null);

  if (!data) return <StoreLoading />;

  const { date } = data;
  // 今日待辦 = 預計執行範圍包含今天 + 今天截止
  const todayTasks = data.tasks.filter((t) => isPlannedOn(t, date) || t.due_date === date);

  // 勾選／取消待辦
  function toggleTask(task: Task) {
    updateRow("tasks", task.id, { done: !task.done });
  }

  // 快速新增：預計執行日設為今天
  async function addTask(title: string) {
    insertRow("tasks", {
      title,
      type: "general",
      course_id: null,
      due_date: null,
      planned_date: date,
      planned_end_date: date,
      start_time: null,
      end_time: null,
      done: false,
    });
  }

  // 習慣打卡：今天已打卡就刪除那筆，否則新增一筆
  function toggleHabit(habit: Habit) {
    const existing = data!.habitLogs.find((l) => l.habit_id === habit.id && l.log_date === date);
    if (existing) deleteRow("habit_logs", existing.id);
    else insertRow("habit_logs", { habit_id: habit.id, log_date: date });
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
          onTimesChange={(focus, brk) => saveSettings({ focus_minutes: focus, break_minutes: brk })}
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

      <TaskDialog state={dialog} courses={data.courses} onClose={() => setDialog(null)} />
    </main>
  );
}
