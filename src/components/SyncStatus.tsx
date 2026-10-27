"use client";

import { syncNow, useStore } from "@/lib/store";

// 同步狀態：離線 / 同步中 / 有幾筆沒同步 / 同步錯誤；都正常時不顯示
// 點一下會立刻重試同步
export default function SyncStatus({ className = "" }: { className?: string }) {
  const { sync } = useStore();

  let label = "";
  let dot = "bg-muted";
  if (!sync.online) {
    label = sync.pending > 0 ? `離線中 · ${sync.pending} 筆待同步` : "離線中";
    dot = "bg-secondary";
  } else if (sync.syncing) {
    label = "同步中…";
    dot = "bg-primary animate-pulse";
  } else if (sync.pending > 0) {
    label = `${sync.pending} 筆待同步`;
    dot = "bg-secondary";
  } else if (sync.error) {
    label = "同步錯誤";
    dot = "bg-red-400";
  }
  if (!label) return null;

  return (
    <button
      onClick={() => syncNow()}
      title={sync.error || "點一下重新同步"}
      className={`flex h-11 items-center gap-2 text-xs text-muted hover:text-fg ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </button>
  );
}
