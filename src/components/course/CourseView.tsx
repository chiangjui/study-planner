// 課程詳細頁（閱讀模式）

import Card, { Empty } from "@/components/Card";
import { addDays, shortDate, startOfWeek, today } from "@/lib/date";
import { formatSlot, sortSlots } from "@/lib/courses";
import type { Course, CourseSchedule } from "@/lib/types";

export default function CourseView({
  course,
  schedules,
  onEdit,
  onDelete,
}: {
  course: Course;
  schedules: CourseSchedule[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  // 本週的進度會用主色標示
  const weekStart = startOfWeek(today());
  const weekEnd = addDays(weekStart, 6);
  const gradingTotal = course.grading.reduce((sum, g) => sum + g.percent, 0);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* 基本資料 */}
      <section className="rounded-card bg-primary p-5 lg:col-span-2">
        <p className="text-xs uppercase tracking-[0.1em] opacity-80">Course</p>
        <h2 className="mt-4 text-3xl leading-snug">{course.name}</h2>
        <p className="mt-2 text-sm opacity-80">
          {course.teacher ?? "—"} · {course.credits} credits
        </p>
        <div className="mt-6 flex gap-2">
          <button onClick={onEdit} className="h-11 rounded-[4px] bg-fg px-4 text-xs uppercase tracking-[0.1em] text-primary">
            Edit
          </button>
          <button
            onClick={onDelete}
            className="h-11 rounded-[4px] border border-fg/40 px-4 text-xs uppercase tracking-[0.1em] hover:bg-fg/10"
          >
            Delete
          </button>
        </div>
      </section>

      {/* 上課時段 */}
      <Card title="Schedule">
        {schedules.length === 0 ? (
          <Empty>沒有設定上課時段</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {sortSlots(schedules).map((s) => (
              <li key={s.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="tabular-nums">
                  {formatSlot(s)}
                  {s.period_label && <span className="ml-2 text-xs text-muted">第 {s.period_label} 節</span>}
                </span>
                <span className="shrink-0 text-muted">{s.room}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 成績比重 */}
      <Card
        title="Grading"
        action={
          <span className={`text-xs tabular-nums ${gradingTotal === 100 ? "text-muted" : "text-secondary"}`}>
            {gradingTotal}%
          </span>
        }
      >
        {course.grading.length === 0 ? (
          <Empty>沒有設定成績比重</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {course.grading.map((g, i) => (
              <li key={i}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{g.item}</span>
                  <span className="tabular-nums text-muted">{g.percent}%</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-secondary" style={{ width: `${g.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 每週進度 */}
      <Card title="Weekly topics" className="lg:col-span-2 lg:row-span-2">
        {course.weekly_topics.length === 0 ? (
          <Empty>沒有每週進度</Empty>
        ) : (
          <ul className="flex flex-col">
            {course.weekly_topics.map((t, i) => {
              const current = t.date >= weekStart && t.date <= weekEnd;
              return (
                <li
                  key={i}
                  className={`grid grid-cols-[40px_56px_1fr] gap-3 rounded-[4px] px-2 py-2 text-sm ${
                    current ? "bg-primary" : ""
                  }`}
                >
                  <span className={`tabular-nums ${current ? "" : "text-muted"}`}>W{t.week}</span>
                  <span className={`tabular-nums ${current ? "" : "text-muted"}`}>{t.date && shortDate(t.date)}</span>
                  <span>{t.topic}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* 備註 */}
      <Card title="Notes">
        {course.notes ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{course.notes}</p>
        ) : (
          <Empty>沒有備註</Empty>
        )}
      </Card>
    </div>
  );
}
