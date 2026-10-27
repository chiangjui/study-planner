"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SyncStatus from "@/components/SyncStatus";

// 導覽項目的小圖示（線條風格，跟著文字顏色）
const ICONS: Record<string, React.ReactNode> = {
  "/": <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  "/calendar": <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />,
  "/courses": <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11" />,
  "/habits": <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6" />,
  "/settings": (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.4 7.4 0 0 0-1.8-1L15 3.5h-4l-.3 2.6a7.4 7.4 0 0 0-1.8 1l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.4 7.4 0 0 0 1.8 1l.3 2.6h4l.3-2.6a7.4 7.4 0 0 0 1.8-1l2.3 1 2-3.4z" />
  ),
};

export const NAV_ITEMS = [
  { href: "/", label: "Today", zh: "今日" },
  { href: "/calendar", label: "Calendar", zh: "行事曆" },
  { href: "/courses", label: "Courses", zh: "課程" },
  { href: "/habits", label: "Habits", zh: "習慣" },
  { href: "/settings", label: "Settings", zh: "設定" },
];

// 目前在哪個分頁（/course 詳細頁算在「課程」底下）
export function useActiveHref() {
  const path = usePathname().replace(/\/$/, "") || "/";
  if (path === "/course") return "/courses";
  return NAV_ITEMS.find((item) => item.href === path)?.href ?? "/";
}

// 桌機版頂部導覽列
export default function AppNav() {
  const active = useActiveHref();
  return (
    <nav className="mx-auto hidden max-w-[1360px] items-center gap-8 px-8 pt-6 md:flex">
      {/* 3x3 點陣圖示（參考設計稿左上角） */}
      <Link href="/" className="grid grid-cols-3 gap-[3px]" aria-label="Today">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="h-[4px] w-[4px] rounded-full bg-fg" />
        ))}
      </Link>
      <ul className="flex gap-6">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex h-11 items-center text-xs uppercase tracking-[0.1em] transition-colors ${
                active === item.href ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      {/* 同步狀態（離線、待同步…），都正常時不顯示 */}
      <SyncStatus className="ml-auto" />
    </nav>
  );
}

// 手機版底部導覽列（固定在畫面底部，避開 iPhone 的 Home 橫條）
export function MobileNav() {
  const active = useActiveHref();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                active === item.href ? "text-fg" : "text-muted"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
                aria-hidden
              >
                {ICONS[item.href]}
              </svg>
              {item.zh}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
