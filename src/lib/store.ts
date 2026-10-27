"use client";

/**
 * 本機資料庫 + 同步（讓 app 離線也能用）
 *
 * - 所有資料在瀏覽器的 IndexedDB 存一份副本，頁面一律讀這份副本（沒網路也看得到）
 * - 修改時：先改本機副本（畫面立刻更新），再把這個動作排進「待同步清單」(outbox)
 * - 有網路時：依序把 outbox 送到 Supabase，送完再拉回最新的完整資料覆蓋本機副本
 * - 新資料的 id 由瀏覽器產生，離線新增的項目在同步前也能編輯或刪除
 * - 衝突處理：同一筆資料在兩台裝置都被修改時，以最後同步的為準
 */

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Course,
  CourseSchedule,
  Habit,
  HabitLog,
  StudySession,
  Task,
  UserSettings,
  Workout,
} from "@/lib/types";

export type Tables = {
  courses: Course[];
  course_schedules: CourseSchedule[];
  tasks: Task[];
  study_sessions: StudySession[];
  habits: Habit[];
  habit_logs: HabitLog[];
  workouts: Workout[];
  user_settings: UserSettings[];
};
export type TableName = keyof Tables;
type Row<T extends TableName> = Tables[T][number];

const TABLES: TableName[] = [
  "courses",
  "course_schedules",
  "tasks",
  "study_sessions",
  "habits",
  "habit_logs",
  "workouts",
  "user_settings",
];

// 有 created_at 欄位的表（新增時由瀏覽器填入時間）
const HAS_CREATED_AT: TableName[] = ["courses", "tasks", "study_sessions", "habits", "workouts"];

// 待同步的動作
type Op =
  | { kind: "upsert"; table: TableName; row: Record<string, unknown> }
  | { kind: "update"; table: TableName; id: string; patch: Record<string, unknown> }
  | { kind: "delete"; table: TableName; id: string };

export type SyncState = {
  online: boolean;
  syncing: boolean;
  pending: number; // 還沒同步的動作數
  lastSynced: number | null;
  error: string;
};

type StoreState = { data: Tables | null; sync: SyncState };

// ---------------------------------------------------------------------
// IndexedDB：只用一個 key-value 表，存「資料副本」與「待同步清單」
// ---------------------------------------------------------------------
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("study-planner", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("kv").objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    if (value === undefined) tx.objectStore("kv").delete(key);
    else tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------
// 記憶體裡的狀態 + 通知畫面更新
// ---------------------------------------------------------------------
let userId: string | null = null;
let data: Tables | null = null;
let outbox: Op[] = [];
let sync: SyncState = { online: true, syncing: false, pending: 0, lastSynced: null, error: "" };
let snapshot: StoreState = { data, sync };
const listeners = new Set<() => void>();

const SERVER_SNAPSHOT: StoreState = { data: null, sync };

function emit() {
  sync = { ...sync, pending: outbox.length };
  snapshot = { data, sync };
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 頁面用這個 hook 讀資料；資料一變動畫面就會更新
export function useStore(): StoreState {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

// 在事件處理函式裡（不是畫面上）讀目前的資料
export function getData(): Tables | null {
  return data;
}

// 存檔稍微延遲一下，連續修改時只寫一次
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (!userId) return;
  const uid = userId;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    idbSet(`data:${uid}`, data);
    idbSet(`outbox:${uid}`, outbox);
  }, 200);
}

// ---------------------------------------------------------------------
// 啟動 / 登出
// ---------------------------------------------------------------------
let started = false;

