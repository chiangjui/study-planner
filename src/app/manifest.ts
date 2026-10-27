import type { MetadataRoute } from "next";

// 靜態輸出：build 時產生 manifest.webmanifest
export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// PWA 設定：讓瀏覽器可以「加入 Dock／主畫面」，像 App 一樣開啟
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Study Planner",
    short_name: "Study",
    description: "個人學業與日常管理",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#1C1C1E",
    theme_color: "#1C1C1E",
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
