"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import CourseView from "@/components/course/CourseView";
import CourseForm, { EMPTY_DRAFT, toDraft } from "@/components/course/CourseForm";
import StoreLoading from "@/components/StoreLoading";
import { deleteRow, useStore } from "@/lib/store";

// 課程詳細頁：/course?id=xxx（id=new 代表新增課程）
// 靜態輸出無法產生動態路由，所以用 query string 帶 id
export default function CoursePage() {
  return (
    <main className="mx-auto max-w-[1360px] px-4 py-4 md:px-8 md:py-6">
      {/* useSearchParams 在靜態輸出時需要包在 Suspense 裡 */}
      <Suspense fallback={<p className="card-title">Loading…</p>}>
        <CourseFromQuery />
      </Suspense>
    </main>
  );
}

function CourseFromQuery() {
  const id = useSearchParams().get("id") ?? "";
  // key={id}：換成另一門課時，畫面狀態整個重設
  return <CourseDetail key={id} id={id} />;
}

function CourseDetail({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";
  const [editing, setEditing] = useState(isNew);
  // 課程資料來自本機資料庫（離線也能看、也能改）
  const { data: db } = useStore();
  const course = db?.courses.find((c) => c.id === id) ?? null;
  const schedules = db?.course_schedules.filter((s) => s.course_id === id) ?? [];

  function handleDelete() {
    if (!course) return;
    deleteRow("courses", course.id);
    router.push("/courses");
  }

  function handleSaved(savedId: string) {
    if (isNew) router.replace(`/course?id=${savedId}`);
    else setEditing(false);
  }

  const header = <PageHeader title={isNew ? "New course" : "Course"} backHref="/courses" backLabel="Courses" />;

  if (!db) return <StoreLoading />;

  if (!id || (!isNew && !course)) {
    return (
      <>
        {header}
        <p className="text-sm text-muted">找不到這門課程</p>
      </>
    );
  }

  if (isNew) {
    return (
      <>
        {header}
        <CourseForm courseId={null} initial={EMPTY_DRAFT} onSaved={handleSaved} onCancel={() => router.push("/courses")} />
      </>
    );
  }

  if (!course) return null;

  return (
    <>
      {header}
      {editing ? (
        <CourseForm
          courseId={course.id}
          initial={toDraft(course, schedules)}
          onSaved={handleSaved}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <CourseView course={course} schedules={schedules} onEdit={() => setEditing(true)} onDelete={handleDelete} />
      )}
    </>
  );
}
