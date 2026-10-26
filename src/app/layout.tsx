import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Planner",
  description: "個人學業與日常管理",
};

export const viewport: Viewport = {
  themeColor: "#1C1C1E",
  // 讓畫面延伸到 iPhone 瀏海／Home 橫條區域，底部導覽列再用 safe-area 留空
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
