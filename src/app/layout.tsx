import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Study Planner",
  description: "個人學業與日常管理",
  // 加入 Dock／主畫面時使用的圖示與名稱
  icons: { apple: `${base}/icons/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "Study Planner", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1C1C1E",
  // 讓畫面延伸到 iPhone 瀏海／Home 橫條區域，底部導覽列再用 safe-area 留空
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
