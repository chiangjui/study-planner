"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import StoreLoading from "@/components/StoreLoading";
import { useUser } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import { saveSettings, useStore } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/types";

type SettingsForm = typeof DEFAULT_SETTINGS;

// 設定頁：每日讀書目標、番茄鐘時間、登出
export default function SettingsPage() {
  const user = useUser();
  const { data: db, sync } = useStore();
  if (!db) return <StoreLoading />;

  // 目前設定；還沒存過就用預設值
  const s = db.user_settings[0];
  const current: SettingsForm = s
    ? { daily_goal_hours: Number(s.daily_goal_hours), focus_minutes: s.focus_minutes, break_minutes: s.break_minutes }
    : DEFAULT_SETTINGS;

  return (
    <main className="mx-auto max-w-xl px-4 py-4 md:px-8 md:py-6">
      <PageHeader title="Settings" />

      {/* key：設定在別處（例如番茄鐘卡片）被改過時，表單重新帶入最新值 */}
      <SettingsFormCard key={JSON.stringify(current)} initial={current} />

      <section className="card mt-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="card-title">Account</p>
          <p className="mt-1 truncate text-sm">{user.email}</p>
          {/* 登出會清掉這台裝置上的資料副本，還沒同步的修改會遺失，所以先擋下來 */}
          {sync.pending > 0 && (
            <p className="mt-1 text-xs text-secondary">還有 {sync.pending} 筆修改沒同步，連上網路同步後才能登出</p>
          )}
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          disabled={sync.pending > 0}
          className="h-11 shrink-0 rounded-[4px] border border-line px-4 text-xs uppercase tracking-[0.1em] text-muted hover:text-fg disabled:opacity-40"
        >
          Log out
        </button>
      </section>
    </main>
  );
}

function SettingsFormCard({ initial }: { initial: SettingsForm }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // 先存本機，有網路時自動同步
    saveSettings(form);
    setMessage("已儲存");
  }

  return (
    <section className="card">
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
          <button type="submit" className="btn-primary">
            Save
          </button>
          {message && <p className="text-sm text-secondary">{message}</p>}
        </div>
      </form>
    </section>
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
