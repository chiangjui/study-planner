"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useUser } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import { DEFAULT_SETTINGS } from "@/lib/types";

// 設定頁：每日讀書目標、番茄鐘時間、登出
export default function SettingsPage() {
  const user = useUser();
  const [form, setForm] = useState<typeof DEFAULT_SETTINGS | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 讀取目前設定；還沒存過就用預設值
  useEffect(() => {
    supabase
      .from("user_settings")
      .select("daily_goal_hours, focus_minutes, break_minutes")
      .maybeSingle()
      .then(({ data }) =>
        setForm(data ? { ...data, daily_goal_hours: Number(data.daily_goal_hours) } : DEFAULT_SETTINGS),
      );
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage("");
    // upsert：沒有就新增、有就更新（每人只有一筆）
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, ...form, updated_at: new Date().toISOString() });
    setMessage(error ? `儲存失敗：${error.message}` : "已儲存");
    setSaving(false);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-4 md:px-8 md:py-6">
      <PageHeader title="Settings" />

      <section className="card">
        {!form ? (
          <p className="card-title">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <NumberField
              label="Daily study goal (hours)"
              hint="每日讀書目標時數"
              value={form.daily_goal_hours}
              min={0.5}
              max={24}
              step={0.5}
              onChange={(v) => setForm({ ...form, daily_goal_hours: v })}
            />
            <NumberField
              label="Focus (minutes)"
              hint="番茄鐘專注時間"
              value={form.focus_minutes}
              min={1}
              max={180}
              onChange={(v) => setForm({ ...form, focus_minutes: v })}
            />
            <NumberField
              label="Break (minutes)"
              hint="番茄鐘休息時間"
              value={form.break_minutes}
              min={1}
              max={60}
              onChange={(v) => setForm({ ...form, break_minutes: v })}
            />
            <div className="flex items-center gap-4">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "…" : "Save"}
              </button>
              {message && <p className="text-sm text-secondary">{message}</p>}
            </div>
          </form>
        )}
      </section>

      <section className="card mt-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="card-title">Account</p>
          <p className="mt-1 truncate text-sm">{user.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="h-11 shrink-0 rounded-[4px] border border-line px-4 text-xs uppercase tracking-[0.1em] text-muted hover:text-fg"
        >
          Log out
        </button>
      </section>
    </main>
  );
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="card-title">{label}</span>
      <input
        type="number"
        className="input tabular-nums"
        value={value}
        min={min}
        max={max}
        step={step}
        required
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="text-xs text-muted">{hint}</span>
    </label>
  );
}
