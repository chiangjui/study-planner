"use client";

import { useState } from "react";
import Card from "@/components/Card";
import type { CourseLite } from "@/lib/useTodayData";

// 番茄鐘卡（霧藍色重點卡片）
// 目前只有外觀與選科目，計時與自動記錄讀書時數在第 4 階段加入
export default function PomodoroCard({
  courses,
  focusMinutes,
  className,
}: {
  courses: CourseLite[];
  focusMinutes: number;
  className?: string;
}) {
  const [courseId, setCourseId] = useState("");

  return (
    <Card title="Pomodoro" tone="primary" className={className}>
      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.1em] opacity-70">Subject</span>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="h-11 w-full rounded-[4px] border border-fg/20 bg-fg/10 px-3 text-sm text-fg outline-none focus:border-fg/60"
        >
          <option value="" className="bg-card">選擇科目…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id} className="bg-card">
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <p className="my-auto py-8 text-center text-7xl leading-none tabular-nums">
        {String(focusMinutes).padStart(2, "0")}:00
      </p>

      <button
        disabled
        className="h-11 w-full rounded-[4px] bg-fg text-sm uppercase tracking-[0.1em] text-primary disabled:opacity-60"
        title="第 4 階段加入"
      >
        Start
      </button>
    </Card>
  );
}
