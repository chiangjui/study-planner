"use client";

import { useSyncExternalStore } from "react";

// 目前是否連上網路（連線狀態改變時畫面會更新；build 時預先產生的畫面當作在線上）
export function useOnline() {
  return useSyncExternalStore(
    (fn) => {
      window.addEventListener("online", fn);
      window.addEventListener("offline", fn);
      return () => {
        window.removeEventListener("online", fn);
        window.removeEventListener("offline", fn);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
