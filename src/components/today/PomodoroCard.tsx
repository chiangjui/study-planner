"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import ConfirmButton from "@/components/ConfirmButton";
import { usePomodoro } from "@/lib/pomodoro";
import type { CourseLite } from "@/lib/useTodayData";

// 毫秒 → "MM:SS"
function formatMs(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 番茄鐘卡（霧藍色重點卡片）
export default function PomodoroCard({
  courses,
  focusMinutes,
  breakMinutes,
  className,
}: {
  courses: CourseLite[];
  focusMinutes: number;
  breakMinutes: number;
  className?: string;
}) {
  const { state, remainingMs, start, stop } = usePomodoro();
  const [courseId, setCourseId] = useState("");

  const running = state.phase !== "idle";
  const totalMs = running ? state.endsAt - state.startedAt : 0;
  const progress = running ? 1 - remainingMs / totalMs : 0;
  const runningCourse = running ? courses.find((c) => c.id === state.courseId) : undefined;

  return (
    <Card
      title={state.phase === "break" ? "Break" : "Pomodoro"}
      tone="primary"
      className={className}
      action={
        <Link href="/settings" className="text-[10px] uppercase tracking-[0.1em] opacity-70 hover:opacity-100">
          {focusMinutes} / {breakMinutes} min
        </Link>
      }
    >
      {running ? (
        // 計時中：顯示科目、階段
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.1em] opacity-70">
            {state.phase === "focus" ? "Focusing on" : "Next round"}
          </span>
          <p className="flex h-11 items-center truncate text-sm">{runningCourse?.name ?? "—"}</p>
        </div>
      ) : (
        // 待機：選擇科目
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.1em] opacity-70">Subject</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="h-11 w-full rounded-[4px] border border-fg/20 bg-fg/10 px-3 text-sm text-fg outline-none focus:border-fg/60"
          >
            <option value="" className="bg-card">
              選擇科目…
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id} className="bg-card">
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="my-auto py-8">
        <p className="text-center text-7xl leading-none tabular-nums">
          {running ? formatMs(remainingMs) : formatMs(focusMinutes * 60_000)}
        </p>
        {/* 進度條：計時中才顯示 */}
        <div className={`mt-6 h-1 overflow-hidden rounded-full bg-fg/20 ${running ? "" : "invisible"}`}>
          <div className="h-full bg-fg transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {state.phase === "focus" ? (
        // 放棄專注要按兩次，避免誤觸（放棄的時間不會記錄）
        <ConfirmButton
          onConfirm={stop}
          confirmLabel="再按一次放棄（不記錄）"
          armedClassName="bg-fg/20"
          className="h-11 w-full rounded-[4px] border border-fg/40 text-sm uppercase tracking-[0.1em] text-fg transition-colors hover:bg-fg/10"
        >
          Stop
        </ConfirmButton>
      ) : state.phase === "break" ? (
        <button
          onClick={stop}
          className="h-11 w-full rounded-[4px] border border-fg/40 text-sm uppercase tracking-[0.1em] text-fg transition-colors hover:bg-fg/10"
        >
          Skip break
        </button>
      ) : (
        <button
          onClick={() => start(courseId, focusMinutes, breakMinutes)}
          disabled={!courseId}
          className="h-11 w-full rounded-[4px] bg-fg text-sm uppercase tracking-[0.1em] text-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {courseId ? "Start" : "Choose a subject"}
        </button>
      )}
    </Card>
  );
}
