"use client";

// 課程新增／編輯表單

import { useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/lib/supabase";
import { addDays, shortTime, WEEKDAY_ZH } from "@/lib/date";
import { findPeriod, parsePeriodLabel, PERIODS } from "@/lib/periods";
import type { Course, CourseSchedule, GradingItem, WeeklyTopic } from "@/lib/types";

type SlotDraft = { weekday: number; start_time: string; end_time: string; period_label: string; room: string };

export type CourseDraft = {
  name: string;
  teacher: string;
  credits: number;
  notes: string;
  grading: GradingItem[];
  weekly_topics: WeeklyTopic[];
  schedules: SlotDraft[];
};

export const EMPTY_DRAFT: CourseDraft = {
  name: "",
  teacher: "",
  credits: 3,
  notes: "",
  grading: [],
  weekly_topics: [],
  schedules: [],
};

// 從資料庫的資料轉成表單用的格式
export function toDraft(course: Course, schedules: CourseSchedule[]): CourseDraft {
  return {
    name: course.name,
    teacher: course.teacher ?? "",
    credits: course.credits,
    notes: course.notes ?? "",
    grading: course.grading,
    weekly_topics: course.weekly_topics,
    schedules: schedules.map((s) => ({
      weekday: s.weekday,
      start_time: shortTime(s.start_time),
      end_time: shortTime(s.end_time),
      period_label: s.period_label ?? "",
      room: s.room ?? "",
    })),
  };
}

const smallInput = "h-11 rounded-[4px] border border-line bg-bg px-2 text-sm text-fg outline-none focus:border-primary";

export default function CourseForm({
  courseId,
  initial,
  onSaved,
  onCancel,
}: {
  courseId: string | null; // null = 新增課程
  initial: CourseDraft;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 小工具：更新陣列裡的某一筆
  function updateAt<K extends "grading" | "weekly_topics" | "schedules">(
    key: K,
    index: number,
    patch: Partial<CourseDraft[K][number]>,
  ) {
    setDraft((d) => ({ ...d, [key]: d[key].map((row, i) => (i === index ? { ...row, ...patch } : row)) }));
  }
  function removeAt(key: "grading" | "weekly_topics" | "schedules", index: number) {
    setDraft((d) => ({ ...d, [key]: d[key].filter((_, i) => i !== index) }));
  }

  // 選節次時自動填入時間（依中原節次表）
  function setPeriods(index: number, from: string, to: string) {
    const start = findPeriod(from);
    const end = findPeriod(to || from);
    if (!start || !end) return updateAt("schedules", index, { period_label: "" });
    updateAt("schedules", index, {
      start_time: start.start,
      end_time: end.end,
      period_label: from === (to || from) ? from : `${from}-${to}`,
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const bad = draft.schedules.find((s) => !s.start_time || !s.end_time || s.end_time <= s.start_time);
    if (bad) return setError("上課時段的結束時間必須晚於開始時間");

    setSaving(true);
    const courseRow = {
      name: draft.name.trim(),
      teacher: draft.teacher.trim() || null,
      credits: draft.credits,
      notes: draft.notes.trim() || null,
      grading: draft.grading.filter((g) => g.item.trim()),
      weekly_topics: draft.weekly_topics.filter((t) => t.topic.trim()),
    };

    // 1. 新增或更新課程
    const result = courseId
      ? await supabase.from("courses").update(courseRow).eq("id", courseId).select("id").single()
      : await supabase.from("courses").insert(courseRow).select("id").single();
    if (result.error) {
      setSaving(false);
      return setError(`儲存失敗：${result.error.message}`);
    }
    const id = result.data.id;

    // 2. 上課時段：整批刪掉再重新寫入（最簡單、不會漏改）
    await supabase.from("course_schedules").delete().eq("course_id", id);
    if (draft.schedules.length > 0) {
      const { error } = await supabase.from("course_schedules").insert(
        draft.schedules.map((s) => ({
          course_id: id,
          weekday: s.weekday,
          start_time: s.start_time,
          end_time: s.end_time,
          period_label: s.period_label || null,
          room: s.room.trim() || null,
        })),
      );
      if (error) {
        setSaving(false);
        return setError(`上課時段儲存失敗：${error.message}`);
      }
    }

    setSaving(false);
    onSaved(id);
  }

  const gradingTotal = draft.grading.reduce((sum, g) => sum + (g.percent || 0), 0);

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* 基本資料 */}
      <Card title="Course">
        <div className="flex flex-col gap-4">
          <Field label="Name 課程名稱">
            <input className="input" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Field label="Teacher 授課老師">
              <input className="input" value={draft.teacher} onChange={(e) => setDraft({ ...draft, teacher: e.target.value })} />
            </Field>
            <Field label="Credits 學分">
              <input
                type="number"
                className="input tabular-nums"
                min={0}
                max={20}
                required
                value={draft.credits}
                onChange={(e) => setDraft({ ...draft, credits: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Notes 備註">
            <textarea
              className="input h-32 py-2 leading-relaxed"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      {/* 上課時段 */}
      <Card title="Schedule 上課時段">
        <div className="flex flex-col gap-4">
          {draft.schedules.map((s, i) => {
            const [from, to] = parsePeriodLabel(s.period_label);
            return (
              <div key={i} className="flex flex-col gap-2 border-b border-line pb-4">
                <div className="grid grid-cols-[1fr_1fr_1fr_44px] gap-2">
                  <select
                    className={smallInput}
                    value={s.weekday}
                    onChange={(e) => updateAt("schedules", i, { weekday: Number(e.target.value) })}
                    aria-label="星期"
                  >
                    {WEEKDAY_ZH.map((d, idx) => (
                      <option key={d} value={idx + 1}>
                        週{d}
                      </option>
                    ))}
                  </select>
                  {/* 節次：選了會自動填時間 */}
                  <select className={smallInput} value={from} onChange={(e) => setPeriods(i, e.target.value, to)} aria-label="開始節次">
                    <option value="">節次</option>
                    {PERIODS.map((p) => (
                      <option key={p.label} value={p.label}>
                        第 {p.label} 節
                      </option>
                    ))}
                  </select>
                  <select className={smallInput} value={to} onChange={(e) => setPeriods(i, from, e.target.value)} aria-label="結束節次" disabled={!from}>
                    <option value="">到</option>
                    {PERIODS.map((p) => (
                      <option key={p.label} value={p.label}>
                        到 {p.label}
                      </option>
                    ))}
                  </select>
                  <RemoveButton onClick={() => removeAt("schedules", i)} />
                </div>
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
                  <input
                    type="time"
                    className={smallInput}
                    value={s.start_time}
                    required
                    onChange={(e) => updateAt("schedules", i, { start_time: e.target.value })}
                    aria-label="開始時間"
                  />
                  <input
                    type="time"
                    className={smallInput}
                    value={s.end_time}
                    required
                    onChange={(e) => updateAt("schedules", i, { end_time: e.target.value })}
                    aria-label="結束時間"
                  />
                  <input
                    className={smallInput}
                    placeholder="教室"
                    value={s.room}
                    onChange={(e) => updateAt("schedules", i, { room: e.target.value })}
                    aria-label="教室"
                  />
                </div>
              </div>
            );
          })}
          <AddButton
            onClick={() =>
              setDraft((d) => ({
                ...d,
                schedules: [...d.schedules, { weekday: 1, start_time: "08:10", end_time: "09:00", period_label: "1", room: "" }],
              }))
            }
          >
            Add time slot
          </AddButton>
        </div>
      </Card>

      {/* 成績比重 */}
      <Card
        title="Grading 成績比重"
        action={
          <span className={`text-xs tabular-nums ${gradingTotal === 100 ? "text-muted" : "text-secondary"}`}>
            Total {gradingTotal}%
          </span>
        }
      >
        <div className="flex flex-col gap-2">
          {draft.grading.map((g, i) => (
            <div key={i} className="grid grid-cols-[1fr_88px_44px] gap-2">
              <input
                className={smallInput}
                placeholder="項目（例如：期中考）"
                value={g.item}
                onChange={(e) => updateAt("grading", i, { item: e.target.value })}
              />
              <input
                type="number"
                className={`${smallInput} tabular-nums`}
                min={0}
                max={100}
                value={g.percent}
                onChange={(e) => updateAt("grading", i, { percent: Number(e.target.value) })}
                aria-label="百分比"
              />
              <RemoveButton onClick={() => removeAt("grading", i)} />
            </div>
          ))}
          <AddButton onClick={() => setDraft((d) => ({ ...d, grading: [...d.grading, { item: "", percent: 0 }] }))}>
            Add item
          </AddButton>
        </div>
      </Card>

      {/* 每週進度 */}
      <Card title="Weekly topics 每週進度">
        <div className="flex flex-col gap-2">
          {draft.weekly_topics.map((t, i) => (
            <div key={i} className="grid grid-cols-[56px_140px_1fr_44px] gap-2">
              <input
                type="number"
                className={`${smallInput} tabular-nums`}
                min={1}
                value={t.week}
                onChange={(e) => updateAt("weekly_topics", i, { week: Number(e.target.value) })}
                aria-label="週次"
              />
              <input
                type="date"
                className={smallInput}
                value={t.date}
                onChange={(e) => updateAt("weekly_topics", i, { date: e.target.value })}
                aria-label="日期"
              />
              <input
                className={smallInput}
                placeholder="主題"
                value={t.topic}
                onChange={(e) => updateAt("weekly_topics", i, { topic: e.target.value })}
              />
              <RemoveButton onClick={() => removeAt("weekly_topics", i)} />
            </div>
          ))}
          <AddButton
            onClick={() =>
              setDraft((d) => {
                // 新的一週：週次 +1、日期 +7 天
                const last = d.weekly_topics.at(-1);
                return {
                  ...d,
                  weekly_topics: [
                    ...d.weekly_topics,
                    { week: last ? last.week + 1 : 1, date: last?.date ? addDays(last.date, 7) : "", topic: "" },
                  ],
                };
              })
            }
          >
            Add week
          </AddButton>
        </div>
      </Card>

      {/* 儲存列 */}
      <div className="flex items-center gap-3 lg:col-span-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-[4px] px-4 text-xs uppercase tracking-[0.1em] text-muted hover:text-fg"
        >
          Cancel
        </button>
        {error && <p className="text-sm text-secondary">{error}</p>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="card-title">{label}</span>
      {children}
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center text-muted hover:text-fg"
      aria-label="刪除這一列"
    >
      ×
    </button>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 self-start rounded-[4px] border border-dashed border-line px-4 text-xs uppercase tracking-[0.1em] text-muted hover:border-muted hover:text-fg"
    >
      + {children}
    </button>
  );
}
