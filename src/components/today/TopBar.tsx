"use client";

import { addDays, daysBetween, shortDate, shortTime, taipeiTime, weekdayOf, WEEKDAY_EN } from "@/lib/date";
import type { TodayData } from "@/lib/useTodayData";

// 找出下一堂課：今天還沒結束的課優先，沒有就往後找（最多一週）
function findNextClass(data: TodayData) {
  const now = taipeiTime();
  for (let offset = 0; offset < 8; offset++) {
    const day = addDays(data.date, offset);
    const candidates = data.schedules
      .filter((s) => s.weekday === weekdayOf(day))
      .filter((s) => offset > 0 || shortTime(s.end_time) > now)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    const next = candidates[0];
    if (next) {
      const course = data.courses.find((c) => c.id === next.course_id);
      return {
        name: course?.name ?? "—",
        offset,
        day,
        ongoing: offset === 0 && shortTime(next.start_time) <= now,
        schedule: next,
      };
    }
  }
  return null;
}

// 最近一場還沒完成的考試
function findNextExam(data: TodayData) {
  return data.tasks
    .filter((t) => t.type === "exam" && !t.done && t.due_date && t.due_date >= data.date)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0];
}

// 資訊列裡的一個欄位：上方小標籤 + 下方內容
function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{label}</p>
      {/* 手機上允許換行，桌機上一行顯示、過長就截斷 */}
      <div className="mt-1 text-sm md:truncate">{children}</div>
    </div>
  );
}

export default function TopBar({ data }: { data: TodayData }) {
  const next = findNextClass(data);
  const exam = findNextExam(data);

  return (
    <header className="mb-3 flex items-center gap-4 rounded-card bg-card px-5 py-4 md:gap-8">
      <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
        <Item label="Today">
          {shortDate(data.date)} {WEEKDAY_EN[weekdayOf(data.date) - 1]}
        </Item>

        <Item label="Next class">
          {next ? (
            <>
              {next.name}
              <span className="block text-muted md:ml-2 md:inline">
                {next.ongoing
                  ? "NOW"
                  : next.offset === 0
                    ? shortTime(next.schedule.start_time)
                    : `${WEEKDAY_EN[next.schedule.weekday - 1]} ${shortTime(next.schedule.start_time)}`}
                {next.schedule.room && (
                  <>
                    {" "}
                    <span className="whitespace-nowrap">· {next.schedule.room}</span>
                  </>
                )}
              </span>
            </>
          ) : (
            <span className="text-muted">—</span>
          )}
        </Item>

        <Item label="Next exam">
          {exam ? (
            <>
              {exam.title}
              <span className="block text-muted md:ml-2 md:inline">
                {daysBetween(data.date, exam.due_date!) === 0
                  ? "TODAY"
                  : `D-${daysBetween(data.date, exam.due_date!)}`}
              </span>
            </>
          ) : (
            <span className="text-muted">—</span>
          )}
        </Item>
      </div>

    </header>
  );
}
