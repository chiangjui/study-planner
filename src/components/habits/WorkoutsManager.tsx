"use client";

import { useEffect, useState } from "react";
import Card, { Empty } from "@/components/Card";
import ConfirmButton from "@/components/ConfirmButton";
import { supabase } from "@/lib/supabase";
import { shortDate, startOfWeek, today, weekdayOf, WEEKDAY_EN } from "@/lib/date";
import type { Workout } from "@/lib/types";

// 運動紀錄：新增（日期、項目、時長）、最近紀錄、刪除
export default function WorkoutsManager() {
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState("");
  const [minutes, setMinutes] = useState(30);

  useEffect(() => {
    supabase
      .from("workouts")
      .select("*")
      .order("workout_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setWorkouts(data ?? []));
  }, []);

  async function addWorkout(e: React.FormEvent) {
    e.preventDefault();
    const text = kind.trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("workouts")
      .insert({ workout_date: date, kind: text, duration_minutes: minutes })
      .select()
      .single();
    if (error) return alert(`新增失敗：${error.message}`);
    // 依日期排序放進列表
    setWorkouts((ws) =>
      [data, ...(ws ?? [])].sort((a, b) => b.workout_date.localeCompare(a.workout_date)),
    );
    setKind("");
  }

  async function deleteWorkout(w: Workout) {
    const { error } = await supabase.from("workouts").delete().eq("id", w.id);
    if (error) return alert(`刪除失敗：${error.message}`);
    setWorkouts((ws) => ws?.filter((x) => x.id !== w.id) ?? null);
  }

  const weekStart = startOfWeek(today());
  const thisWeek = workouts?.filter((w) => w.workout_date >= weekStart).length ?? 0;
  // 以前填過的項目，輸入時當作建議
  const kinds = [...new Set(workouts?.map((w) => w.kind))];

  return (
    <Card
      title="Workouts"
      action={<span className="text-xs tabular-nums text-muted">{thisWeek} THIS WEEK</span>}
    >
      <form onSubmit={addWorkout} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_88px_44px]">
        <input
          type="date"
          className="input"
          value={date}
          max={today()}
          required
          onChange={(e) => setDate(e.target.value)}
          aria-label="日期"
        />
        <input
          className="input"
          placeholder="項目（例如：跑步）"
          list="workout-kinds"
          value={kind}
          required
          onChange={(e) => setKind(e.target.value)}
          aria-label="項目"
        />
        <datalist id="workout-kinds">
          {kinds.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <label className="relative">
          <input
            type="number"
            className="input pr-10 tabular-nums"
            value={minutes}
            min={1}
            max={600}
            required
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label="時長（分鐘）"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">MIN</span>
        </label>
        <button type="submit" className="btn-primary px-0 text-lg" aria-label="新增運動紀錄">
          +
        </button>
      </form>

      <div className="mt-4 border-t border-line pt-2">
        {!workouts ? (
          <p className="card-title py-2">Loading…</p>
        ) : workouts.length === 0 ? (
          <div className="py-2">
            <Empty>還沒有運動紀錄</Empty>
          </div>
        ) : (
          <ul>
            {workouts.map((w) => (
              <li key={w.id} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 tabular-nums text-muted">
                  {shortDate(w.workout_date)} {WEEKDAY_EN[weekdayOf(w.workout_date) - 1]}
                </span>
                <span className="flex-1 truncate">{w.kind}</span>
                <span className="shrink-0 tabular-nums text-muted">{w.duration_minutes} MIN</span>
                <ConfirmButton
                  onConfirm={() => deleteWorkout(w)}
                  confirmLabel="刪除？"
                  ariaLabel={`刪除 ${w.kind}`}
                  className="flex h-11 min-w-11 shrink-0 items-center justify-center px-2 text-sm text-muted hover:text-fg"
                >
                  ×
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
