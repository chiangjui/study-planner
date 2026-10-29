"use client";

// 補登讀書紀錄：忘記開番茄鐘時，自己填日期、科目、開始和結束時間

import { useState } from "react";
import Card from "@/components/Card";
import { insertRow } from "@/lib/store";
import { today } from "@/lib/date";
import type { CourseLite } from "@/lib/useTodayData";

// "14:00" → 840（分鐘）
function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function AddSessionForm({ courses }: { courses: CourseLite[] }) {
  const [date, setDate] = useState(today);
  const [courseId, setCourseId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [message, setMessage] = useState("");

  const minutes = start && end ? toMinutes(end) - toMinutes(start) : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (minutes <= 0) return setMessage("結束時間要晚於開始時間");
    // 時間以台北時區解讀，存成標準時間（和番茄鐘記錄的格式一樣）
    insertRow("study_sessions", {
      course_id: courseId || null,
      started_at: new Date(`${date}T${start}:00+08:00`).toISOString(),
      duration_minutes: minutes,
    });
    setMessage(`已補登 ${minutes} 分鐘`);
    setStart("");
    setEnd("");
  }

  return (
    <Card title="Add session 補登" className="mb-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[1fr_1.4fr]">
          <input
            type="date"
            className="input"
            value={date}
            max={today()}
            required
            onChange={(e) => setDate(e.target.value)}
            aria-label="日期"
          />
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="科目">
            <option value="">不選科目</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto]">
          <input
            type="time"
            className="input"
            value={start}
            required
            onChange={(e) => setStart(e.target.value)}
            aria-label="開始時間"
          />
          <span className="text-muted">–</span>
          <input
            type="time"
            className="input"
            value={end}
            required
            onChange={(e) => setEnd(e.target.value)}
            aria-label="結束時間"
          />
          <button type="submit" className="btn-primary col-span-3 md:col-span-1">
            {minutes > 0 ? `Add ${minutes} min` : "Add"}
          </button>
        </div>
        {message && <p className="text-sm text-secondary">{message}</p>}
      </form>
    </Card>
  );
}
