"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Empty } from "@/components/Card";
import { supabase } from "@/lib/supabase";
import { formatSlot, sortSlots } from "@/lib/courses";
import type { Course, CourseSchedule } from "@/lib/types";

type CourseRow = Pick<Course, "id" | "name" | "teacher" | "credits"> & {
  course_schedules: Pick<CourseSchedule, "id" | "weekday" | "start_time" | "end_time" | "room">[];
};

// 課程列表
export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRow[] | null>(null);

  useEffect(() => {
    // 一次把課程和它的上課時段一起讀出來
    supabase
      .from("courses")
      .select("id, name, teacher, credits, course_schedules(id, weekday, start_time, end_time, room)")
      .order("created_at")
      .then(({ data }) => setCourses((data as CourseRow[]) ?? []));
  }, []);

  const totalCredits = courses?.reduce((sum, c) => sum + c.credits, 0) ?? 0;

  return (
    <main className="mx-auto max-w-[1360px] px-4 py-4 md:px-8 md:py-6">
      <PageHeader title="Courses">
        <Link href="/course?id=new" className="btn-primary">
          + New
        </Link>
      </PageHeader>

      {!courses ? (
        <p className="card-title">Loading…</p>
      ) : courses.length === 0 ? (
        <div className="card">
          <Empty>還沒有課程，按右上角新增</Empty>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs uppercase tracking-[0.1em] text-muted">
            {courses.length} courses · {totalCredits} credits
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/course?id=${c.id}`}
                className="flex flex-col rounded-card bg-card p-5 transition-colors hover:bg-[#2a2a2e]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg leading-snug">{c.name}</h2>
                  <span className="shrink-0 text-xs tabular-nums text-muted">{c.credits} CR</span>
                </div>
                <p className="mt-1 text-sm text-muted">{c.teacher ?? "—"}</p>
                <ul className="mt-6 flex flex-col gap-1 text-xs text-muted">
                  {sortSlots(c.course_schedules).map((s) => (
                    <li key={s.id} className="flex justify-between gap-2">
                      <span className="tabular-nums">{formatSlot(s)}</span>
                      <span className="truncate">{s.room}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
