"use client";

import { useState } from "react";
import Card from "@/components/Card";
import ConfirmButton from "@/components/ConfirmButton";
import PlusIcon, { MinusIcon } from "@/components/PlusIcon";
import { usePomodoro } from "@/lib/pomodoro";
import type { CourseLite } from "@/lib/useTodayData";

// 毫秒 → "MM:SS"
function formatMs(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// −／+ 調整：專注時間 5 分鐘以上時一次跳 5 分鐘，5 分鐘以下一次 1 分鐘
function nextValue(value: number, dir: 1 | -1, step: number, min: number, max: number) {
  const s = step > 1 && (dir === 1 ? value < step : value <= step) ? 1 : step;
  return Math.min(max, Math.max(min, value + dir * s));
}

// 番茄鐘卡（霧藍色重點卡片）
export default function PomodoroCard({
  courses,
  focusMinutes,
  breakMinutes,
  onTimesChange,
  className,
}: {
  courses: CourseLite[];
  focusMinutes: number;
  breakMinutes: number;
  onTimesChange: (focus: number, brk: number) => void; // 卡片上改了時間 → 存到設定（本機先存，自動同步）
  className?: string;
}) {
  const { state, remainingMs, start, stop, finishEarly } = usePomodoro();
  const [courseId, setCourseId] = useState("");
  const [editing, setEditing] = useState(false); // 是否正在卡片上調整時間
  // 調整時間：直接存（不用按 Save），連續按的話同步時只會送出最後的值
  function changeTimes(focus: number, brk: number) {
    onTimesChange(focus, brk);
  }

  const running = state.phase !== "idle";
  const totalMs = running ? state.endsAt - state.startedAt : 0;
  const progress = running ? 1 - remainingMs / totalMs : 0;
  const runningCourse = running ? courses.find((c) => c.id === state.courseId) : undefined;
  // 目前已專注幾分鐘（提早結束時會記錄這個數字）
  const elapsedMinutes = state.phase === "focus" ? Math.floor((totalMs - remainingMs) / 60_000) : 0;

  return (
    <Card
      title={state.phase === "break" ? "Break" : "Pomodoro"}
      tone="primary"
      className={className}
      action={
        // 點一下就能在卡片上調整時間（計時中不能改）
        !running && (
          <button
            onClick={() => setEditing(!editing)}
            className="-my-3 flex h-11 items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] opacity-70 hover:opacity-100"
          >
            {editing ? (
              "Done"
            ) : (
              <>
                {focusMinutes} / {breakMinutes} min
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M10.5 2.5l3 3L6 13H3v-3z" />
                </svg>
              </>
            )}
          </button>
        )
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
            className="h-11 w-full rounded-[4px] border border-fg/20 bg-fg/10 pr-9 pl-3 text-base text-fg outline-none focus:border-fg/60 md:text-sm"
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

      {editing && !running ? (
        // 在卡片上調整專注／休息時間
        <div className="my-auto flex flex-col gap-3 py-6">
          <TimeStepper
            label="Focus"
            value={focusMinutes}
            onChange={(v) => changeTimes(v, breakMinutes)}
            step={5}
            max={180}
          />
          <TimeStepper
            label="Break"
            value={breakMinutes}
            onChange={(v) => changeTimes(focusMinutes, v)}
            step={1}
            max={60}
          />
        </div>
      ) : (
      <div className="my-auto py-8">
        <p className="text-center text-7xl leading-none tabular-nums">
          {running ? formatMs(remainingMs) : formatMs(focusMinutes * 60_000)}
        </p>
        {/* 進度條：計時中才顯示 */}
        <div className={`mt-6 h-1 overflow-hidden rounded-full bg-fg/20 ${running ? "" : "invisible"}`}>
          <div className="h-full bg-fg transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      )}

      {state.phase === "focus" ? (
        // 提早結束要按兩次，避免誤觸；已專注的時間會記錄下來
        <ConfirmButton
          onConfirm={finishEarly}
          confirmLabel={elapsedMinutes >= 1 ? `再按一次結束（記錄 ${elapsedMinutes} 分鐘）` : "再按一次結束（不到 1 分鐘不記錄）"}
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

// 一組時間調整器：標籤、−、可直接輸入的數字、+
function TimeStepper({
  label,
  value,
  onChange,
  step,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  max: number;
}) {
  const btn = "flex h-11 w-11 items-center justify-center rounded-[4px] bg-fg/10 text-lg hover:bg-fg/20 disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-[0.1em] opacity-70">{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" className={btn} onClick={() => onChange(nextValue(value, -1, step, 1, max))} disabled={value <= 1} aria-label={`${label} 減少`}>
          <MinusIcon />
        </button>
        <input
          type="number"
          inputMode="numeric"
          className="h-11 w-14 bg-transparent text-center text-2xl tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          value={value}
          min={1}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(1, v)));
          }}
          aria-label={`${label}（分鐘）`}
        />
        <button type="button" className={btn} onClick={() => onChange(nextValue(value, 1, step, 1, max))} disabled={value >= max} aria-label={`${label} 增加`}>
          <PlusIcon />
        </button>
        <span className="w-7 text-[10px] uppercase opacity-70">min</span>
      </div>
    </div>
  );
}
