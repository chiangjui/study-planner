"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TaskDialog, { type TaskDialogState } from "@/components/TaskDialog";
import { supabase } from "@/lib/supabase";
import { addDays, shortDate, shortTime, startOfWeek, today, WEEKDAY_EN } from "@/lib/date";
import { isPlannedOn, type CourseSchedule, type Task, type Workout } from "@/lib/types";
import type { CourseLite } from "@/lib/useTodayData";

const HOUR_PX = 48; // 時間軸每小時的高度

type WeekData = {
  courses: CourseLite[];
  schedules: CourseSchedule[];
  tasks: Task[];
  workouts: Workout[];
};

// "13:10:00" → 13.1667（小時）
function toHours(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

async function fetchWeek(weekStart: string): Promise<WeekData> {
  const weekEnd = addDays(weekStart, 6);
  const [courses, schedules, tasks, workouts] = await Promise.all([
    supabase.from("courses").select("id, name"),
    supabase.from("course_schedules").select("*"),
    // 截止日在這一週、或預計執行範圍和這一週有重疊的待辦
    supabase
      .from("tasks")
      .select("*")
      .or(
        `and(due_date.gte.${weekStart},due_date.lte.${weekEnd}),and(planned_date.lte.${weekEnd},planned_end_date.gte.${weekStart}),and(planned_date.gte.${weekStart},planned_date.lte.${weekEnd})`,
      ),
    supabase.from("workouts").select("*").gte("workout_date", weekStart).lte("workout_date", weekEnd),
  ]);
  return {
    courses: courses.data ?? [],
    schedules: schedules.data ?? [],
    tasks: tasks.data ?? [],
    workouts: workouts.data ?? [],
  };
}

export default function WeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()));
  const [data, setData] = useState<WeekData | null>(null);
  const [dialog, setDialog] = useState<TaskDialogState>(null);
  const [version, setVersion] = useState(0); // 新增／編輯待辦後 +1，重新讀取這一週
  const todayStr = today();

  useEffect(() => {
    let cancelled = false;
    fetchWeek(weekStart).then((d) => !cancelled && setData(d));
    return () => {
      cancelled = true;
    };
  }, [weekStart, version]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const schedules = data?.schedules ?? [];
  // 有時間的待辦：排進時間軸（在 due_date 那一天）
  const timedTasks = (data?.tasks ?? []).filter((t) => t.start_time && t.end_time && t.due_date);

  // 時間軸範圍：預設 8:00–18:00，有更早或更晚的課／行程就延長
  const timeBlocks = [...schedules, ...timedTasks.map((t) => ({ start_time: t.start_time!, end_time: t.end_time! }))];
  const startHour = Math.min(8, ...timeBlocks.map((s) => Math.floor(toHours(s.start_time))));
  const endHour = Math.max(18, ...timeBlocks.map((s) => Math.ceil(toHours(s.end_time))));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // 上方欄位：沒有時間的截止項目（實心），以及預計執行的日子（虛線框）
  const dueChips = (day: string) => data?.tasks.filter((t) => t.due_date === day && !t.start_time) ?? [];
  const planChips = (day: string) => data?.tasks.filter((t) => isPlannedOn(t, day) && t.due_date !== day) ?? [];

  return (
    <section className="rounded-card bg-card p-5">
      {/* 週切換 */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm tabular-nums">
          {shortDate(days[0])} – {shortDate(days[6])}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDialog({ defaults: { due_date: todayStr } })}
            className="btn-primary mr-2"
          >
            + New
          </button>
          <WeekButton onClick={() => setWeekStart(addDays(weekStart, -7))} label="上一週">
            ‹
          </WeekButton>
          <button
            onClick={() => setWeekStart(startOfWeek(today()))}
            className="h-11 rounded-[4px] px-3 text-xs uppercase tracking-[0.1em] text-muted hover:bg-line hover:text-fg"
          >
            This week
          </button>
          <WeekButton onClick={() => setWeekStart(addDays(weekStart, 7))} label="下一週">
            ›
          </WeekButton>
        </div>
      </div>

      {/* 手機寬度不夠時可以左右滑動 */}
      <div className="-mx-5 overflow-x-auto px-5">
        <div className="min-w-[760px]">
          {/* 星期列 + 當天的待辦／考試／運動 */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-x-1">
            <div />
            {days.map((day, i) => {
              const isToday = day === todayStr;
              const dayTasks = dueChips(day);
              const dayPlans = planChips(day);
              const dayWorkouts = data?.workouts.filter((w) => w.workout_date === day) ?? [];
              return (
                <div key={day} className="flex min-w-0 flex-col gap-1 pb-2">
                  <div
                    className={`flex min-w-0 items-center justify-between gap-1 rounded-[4px] pl-2 text-xs tabular-nums ${
                      isToday ? "bg-primary text-fg" : "text-muted"
                    }`}
                  >
                    <span className="truncate whitespace-nowrap">
                      {WEEKDAY_EN[i]} <span className="opacity-70">{shortDate(day)}</span>
                    </span>
                    {/* 在這一天新增：截止日預設為這一天 */}
                    <button
                      onClick={() => setDialog({ defaults: { due_date: day } })}
                      className="flex h-8 w-7 shrink-0 items-center justify-center rounded-[4px] opacity-60 hover:bg-fg/10 hover:opacity-100"
                      aria-label={`在 ${shortDate(day)} 新增`}
                    >
                      +
                    </button>
                  </div>
                  {dayTasks.map((t) => (
                    <button
                      key={t.id}
                      title={t.title}
                      onClick={() => setDialog({ task: t })}
                      className={`truncate rounded-[4px] px-2 py-1 text-left text-[11px] hover:opacity-80 ${
                        t.type === "exam" ? "bg-primary text-fg" : "bg-line"
                      } ${t.done ? "text-muted line-through opacity-60" : ""}`}
                    >
                      {t.type === "exam" && "考 · "}
                      {t.title}
                    </button>
                  ))}
                  {dayPlans.map((t) => (
                    <button
                      key={`plan-${t.id}`}
                      title={`預計執行：${t.title}`}
                      onClick={() => setDialog({ task: t })}
                      className={`truncate rounded-[4px] border border-dashed border-muted/50 px-2 py-1 text-left text-[11px] text-muted hover:text-fg ${
                        t.done ? "line-through opacity-60" : ""
                      }`}
                    >
                      {t.title}
                    </button>
                  ))}
                  {dayWorkouts.map((w) => (
                    <p key={w.id} className="truncate rounded-[4px] bg-secondary px-2 py-1 text-[11px] text-bg">
                      {w.kind} {w.duration_minutes}m
                    </p>
                  ))}
                </div>
              );
            })}
          </div>

          {/* 時間軸 */}
          <div className="relative grid grid-cols-[48px_repeat(7,1fr)] gap-x-1 border-t border-line">
            {/* 左側時間刻度 */}
            <div>
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="pt-1 text-[10px] tabular-nums text-muted">
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {days.map((day, i) => {
              const weekday = i + 1;
              const isToday = day === todayStr;
              return (
                <div
                  key={day}
                  className={`relative ${isToday ? "bg-bg/40" : ""}`}
                  style={{ height: hours.length * HOUR_PX }}
                >
                  {/* 每小時的分隔線 */}
                  {hours.map((h, idx) => (
                    <div key={h} className="absolute inset-x-0 border-t border-line/60" style={{ top: idx * HOUR_PX }} />
                  ))}

                  {/* 課程區塊：依開始時間與長度定位 */}
                  {schedules
                    .filter((s) => s.weekday === weekday)
                    .map((s) => {
                      const course = data?.courses.find((c) => c.id === s.course_id);
                      const top = (toHours(s.start_time) - startHour) * HOUR_PX;
                      const height = (toHours(s.end_time) - toHours(s.start_time)) * HOUR_PX;
                      return (
                        <Link
                          key={s.id}
                          href={`/course?id=${s.course_id}`}
                          className="absolute inset-x-0.5 overflow-hidden rounded-[4px] border-l-2 border-primary bg-line px-2 py-1 transition-colors hover:bg-[#38383d]"
                          style={{ top, height }}
                        >
                          <p className="truncate text-[11px] leading-tight">{course?.name}</p>
                          <p className="truncate text-[10px] leading-tight text-muted">
                            {shortTime(s.start_time)}
                            {s.room && ` · ${s.room}`}
                          </p>
                        </Link>
                      );
                    })}

                  {/* 有時間的待辦／考試／行程：和課程重疊時靠右半邊顯示 */}
                  {timedTasks
                    .filter((t) => t.due_date === day)
                    .map((t) => {
                      const start = toHours(t.start_time!);
                      const end = toHours(t.end_time!);
                      const overlapsClass = schedules.some(
                        (s) => s.weekday === weekday && toHours(s.start_time) < end && toHours(s.end_time) > start,
                      );
                      return (
                        <button
                          key={t.id}
                          onClick={() => setDialog({ task: t })}
                          className={`absolute right-0.5 z-10 overflow-hidden rounded-[4px] px-2 py-1 text-left hover:opacity-90 ${
                            overlapsClass ? "left-[45%]" : "left-0.5"
                          } ${t.type === "exam" ? "bg-primary text-fg" : "bg-secondary text-bg"} ${
                            t.done ? "opacity-50 line-through" : ""
                          }`}
                          style={{ top: (start - startHour) * HOUR_PX, height: (end - start) * HOUR_PX }}
                        >
                          <p className="truncate text-[11px] leading-tight">{t.title}</p>
                          <p className="truncate text-[10px] leading-tight opacity-70">
                            {shortTime(t.start_time!)}–{shortTime(t.end_time!)}
                          </p>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TaskDialog
        state={dialog}
        courses={data?.courses ?? []}
        onClose={() => setDialog(null)}
        onChange={() => setVersion((v) => v + 1)}
      />
    </section>
  );
}

function WeekButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-[4px] text-lg text-muted hover:bg-line hover:text-fg"
    >
      {children}
    </button>
  );
}
