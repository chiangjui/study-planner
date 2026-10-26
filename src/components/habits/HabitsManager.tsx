"use client";

import { useEffect, useState } from "react";
import Card, { Empty } from "@/components/Card";
import Checkbox from "@/components/Checkbox";
import ConfirmButton from "@/components/ConfirmButton";
import { supabase } from "@/lib/supabase";
import { addDays, today } from "@/lib/date";
import { streakOf } from "@/lib/habits";
import type { Habit, HabitLog } from "@/lib/types";

type LogLite = Pick<HabitLog, "id" | "habit_id" | "log_date">;

// 習慣管理：新增、刪除、今日打卡、連續天數
export default function HabitsManager() {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [logs, setLogs] = useState<LogLite[]>([]);
  const [name, setName] = useState("");
  const [date] = useState(today);

  useEffect(() => {
    // 連續天數只需要往回看，讀最近 400 天就足夠
    Promise.all([
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_logs").select("id, habit_id, log_date").gte("log_date", addDays(date, -400)),
    ]).then(([h, l]) => {
      setHabits(h.data ?? []);
      setLogs(l.data ?? []);
    });
  }, [date]);

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    const text = name.trim();
    if (!text) return;
    const { data, error } = await supabase.from("habits").insert({ name: text }).select().single();
    if (error) return alert(`新增失敗：${error.message}`);
    setHabits((hs) => [...(hs ?? []), data]);
    setName("");
  }

  async function deleteHabit(habit: Habit) {
    const { error } = await supabase.from("habits").delete().eq("id", habit.id);
    if (error) return alert(`刪除失敗：${error.message}`);
    setHabits((hs) => hs?.filter((h) => h.id !== habit.id) ?? null);
    setLogs((ls) => ls.filter((l) => l.habit_id !== habit.id));
  }

  // 今天打卡／取消打卡
  async function toggle(habit: Habit) {
    const existing = logs.find((l) => l.habit_id === habit.id && l.log_date === date);
    if (existing) {
      setLogs((ls) => ls.filter((l) => l.id !== existing.id));
      await supabase.from("habit_logs").delete().eq("id", existing.id);
    } else {
      const { data, error } = await supabase
        .from("habit_logs")
        .insert({ habit_id: habit.id, log_date: date })
        .select("id, habit_id, log_date")
        .single();
      if (error) return alert(`打卡失敗：${error.message}`);
      setLogs((ls) => [...ls, data]);
    }
  }

  return (
    <Card title="Habits">
      {!habits ? (
        <p className="card-title">Loading…</p>
      ) : (
        <>
          {habits.length === 0 && <Empty>還沒有習慣，先新增一個吧（例如：喝水、背單字）</Empty>}
          <ul className="-mx-2 flex flex-col">
            {habits.map((h) => {
              const dates = new Set(logs.filter((l) => l.habit_id === h.id).map((l) => l.log_date));
              const checked = dates.has(date);
              const streak = streakOf(dates, date);
              return (
                <li key={h.id} className="flex items-center gap-1">
                  <Checkbox checked={checked} onChange={() => toggle(h)} label={h.name} />
                  <span className={`flex-1 truncate text-sm ${checked ? "text-muted" : ""}`}>{h.name}</span>
                  {/* 連續天數 */}
                  <span
                    className={`shrink-0 text-xs tabular-nums ${streak > 0 ? "text-fg" : "text-muted"}`}
                    title="連續打卡天數"
                  >
                    {streak} <span className="text-muted">DAYS</span>
                  </span>
                  {/* 打卡紀錄會一起刪除 */}
                  <ConfirmButton
                    onConfirm={() => deleteHabit(h)}
                    confirmLabel="刪除？"
                    ariaLabel={`刪除 ${h.name}`}
                    className="flex h-11 min-w-11 shrink-0 items-center justify-center px-2 text-sm text-muted hover:text-fg"
                  >
                    ×
                  </ConfirmButton>
                </li>
              );
            })}
          </ul>

          <form onSubmit={addHabit} className="mt-4 flex gap-2 border-t border-line pt-4">
            <input
              className="input"
              placeholder="新增習慣…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="btn-primary w-11 shrink-0 px-0 text-lg" aria-label="新增習慣">
              +
            </button>
          </form>
        </>
      )}
    </Card>
  );
}
