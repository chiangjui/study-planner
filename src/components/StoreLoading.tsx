"use client";

import { useStore } from "@/lib/store";

// 本機還沒有資料時顯示：通常一下子就同步完；第一次使用又剛好離線時，提示需要連線
export default function StoreLoading() {
  const { sync } = useStore();
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-4 text-center">
      <p className="card-title">{sync.online ? "Loading…" : "Offline"}</p>
      {!sync.online && <p className="text-sm text-muted">這台裝置還沒有資料，請先連上網路一次</p>}
    </main>
  );
}
