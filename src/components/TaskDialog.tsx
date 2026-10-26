"use client";

// 待辦編輯視窗：新增或編輯一筆待辦／作業／考試／報告（今日頁與行事曆共用）

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TASK_TYPE_LABEL, type Task, type TaskType } from "@/lib/types";
import type { CourseLite } from "@/lib/useTodayData";

export type TaskChange = { kind: "saved"; task: Task } | { kind: "deleted"; id: string };

// 視窗要開啟時傳入：task = 編輯既有的；defaults = 新增時的預設值
export type TaskDialogState = { task?: Task; defaults?: Partial<Task> } | null;

const TYPES = Object.keys(TASK_TYPE_LABEL) as TaskType[];

export default function TaskDialog({
  state,
  courses,
  onClose,
  onChange,
}: {
  state: TaskDialogState;
  courses: CourseLite[];
  onClose: () => void;
  onChange: (change: TaskChange) => void;
}) {
  if (!state) return null;
  // key：每次打開都用新的表單狀態
  return (
    <DialogForm
      key={state.task?.id ?? "new"}
      initial={state.task ?? state.defaults ?? {}}
      editingId={state.task?.id ?? null}
      courses={courses}
      onClose={onClose}
      onChange={onChange}
    />
  );
}

function DialogForm({
  initial,
  editingId,
  courses,
  onClose,
  onChange,
}: {
  initial: Partial<Task>;
  editingId: string | null;
  courses: CourseLite[];
  onClose: () => void;
  onChange: (change: TaskChange) => void;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [type, setType] = useState<TaskType>(initial.type ?? "general");
  const [courseId, setCourseId] = useState(initial.course_id ?? "");
  const [dueDate, setDueDate] = useState(initial.due_date ?? "");
  const [plannedDate, setPlannedDate] = useState(initial.planned_date ?? "");
  const [done, setDone] = useState(initial.done ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 按 Esc 關閉
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const row = {
      title: title.trim(),
      type,
      course_id: courseId || null,
      due_date: dueDate || null,
      planned_date: plannedDate || null,
      done,
    };
    const { data, error } = editingId
      ? await supabase.from("tasks").update(row).eq("id", editingId).select().single()
      : await supabase.from("tasks").insert(row).select().single();
    setSaving(false);
    if (error) return setError(`儲存失敗：${error.message}`);
    onChange({ kind: "saved", task: data });
    onClose();
  }

  async function handleDelete() {
    if (!editingId || !confirm(`刪除「${title}」？`)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", editingId);
    if (error) return setError(`刪除失敗：${error.message}`);
    onChange({ kind: "deleted", id: editingId });
    onClose();
  }

  return (
    // 半透明背景，點背景也會關閉
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-card bg-card p-5 sm:rounded-card"
      >
        <h2 className="card-title">{editingId ? "Edit task" : "New task"}</h2>

        <label className="flex flex-col gap-2">
          <span className="card-title">Title 標題</span>
          <input className="input" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        {/* 類型：四選一 */}
        <div className="flex flex-col gap-2">
          <span className="card-title">Type 類型</span>
          <div className="grid grid-cols-4 gap-1 rounded-[4px] bg-bg p-1">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`h-10 rounded-[4px] text-sm transition-colors ${
                  type === t ? (t === "exam" ? "bg-primary text-fg" : "bg-card text-fg") : "text-muted hover:text-fg"
                }`}
              >
                {TASK_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="card-title">Course 所屬課程</span>
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">不選</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="card-title">Due 截止日</span>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="card-title">Plan 預計執行</span>
            <input type="date" className="input" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          </label>
        </div>

        {editingId && (
          <label className="flex h-11 items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-primary" checked={done} onChange={(e) => setDone(e.target.checked)} />
            已完成
          </label>
        )}

        {error && <p className="text-sm text-secondary">{error}</p>}

        <div className="flex items-center gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "…" : "Save"}
          </button>
          <button type="button" onClick={onClose} className="h-11 px-4 text-xs uppercase tracking-[0.1em] text-muted hover:text-fg">
            Cancel
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleDelete}
              className="ml-auto h-11 px-4 text-xs uppercase tracking-[0.1em] text-muted hover:text-fg"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// 把變更套用到一個待辦陣列（新增、更新、刪除）
export function applyTaskChange(tasks: Task[], change: TaskChange): Task[] {
  if (change.kind === "deleted") return tasks.filter((t) => t.id !== change.id);
  const exists = tasks.some((t) => t.id === change.task.id);
  return exists ? tasks.map((t) => (t.id === change.task.id ? change.task : t)) : [...tasks, change.task];
}
