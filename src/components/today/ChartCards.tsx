// 今日頁的圖表卡：本週各科讀書時數（長條圖）、本週習慣完成率（圓環）
// 用純 CSS / SVG 畫，不另外安裝圖表套件

import Card, { ArrowLink, Empty } from "@/components/Card";
import { daysBetween, taipeiDate } from "@/lib/date";
import type { Habit, HabitLog, StudySession } from "@/lib/types";
import type { CourseLite } from "@/lib/useTodayData";

// ---------------------------------------------------------------------
// 本週各科讀書時數：最多的那科用主色，其他用灰米色
// ---------------------------------------------------------------------
export function WeeklyStudyCard({
  sessions,
  courses,
  className,
}: {
  sessions: StudySession[];
  courses: CourseLite[];
  className?: string;
}) {
  // 依科目加總分鐘數
  const minutesByCourse = new Map<string | null, number>();
  for (const s of sessions) {
    minutesByCourse.set(s.course_id, (minutesByCourse.get(s.course_id) ?? 0) + s.duration_minutes);
  }
  const bars = [...minutesByCourse.entries()]
    .map(([courseId, minutes]) => ({
      name: courses.find((c) => c.id === courseId)?.name ?? "未分類",
      hours: minutes / 60,
    }))
    .sort((a, b) => b.hours - a.hours);
  const max = Math.max(...bars.map((b) => b.hours), 0);
  const total = bars.reduce((sum, b) => sum + b.hours, 0);

  return (
    <Card
      title="Study this week"
      className={className}
      action={
        <span className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted">{total.toFixed(1)}H</span>
          <ArrowLink href="/study" label="讀書紀錄" />
        </span>
      }
    >
      {bars.length === 0 ? (
        <Empty>本週還沒有讀書紀錄，用番茄鐘開始吧</Empty>
      ) : (
        <div className="mt-auto flex h-36 items-end gap-3">
          {bars.map((b) => (
            <div key={b.name} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-xs tabular-nums text-muted">{b.hours.toFixed(1)}</span>
              <div
                className={`w-full max-w-12 rounded-t-[3px] transition-[height] duration-500 ${
                  b.hours === max ? "bg-primary" : "bg-secondary"
                }`}
                style={{ height: `${Math.max(4, (b.hours / max) * 88)}px` }}
              />
              <span className="w-full truncate text-center text-[11px] text-muted" title={b.name}>
                {b.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------
// 本週習慣完成率 = 本週已打卡次數 / 每個習慣本週應打卡天數的總和
// ---------------------------------------------------------------------
export function HabitRateCard({
  habits,
  logs,
  date,
  weekStart,
  className,
}: {
  habits: Habit[];
  logs: HabitLog[];
  date: string;
  weekStart: string;
  className?: string;
}) {
  // 每個習慣從「本週一」和「建立那天」較晚的一天開始算，本週才新增的習慣不會被扣分
  const possible = habits.reduce((sum, h) => {
    const created = taipeiDate(new Date(h.created_at));
    const from = created > weekStart ? created : weekStart;
    return sum + Math.max(0, daysBetween(from, date) + 1);
  }, 0);
  const done = logs.filter((l) => l.log_date <= date).length;
  const ratio = possible ? Math.min(1, done / possible) : 0;

  // SVG 圓環
  const r = 54;
  const circumference = 2 * Math.PI * r;

  return (
    <Card title="Habit rate" className={className}>
      <div className="flex flex-1 items-center justify-center">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-line)" strokeWidth="5" />
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl tabular-nums">{Math.round(ratio * 100)}%</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">This week</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
