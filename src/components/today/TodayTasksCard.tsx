"use client";

import { useState } from "react";
import Card, { Empty } from "@/components/Card";
import Checkbox from "@/components/Checkbox";
import ConfirmButton from "@/components/ConfirmButton";
import PlusIcon from "@/components/PlusIcon";
import { daysBetween, shortTime } from "@/lib/date";
import { isDoneOn, type Task } from "@/lib/types";
import { todayRemoval } from "@/lib/tasks";
import type { CourseLite } from "@/lib/useTodayData";

type Props = {
  tasks: Task[]; // 已經篩選好的今日待辦
  date: string;
  courses: CourseLite[];
  onToggle: (task: Task) => void;
  onAdd: (title: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onRemove: (task: Task) => void; // 從今天移除：只拿掉今天的預計執行，或刪除整筆
  className?: string;
};

export default function TodayTasksCard({ tasks, date, courses, onToggle, onAdd, onEdit, onRemove, className }: Props) {
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  // 今天未完成的排前面；有時間的依時間排
  const doneToday = (t: Task) => isDoneOn(t, date);
  const sorted = [...tasks].sort(
    (a, b) => Number(doneToday(a)) - Number(doneToday(b)) || (a.start_time ?? "99").localeCompare(b.start_time ?? "99"),
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    setAdding(true);
    await onAdd(text);
    setTitle("");
    setAdding(false);
  }

  return (
    <Card title="Today's tasks" className={className}>
      <ul className="-mx-2 flex-1">
        {sorted.length === 0 && (
          <li className="px-2 py-2">
            <Empty>今天沒有待辦，在下面新增一項吧</Empty>
          </li>
        )}
        {sorted.map((task) => {
          const course = courses.find((c) => c.id === task.course_id);
          return (
            <li key={task.id} className="group flex items-center rounded-[4px] hover:bg-bg/40">
              <Checkbox checked={doneToday(task)} onChange={() => onToggle(task)} label={task.title} />
              {/* 點標題開啟編輯視窗 */}
              <button
                onClick={() => onEdit(task)}
                className={`block h-11 min-w-0 flex-1 truncate text-left text-sm leading-[44px] transition-colors duration-200 ${
                  doneToday(task) ? "text-muted line-through" : ""
                }`}
              >
                {task.title}
              </button>
              <span className="ml-3 flex shrink-0 items-center gap-2 text-xs text-muted">
                {course && <span className="hidden sm:inline">{course.name}</span>}
                {/* 跨多天的預計執行：顯示今天是第幾天 */}
                {task.planned_date && task.planned_end_date && task.planned_end_date > task.planned_date && (
                  <span className="tabular-nums">
                    D{daysBetween(task.planned_date, date) + 1}/{daysBetween(task.planned_date, task.planned_end_date) + 1}
                  </span>
                )}
                {task.due_date === date && task.start_time && (
                  <span className="tabular-nums text-fg">{shortTime(task.start_time)}</span>
                )}
                {task.due_date === date && !doneToday(task) && (
                  <span className="rounded-[4px] bg-primary px-1.5 py-0.5 text-fg">今天截止</span>
                )}
              </span>
              {/*
                ×：按兩次才執行
                - 因為預計執行出現在今天 → 只把今天從預計執行拿掉（例如 27–29 → 28–29），待辦保留
                - 今天截止、或預計執行只有今天又沒有截止日 → 刪除整筆
                有滑鼠的裝置：滑到這一筆才顯示；手機等觸控裝置沒有「滑過」，所以一直顯示
              */}
              <ConfirmButton
                onConfirm={() => onRemove(task)}
                confirmLabel={todayRemoval(task, date) === "skip" ? "今天不做？" : "刪除？"}
                ariaLabel={todayRemoval(task, date) === "skip" ? `今天不做 ${task.title}` : `刪除 ${task.title}`}
                armedClassName="text-secondary !opacity-100"
                className="flex h-11 min-w-11 shrink-0 items-center justify-center px-2 text-sm text-muted transition-opacity hover:text-fg focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:hover)]:opacity-0"
              >
                ×
              </ConfirmButton>
            </li>
          );
        })}
      </ul>

      {/* 快速新增：輸入後按 Enter，預計執行日自動設為今天 */}
      <form onSubmit={handleAdd} className="mt-4 flex gap-2 border-t border-line pt-4">
        <input
          className="input"
          placeholder="新增今日待辦…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={adding}
        />
        <button type="submit" className="btn-primary w-11 shrink-0 px-0 text-lg" disabled={adding} aria-label="新增">
          <PlusIcon />
        </button>
      </form>
    </Card>
  );
}
