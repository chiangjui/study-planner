"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Empty } from "@/components/Card";
import ConfirmButton from "@/components/ConfirmButton";
import { supabase } from "@/lib/supabase";
import {
  addDays,
  shortDate,
  startOfWeek,
  taipeiDate,
  taipeiDayStart,
  taipeiTime,
  today,
  weekdayOf,
  WEEKDAY_EN,
} from "@/lib/date";
import type { StudySession } from "@/lib/types";
import type { CourseLite } from "@/lib/useTodayData";

const DAYS_SHOWN = 30; // 顯示最近幾天的紀錄

// 讀書紀錄：一筆一筆列出每次專注，可以刪除
export default function StudyLogPage() {
  const [sessions, setSessions] = useState<StudySession[] | null>(null);
  const [courses, setCourses] = useState<CourseLite[]>([]);

  useEffect(() => {
    const from = addDays(today(), -(DAYS_SHOWN - 1));
    Promise.all([
      supabase
        .from("study_sessions")
        .select("*")
        .gte("started_at", taipeiDayStart(from))
        .order("started_at", { ascending: false }),
      supabase.from("courses").select("id, name"),
    ]).then(([s, c]) => {
      setSessions(s.data ?? []);
      setCourses(c.data ?? []);
    });
  }, []);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("study_sessions").delete().eq("id", id);
    if (error) return alert(`刪除失敗：${error.message}`);
    setSessions((ss) => ss?.filter((s) => s.id !== id) ?? null);
  }

  // 依日期（台北）分組，新的在前
  const groups = new Map<string, StudySession[]>();
  for (const s of sessions ?? []) {
    const day = taipeiDate(new Date(s.started_at));
    groups.set(day, [...(groups.get(day) ?? []), s]);
  }

  const weekStart = startOfWeek(today());
  const weekMinutes = (sessions ?? [])
    .filter((s) => taipeiDate(new Date(s.started_at)) >= weekStart)
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const hours = (minutes: number) => (minutes / 60).toFixed(1);

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 md:px-8 md:py-6">
      <PageHeader title="Study log" backHref="/" backLabel="Today">
        <span className="text-xs tabular-nums text-muted">THIS WEEK {hours(weekMinutes)}H</span>
      </PageHeader>

      <section className="card">
        {!sessions ? (
          <p className="card-title">Loading…</p>
        ) : sessions.length === 0 ? (
          <Empty>最近 {DAYS_SHOWN} 天還沒有讀書紀錄</Empty>
        ) : (
          <div className="flex flex-col gap-6">
            {[...groups.entries()].map(([day, list]) => (
              <div key={day}>
                {/* 日期標題 + 當天總時數 */}
                <div className="mb-1 flex items-center justify-between border-b border-line pb-2 text-xs tabular-nums">
                  <span className={day === today() ? "text-fg" : "text-muted"}>
                    {WEEKDAY_EN[weekdayOf(day) - 1]} {shortDate(day)}
                  </span>
                  <span className="text-muted">
                    {hours(list.reduce((sum, s) => sum + s.duration_minutes, 0))}H
                  </span>
                </div>
                <ul>
                  {list.map((s) => {
                    const start = new Date(s.started_at);
                    const end = new Date(start.getTime() + s.duration_minutes * 60_000);
                    return (
                      <li key={s.id} className="flex items-center gap-3 text-sm">
                        <span className="w-24 shrink-0 text-xs tabular-nums text-muted">
                          {taipeiTime(start)}–{taipeiTime(end)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {courses.find((c) => c.id === s.course_id)?.name ?? "未分類"}
                        </span>
                        <span className="shrink-0 tabular-nums">{s.duration_minutes} MIN</span>
                        <ConfirmButton
                          onConfirm={() => handleDelete(s.id)}
                          confirmLabel="刪除？"
                          ariaLabel="刪除這筆讀書紀錄"
                          className="flex h-11 min-w-11 shrink-0 items-center justify-center px-2 text-sm text-muted hover:text-fg"
                        >
                          ×
                        </ConfirmButton>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
