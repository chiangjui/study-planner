import Link from "next/link";

// 子頁面的頂部：左邊返回今日頁，右邊頁面標題
export default function PageHeader({ title }: { title: string }) {
  return (
    <header className="mb-3 flex items-center justify-between">
      <Link href="/" className="flex h-11 items-center text-xs uppercase tracking-[0.1em] text-muted hover:text-fg">
        ← Today
      </Link>
      <h1 className="text-xs uppercase tracking-[0.1em]">{title}</h1>
    </header>
  );
}
