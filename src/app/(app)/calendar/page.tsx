"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import WeekCalendar from "@/components/calendar/WeekCalendar";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import { CATEGORY, CATEGORY_ORDER } from "@/lib/categories";

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

      {/* 顏色圖例 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {CATEGORY_ORDER.filter((c) => view === "week" || c !== "class").map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${CATEGORY[c].dot}`} />
            {CATEGORY[c].label}
          </span>
        ))}
        <span className="ml-auto hidden md:inline">點兩下新增／編輯</span>
      </div>

      {view === "week" ? <WeekCalendar /> : <MonthCalendar />}
    </main>
  );
}
