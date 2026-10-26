// 今日頁的小型數據卡：完成進度、今日讀書時數、截止日倒數、運動

import Card, { ArrowLink, BigNumber, Empty, PlusButton } from "@/components/Card";
import { daysBetween, shortDate, taipeiDate } from "@/lib/date";
import type { StudySession, Task, Workout } from "@/lib/types";
import type { CourseLite } from "@/lib/useTodayData";

// 細進度條
function ProgressBar({ ratio, track = "bg-line", fill = "bg-primary" }: { ratio: number; track?: string; fill?: string }) {
  return (
    <div className={`mt-4 h-1.5 overflow-hidden rounded-full ${track}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${fill}`}
        style={{ width: `${Math.min(1, ratio) * 100}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// 完成進度：已完成 / 總數
// ---------------------------------------------------------------------
export function ProgressCard({ tasks, className }: { tasks: Task[]; className?: string }) {
  const done = tasks.filter((t) => t.done).length;
  return (
    <Card title="Completed tasks" className={className}>
      <div className="mt-auto">
        <BigNumber value={done} denominator={String(tasks.length)} />
        <ProgressBar ratio={tasks.length ? done / tasks.length : 0} />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------
// 今日讀書時數：今日時數 / 目標時數
// ---------------------------------------------------------------------
export function StudyHoursCard({
  sessions,
  date,
  goalHours,
  className,
}: {
  sessions: StudySession[];
  date: string;
  goalHours: number;
  className?: string;
}) {
  const minutes = sessions
    .filter((s) => taipeiDate(new Date(s.started_at)) === date)
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const hours = minutes / 60;
  return (
    <Card title="Today's focus" className={className} action={<ArrowLink href="/study" label="讀書紀錄" />}>
      <div className="mt-auto">
        <BigNumber value={hours.toFixed(1)} denominator={`${goalHours}H`} />
        <ProgressBar ratio={hours / goalHours} />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------
// 截止日倒數：最近的作業／考試，3 天內用主色標示
// ---------------------------------------------------------------------
export function DeadlinesCard({
  tasks,
  date,
  courses,
  onAdd,
  onEdit,
  className,
}: {
  tasks: Task[];
  date: string;
  courses: CourseLite[];
  onAdd: () => void;
  onEdit: (task: Task) => void;
  className?: string;
}) {
  const upcoming = tasks
    .filter((t) => !t.done && t.due_date && t.due_date >= date)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
    .slice(0, 6);

  return (
    <Card title="Deadlines" className={className} action={<PlusButton onClick={onAdd} label="新增作業或考試" />}>
      {upcoming.length === 0 ? (
        <Empty>近期沒有截止的項目，按右上角 + 新增作業或考試</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {upcoming.map((t) => {
            const days = daysBetween(date, t.due_date!);
            const urgent = days <= 3;
            const course = courses.find((c) => c.id === t.course_id);
            return (
              <li key={t.id}>
                <button
                  onClick={() => onEdit(t)}
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-[4px] px-2 py-1 text-left hover:bg-bg/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{t.title}</p>
                    <p className="truncate text-xs text-muted">
                      {shortDate(t.due_date!)}
                      {course && ` · ${course.name}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-[4px] px-2 py-1 text-xs tabular-nums ${
                      urgent ? "bg-primary text-fg" : "bg-line text-muted"
                    }`}
                  >
                    {days === 0 ? "TODAY" : `${days}D`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------
// 運動：今天是否運動、本週運動次數（灰米色卡片）
// ---------------------------------------------------------------------
export function WorkoutCard({ workouts, date, className }: { workouts: Workout[]; date: string; className?: string }) {
  const todays = workouts.filter((w) => w.workout_date === date);
  return (
    <Card title="Workout" tone="secondary" className={className} action={<ArrowLink href="/habits" label="記錄運動" />}>
      <div className="mt-auto">
        <BigNumber value={workouts.length} denominator="WEEK" />
        <p className="mt-4 text-xs uppercase tracking-[0.1em] opacity-70">
          {todays.length > 0
            ? `Today · ${todays.map((w) => `${w.kind} ${w.duration_minutes}min`).join("、")}`
            : "Today · not yet"}
        </p>
      </div>
    </Card>
  );
}
