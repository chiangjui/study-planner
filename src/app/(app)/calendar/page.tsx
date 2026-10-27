"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import WeekCalendar from "@/components/calendar/WeekCalendar";
import MonthCalendar from "@/components/calendar/MonthCalendar";

type View = "week" | "month";

// 行事曆頁：週檢視（含課表時間軸）／月檢視（只顯示課表以外的事件）
export default function CalendarPage() {
  const [view, setView] = useState<View>("week");

  return (
    <main className="mx-auto max-w-[1360px] px-4 py-4 md:px-8 md:py-6">
      <PageHeader title="Calendar">
        {/* 週／月切換 */}
        <div className="grid grid-cols-2 gap-0.5 rounded-[4px] bg-card p-0.5">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`h-11 rounded-[4px] px-3 text-xs uppercase tracking-[0.1em] transition-colors ${
                view === v ? "bg-line text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {v === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </PageHeader>
      {view === "week" ? <WeekCalendar /> : <MonthCalendar />}
    </main>
  );
}