// 登入後呼叫：讀出本機副本，接著開始同步
export async function initStore(uid: string) {
  if (userId === uid) return;
  userId = uid;
  data = (await idbGet<Tables>(`data:${uid}`)) ?? null;
  outbox = (await idbGet<Op[]>(`outbox:${uid}`)) ?? [];
  sync = { ...sync, online: navigator.onLine };
  emit();

  if (!started) {
    started = true;
    window.addEventListener("online", () => syncNow());
    window.addEventListener("offline", () => {
      sync = { ...sync, online: false };
      emit();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") syncNow();
    });
    // 有待同步的動作時，每 30 秒再試一次
    setInterval(() => {
      if (outbox.length > 0) syncNow();
    }, 30_000);
  }
  syncNow();
}

// 登出時：清掉這個帳號在這台電腦上的副本
export async function clearStore() {
  if (!userId) return;
  const uid = userId;
  userId = null;
  data = null;
  outbox = [];
  emit();
  await idbSet(`data:${uid}`, undefined);
  await idbSet(`outbox:${uid}`, undefined);
}

// ---------------------------------------------------------------------
// 修改資料（先改本機，再排進待同步清單）
// ---------------------------------------------------------------------
function queue(op: Op) {
  // 同一筆資料還沒送出的 upsert，直接合併，清單不會越排越長
  const key = op.kind === "upsert" ? rowKey(op.table, op.row) : op.id;
  if (op.kind === "update") {
    const pending = outbox.find((o) => o.kind === "upsert" && o.table === op.table && rowKey(o.table, o.row) === key);
    if (pending && pending.kind === "upsert") {
      pending.row = { ...pending.row, ...op.patch };
      return;
    }
  }
  if (op.kind === "upsert") {
    const idx = outbox.findIndex((o) => o.kind === "upsert" && o.table === op.table && rowKey(o.table, o.row) === key);
    if (idx >= 0) {
      outbox[idx] = op;
      return;
    }
  }
  outbox.push(op);
}

// user_settings 的主鍵是 user_id，其他表是 id
function rowKey(table: TableName, row: Record<string, unknown>) {
  return String(table === "user_settings" ? row.user_id : row.id);
}

function afterChange() {
  emit();
  persist();
  scheduleSync();
}

// 新增一筆：id、user_id、created_at 自動填
export function insertRow<T extends TableName>(
  table: T,
  values: Omit<Row<T>, "id" | "user_id" | "created_at">,
): Row<T> {
  if (!data || !userId) throw new Error("資料尚未載入");
  const row = {
    ...values,
    id: crypto.randomUUID(),
    user_id: userId,
    ...(HAS_CREATED_AT.includes(table) ? { created_at: new Date().toISOString() } : {}),
  } as unknown as Row<T>;
  data = { ...data, [table]: [...data[table], row] };
  queue({ kind: "upsert", table, row: row as unknown as Record<string, unknown> });
  afterChange();
  return row;
}

// 更新一筆的部分欄位
export function updateRow<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
  if (!data) return;
  data = {
    ...data,
    [table]: (data[table] as { id: string }[]).map((r) => (r.id === id ? { ...r, ...patch } : r)),
  };
  queue({ kind: "update", table, id, patch: patch as Record<string, unknown> });
  afterChange();
}

// 刪除一筆（本機也照資料庫的規則連帶處理：刪課程 → 刪上課時段、待辦／讀書紀錄的課程變空；刪習慣 → 刪打卡）
export function deleteRow(table: TableName, id: string) {
  if (!data) return;
  const d = { ...data, [table]: (data[table] as { id: string }[]).filter((r) => r.id !== id) } as Tables;
  if (table === "courses") {
    d.course_schedules = d.course_schedules.filter((s) => s.course_id !== id);
    d.tasks = d.tasks.map((t) => (t.course_id === id ? { ...t, course_id: null } : t));
    d.study_sessions = d.study_sessions.map((s) => (s.course_id === id ? { ...s, course_id: null } : s));
  }
  if (table === "habits") d.habit_logs = d.habit_logs.filter((l) => l.habit_id !== id);
  data = d;

  // 如果這筆是離線新增、還沒送出的：直接把相關的待同步動作拿掉，不用再送刪除
  const neverSynced = outbox.some((o) => o.kind === "upsert" && o.table === table && o.row.id === id);
  outbox = outbox.filter((o) => {
    const ref = o.kind === "upsert" ? o.row : null;
    if ((o.kind === "upsert" ? ref?.id : o.id) === id && o.table === table) return false;
    // 子資料（上課時段、打卡）也一起拿掉，避免送出時找不到上層資料
    if (neverSynced && ref && (ref.course_id === id || ref.habit_id === id)) return false;
    return true;
  });
  if (!neverSynced) outbox.push({ kind: "delete", table, id });
  afterChange();
}

