"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import CourseView from "@/components/course/CourseView";
import CourseForm, { EMPTY_DRAFT, toDraft } from "@/components/course/CourseForm";
import { supabase } from "@/lib/supabase";
import type { Course, CourseSchedule } from "@/lib/types";

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
  const [course, setCourse] = useState<Course | null>(null);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [version, setVersion] = useState(0); // 儲存後 +1，重新讀取

  useEffect(() => {
    if (isNew || !id) return;
    Promise.all([
      supabase.from("courses").select("*").eq("id", id).maybeSingle(),
      supabase.from("course_schedules").select("*").eq("course_id", id),
    ]).then(([c, s]) => {
      if (!c.data) return setNotFound(true);
      setCourse(c.data);
      setSchedules(s.data ?? []);
    });
  }, [id, isNew, version]);

  async function handleDelete() {
    if (!course) return;
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) return alert(`刪除失敗：${error.message}`);
    router.push("/courses");
  }

  function handleSaved(savedId: string) {
    if (isNew) {
      router.replace(`/course?id=${savedId}`);
    } else {
      setEditing(false);
      setVersion((v) => v + 1);
    }
  }

  const header = <PageHeader title={isNew ? "New course" : "Course"} backHref="/courses" backLabel="Courses" />;

  if (!id || notFound) {
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

  if (!course) {
    return (
      <>
        {header}
        <p className="card-title">Loading…</p>
      </>
    );
  }

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
