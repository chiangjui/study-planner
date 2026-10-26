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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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

      {/* 手機：議程清單（一天一區塊，依時間排列） */}
      <div className="flex flex-col gap-4 md:hidden">
        {days.map((day, i) => (
          <AgendaDay
            key={day}
            day={day}
            label={WEEKDAY_EN[i]}
            isToday={day === todayStr}
            classes={schedules
              .filter((s) => s.weekday === i + 1)
              .map((s) => ({ ...s, name: data?.courses.find((c) => c.id === s.course_id)?.name ?? "" }))}
            timed={timedTasks.filter((t) => t.due_date === day)}
            allDay={[...dueChips(day), ...planChips(day)]}
            workouts={data?.workouts.filter((w) => w.workout_date === day) ?? []}
            onAdd={() => setDialog({ defaults: { due_date: day } })}
            onEdit={(t) => setDialog({ task: t })}
          />
        ))}
      </div>

      {/* 桌機：一週七天的時間軸 */}
      <div className="-mx-5 hidden overflow-x-auto px-5 md:block">
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

// 手機版議程清單的一天
function AgendaDay({
  day,
  label,
  isToday,
  classes,
  timed,
  allDay,
  workouts,
  onAdd,
  onEdit,
}: {
  day: string;
  label: string;
  isToday: boolean;
  classes: (CourseSchedule & { name: string })[];
  timed: Task[];
  allDay: Task[];
  workouts: Workout[];
  onAdd: () => void;
  onEdit: (t: Task) => void;
}) {
  // 課程和有時間的待辦合在一起，依開始時間排序
  const rows = [
    ...classes.map((s) => ({ kind: "class" as const, start: s.start_time, end: s.end_time, s })),
    ...timed.map((t) => ({ kind: "task" as const, start: t.start_time!, end: t.end_time!, t })),
  ].sort((a, b) => a.start.localeCompare(b.start));
  const empty = rows.length === 0 && allDay.length === 0 && workouts.length === 0;

  return (
    <div>
      <div
        className={`flex items-center justify-between rounded-[4px] pl-3 text-xs tabular-nums ${
          isToday ? "bg-primary text-fg" : "bg-bg/60 text-muted"
        }`}
      >
        <span>
          {label} <span className="opacity-70">{shortDate(day)}</span>
        </span>
        <button onClick={onAdd} className="flex h-11 w-11 items-center justify-center text-base" aria-label={`在 ${shortDate(day)} 新增`}>
          +
        </button>
      </div>

      <ul className="mt-1 flex flex-col">
        {/* 全天：截止項目、預計執行、運動 */}
        {allDay.map((t) => {
          const isPlan = t.due_date !== day;
          return (
            <li key={`${isPlan ? "plan" : "due"}-${t.id}`}>
              <button onClick={() => onEdit(t)} className="flex min-h-11 w-full items-center gap-3 text-left text-sm">
                <span className="w-24 shrink-0 text-xs text-muted">{isPlan ? "預計執行" : t.type === "exam" ? "考試" : "截止"}</span>
                <span className={`truncate ${t.done ? "text-muted line-through" : ""} ${t.type === "exam" && !isPlan ? "text-fg" : ""}`}>
                  {t.title}
                </span>
              </button>
            </li>
          );
        })}
        {workouts.map((w) => (
          <li key={w.id} className="flex min-h-11 items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-xs text-muted">運動</span>
            <span className="truncate">
              {w.kind} {w.duration_minutes}m
            </span>
          </li>
        ))}

        {/* 依時間：課程、有時間的待辦 */}
        {rows.map((r) =>
          r.kind === "class" ? (
            <li key={r.s.id}>
              <Link href={`/course?id=${r.s.course_id}`} className="flex min-h-11 items-center gap-3 border-l-2 border-primary pl-2 text-sm">
                <span className="w-[86px] shrink-0 text-xs tabular-nums text-muted">
                  {shortTime(r.start)}–{shortTime(r.end)}
                </span>
                <span className="min-w-0 flex-1 truncate">{r.s.name}</span>
                <span className="shrink-0 text-xs text-muted">{r.s.room}</span>
              </Link>
            </li>
          ) : (
            <li key={r.t.id}>
              <button
                onClick={() => onEdit(r.t)}
                className={`flex min-h-11 w-full items-center gap-3 border-l-2 pl-2 text-left text-sm ${
                  r.t.type === "exam" ? "border-primary" : "border-secondary"
                } ${r.t.done ? "text-muted line-through" : ""}`}
              >
                <span className="w-[86px] shrink-0 text-xs tabular-nums text-muted">
                  {shortTime(r.start)}–{shortTime(r.end)}
                </span>
                <span className="truncate">
                  {r.t.type === "exam" && "考 · "}
                  {r.t.title}
                </span>
              </button>
            </li>
          ),
        )}

        {empty && <li className="py-2 text-xs text-muted">沒有安排</li>}
      </ul>
    </div>
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
