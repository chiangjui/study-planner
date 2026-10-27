"use client";

// 月行事曆：只顯示課表以外的事件（待辦、考試、行程、預計執行、運動）
// 桌機：在格子空白處點兩下新增、在事件上點兩下編輯；手機：點日期後在下方列表新增或編輯

import { useState } from "react";
import TaskDialog, { type TaskDialogState } from "@/components/TaskDialog";
import PlusIcon from "@/components/PlusIcon";
import { useStore } from "@/lib/store";
import { addDays, addMonths, shortDate, shortTime, startOfMonth, startOfWeek, today, weekdayOf, WEEKDAY_EN } from "@/lib/date";
import type { Task } from "@/lib/types";
import { CATEGORY, taskOnDay, type Category } from "@/lib/categories";

// 一天裡的一個事件：類別決定顏色；plan = 預計執行的日子（虛線框）
type DayEvent = { key: string; label: string; cat: Category; plan: boolean; task?: Task };

export default function MonthCalendar() {
  const todayStr = today();
  const [month, setMonth] = useState(() => startOfMonth(todayStr)); // 這個月的第一天
  const [selected, setSelected] = useState(todayStr); // 手機版：點選的那一天
  const [dialog, setDialog] = useState<TaskDialogState>(null);

  // 月曆格子：從這個月第一天所在那週的週一，到最後一天所在那週的週日
  const monthEnd = addDays(addMonths(month, 1), -1);
  const gridStart = startOfWeek(month);
  const gridEnd = addDays(startOfWeek(monthEnd), 6);
  const days: string[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  // 資料來自本機資料庫（離線也能看）
  const { data } = useStore();

  function eventsOn(day: string): DayEvent[] {
    if (!data) return [];
    const tasks = data.tasks
      .map((t) => ({ t, how: taskOnDay(t, day) }))
      .filter((x) => x.how)
      // 當天的事件在前（依時間），預計執行的在後
      .sort((a, b) => (a.how === b.how ? (a.t.start_time ?? "").localeCompare(b.t.start_time ?? "") : a.how === "event" ? -1 : 1))
      .map(({ t, how }) => ({
        key: `${how}-${t.id}`,
        label: `${how === "event" && t.due_date === day && t.start_time ? `${shortTime(t.start_time)} ` : ""}${t.title}`,
        cat: t.type as Category,
        plan: how === "plan",
        task: t,
      }));
    const workouts = data.workouts
      .filter((w) => w.workout_date === day)
      .map((w) => ({ key: `w-${w.id}`, label: `${w.kind} ${w.duration_minutes}m`, cat: "workout" as const, plan: false }));
    return [...tasks, ...workouts];
  }

  const chipClass = (e: DayEvent) => (e.plan ? CATEGORY[e.cat].plan : `${CATEGORY[e.cat].chip} text-fg`);

  function changeMonth(n: number) {
    const next = addMonths(month, n);
    setMonth(next);
    setSelected(next === startOfMonth(todayStr) ? todayStr : next);
  }

  const done = (e: DayEvent) => Boolean(e.task?.done);
  const selectedEvents = eventsOn(selected);

  return (
    // 手機上內距與格子間距小一點，讓每一格至少 44px 寬
    <section className="rounded-card bg-card p-3 md:p-5">
      {/* 月份切換 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm tabular-nums">
          {month.slice(0, 4)} / {Number(month.slice(5, 7))}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setDialog({ defaults: { due_date: selected } })} className="btn-primary mr-2 whitespace-nowrap">
            + New
          </button>
          <NavButton onClick={() => changeMonth(-1)} label="上個月">‹</NavButton>
          <button
            onClick={() => {
              setMonth(startOfMonth(todayStr));
              setSelected(todayStr);
            }}
            className="h-11 whitespace-nowrap rounded-[4px] px-3 text-xs uppercase tracking-[0.1em] text-muted hover:bg-line hover:text-fg"
          >
            This month
          </button>
          <NavButton onClick={() => changeMonth(1)} label="下個月">›</NavButton>
        </div>
      </div>

      {/* 星期列 */}
      <div className="grid grid-cols-7 gap-0.5 pb-1 md:gap-1">
        {WEEKDAY_EN.map((d) => (
          <p key={d} className="px-1 text-[10px] uppercase tracking-[0.1em] text-muted">
            {d}
          </p>
        ))}
      </div>

      {/* 月曆格子 */}
      <div className="grid grid-cols-7 gap-0.5 md:gap-1">
        {days.map((day) => {
          const inMonth = day >= month && day <= monthEnd;
          const isToday = day === todayStr;
          const events = eventsOn(day);
          return (
            <div key={day} className={`min-w-0 rounded-[4px] ${inMonth ? "bg-bg/50" : "bg-bg/20"}`}>
              {/* 手機：日期 + 小圓點，點了在下方列出當天事件 */}
              <button
                onClick={() => setSelected(day)}
                className={`flex h-12 w-full flex-col items-center justify-center gap-1 rounded-[4px] md:hidden ${
                  selected === day ? "ring-1 ring-fg/60" : ""
                }`}
                aria-label={shortDate(day)}
              >
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs tabular-nums ${
                    isToday ? "bg-primary text-fg" : inMonth ? "" : "text-muted/50"
                  }`}
                >
                  {Number(day.slice(8))}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {events.slice(0, 3).map((e) => (
                    <span key={e.key} className={`h-1.5 w-1.5 rounded-full ${CATEGORY[e.cat].dot}`} />
                  ))}
                </span>
              </button>

              {/* 桌機：直接列出事件；空白處點兩下新增 */}
              <div
                onDoubleClick={() => setDialog({ defaults: { due_date: day } })}
                title="點兩下新增"
                className="hidden min-h-28 cursor-default select-none flex-col gap-1 p-1.5 md:flex"
              >
                <div className="flex items-center">
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums ${
                      isToday ? "bg-primary text-fg" : inMonth ? "text-fg" : "text-muted/50"
                    }`}
                  >
                    {Number(day.slice(8))}
                  </span>
                </div>
                {events.slice(0, 3).map((e) => (
                  <div
                    key={e.key}
                    title={e.task ? `${e.label}（點兩下編輯）` : e.label}
                    // 在事件上點兩下 → 編輯（不會觸發格子的「新增」）
                    onDoubleClick={(ev) => {
                      ev.stopPropagation();
                      if (e.task) setDialog({ task: e.task });
                    }}
                    className={`truncate px-1.5 py-0.5 text-[11px] ${e.plan ? "rounded-[4px]" : ""} ${chipClass(e)} ${
                      done(e) ? "line-through opacity-50" : ""
                    }`}
                  >
                    {e.label}
                  </div>
                ))}
                {events.length > 3 && <p className="px-1.5 text-[10px] text-muted">+{events.length - 3}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* 手機：點選那一天的事件 */}
      <div className="mt-4 md:hidden">
        <div className="flex items-center justify-between border-b border-line text-xs tabular-nums text-muted">
          <span>
            {WEEKDAY_EN[weekdayOf(selected) - 1]} {shortDate(selected)}
          </span>
          <button
            onClick={() => setDialog({ defaults: { due_date: selected } })}
            className="flex h-11 w-11 items-center justify-center text-base text-fg"
            aria-label={`在 ${shortDate(selected)} 新增`}
          >
            <PlusIcon />
          </button>
        </div>
        {selectedEvents.length === 0 ? (
          <p className="py-3 text-xs text-muted">沒有安排</p>
        ) : (
          <ul>
            {selectedEvents.map((e) => (
              <li key={e.key}>
                <button
                  disabled={!e.task}
                  onClick={() => e.task && setDialog({ task: e.task })}
                  className="flex min-h-11 w-full items-center gap-3 text-left text-sm"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY[e.cat].dot}`} />
                  <span className="w-16 shrink-0 text-xs text-muted">{e.plan ? "預計執行" : CATEGORY[e.cat].label}</span>
                  <span className={`truncate ${done(e) ? "text-muted line-through" : ""}`}>{e.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TaskDialog
        state={dialog}
        courses={data?.courses.map((c) => ({ id: c.id, name: c.name })) ?? []}
        onClose={() => setDialog(null)}
      />
    </section>
  );
}

function NavButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
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