// 個人設定（每人一筆）：沒有就新增、有就更新
export function saveSettings(patch: Partial<Omit<UserSettings, "user_id" | "updated_at">>) {
  if (!data || !userId) return;
  const current = data.user_settings[0] ?? { user_id: userId, daily_goal_hours: 4, focus_minutes: 25, break_minutes: 5 };
  const row = { ...current, ...patch, user_id: userId, updated_at: new Date().toISOString() } as UserSettings;
  data = { ...data, user_settings: [row] };
  queue({ kind: "upsert", table: "user_settings", row: row as unknown as Record<string, unknown> });
  afterChange();
}

// ---------------------------------------------------------------------
// 同步
// ---------------------------------------------------------------------
let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), 500);
}

// 連不上網路、或登入憑證暫時失效 → 稍後重試（不丟掉這個動作）
function isRetryable(err: { message?: string; code?: string } | null) {
  if (!navigator.onLine) return true;
  const msg = (err?.message ?? "").toLowerCase();
  return msg.includes("fetch") || msg.includes("network") || msg.includes("jwt") || err?.code === "PGRST301";
}

async function pushOp(op: Op) {
  const t = supabase.from(op.table);
  if (op.kind === "upsert") return (await t.upsert(op.row)).error;
  if (op.kind === "update") return (await t.update(op.patch).eq("id", op.id)).error;
  return (await t.delete().eq("id", op.id)).error;
}

// Supabase 一次最多回 1000 筆，資料多時分頁讀
async function fetchAll(table: TableName) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data: page, error } = await supabase.from(table).select("*").range(from, from + 999);
    if (error) throw error;
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

let syncing = false;
export async function syncNow() {
  if (!userId || syncing) return;
  if (!navigator.onLine) {
    sync = { ...sync, online: false };
    emit();
    return;
  }
  const uid = userId;
  syncing = true;
  sync = { ...sync, syncing: true, online: true };
  emit();

  try {
    // 1. 送出待同步的動作（依順序）
    while (outbox.length > 0) {
      const err = await pushOp(outbox[0]);
      if (err && isRetryable(err)) throw err;
      if (err) {
        // 資料本身有問題（例如違反規則）：記下錯誤並跳過，避免整個清單卡住
        console.error("同步失敗，已略過：", outbox[0], err);
        sync = { ...sync, error: `有一筆修改無法同步：${err.message}` };
      }
      outbox.shift();
      persist();
      emit();
    }

    // 2. 拉回最新的完整資料
    const results = await Promise.all(TABLES.map((t) => fetchAll(t)));
    // 拉資料的期間有新的修改 → 先不覆蓋，下一輪再拉
    if (userId === uid && outbox.length === 0) {
      data = Object.fromEntries(TABLES.map((t, i) => [t, results[i]])) as Tables;
      persist();
    }
    sync = { ...sync, lastSynced: Date.now(), online: true };
  } catch (e) {
    const err = e as { message?: string };
    if (isRetryable(err)) sync = { ...sync, online: navigator.onLine };
    else sync = { ...sync, error: err.message ?? String(e) };
  } finally {
    syncing = false;
    sync = { ...sync, syncing: false };
    emit();
    // 同步期間又有新的修改 → 再跑一次
    if (outbox.length > 0 && navigator.onLine && userId === uid) scheduleSync();
  }
}
