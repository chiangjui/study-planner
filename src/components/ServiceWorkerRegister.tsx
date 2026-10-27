"use client";

import { useEffect } from "react";

// 註冊 Service Worker（讓網站離線也能打開）
// 只在正式網站啟用：開發時啟用會讓瀏覽器一直用舊的檔案，改程式看不到變化
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
  }, []);
  return null;
}
