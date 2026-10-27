"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Empty } from "@/components/Card";
import StoreLoading from "@/components/StoreLoading";
import { useStore } from "@/lib/store";
import { formatSlot, sortSlots } from "@/lib/courses";

// 課程列表
export default function CoursesPage() {
  // 課程與上課時段來自本機資料庫（離線也能看）
  const { data: db } = useStore();
  if (!db) return <StoreLoading />;
  const courses = [...db.courses].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const slotsOf = (id: string) => db.course_schedules.filter((s) => s.course_id === id);
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  return (
    <main className="mx-auto max-w-[1360px] px-4 py-4 md:px-8 md:py-6">
      <PageHeader title="Courses">
        <Link href="/course?id=new" className="btn-primary">
          + New
        </Link>
      </PageHeader>

      {courses.length === 0 ? (
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
                  {sortSlots(slotsOf(c.id)).map((s) => (
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
