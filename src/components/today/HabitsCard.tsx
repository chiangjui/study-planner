"use client";

import Card, { Empty } from "@/components/Card";
import Checkbox from "@/components/Checkbox";
import type { Habit, HabitLog } from "@/lib/types";

// 今日習慣打卡：點一下打卡，再點一下取消
export default function HabitsCard({
  habits,
  logs,
  date,
  onToggle,
  className,
}: {
  habits: Habit[];
  logs: HabitLog[];
  date: string;
  onToggle: (habit: Habit) => void;
  className?: string;
}) {
  const doneToday = new Set(logs.filter((l) => l.log_date === date).map((l) => l.habit_id));

  return (
    <Card
      title="Habits"
      className={className}
      action={
        habits.length > 0 && (
          <span className="text-xs tabular-nums text-muted">
            {doneToday.size} / {habits.length}
          </span>
        )
      }
    >
      {habits.length === 0 ? (
        // 新增習慣的頁面在第 5 階段加入
        <Empty>還沒有習慣項目</Empty>
      ) : (
        <ul className="-mx-2">
          {habits.map((h) => {
            const checked = doneToday.has(h.id);
            return (
              <li key={h.id} className="flex items-center">
                <Checkbox checked={checked} onChange={() => onToggle(h)} label={h.name} />
                <span className={`truncate text-sm transition-colors ${checked ? "text-muted" : ""}`}>{h.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
