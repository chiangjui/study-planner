"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

// 桌機版頂部導覽列（手機版的底部導覽列在第 7 階段加入）
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
    </nav>
  );
}
