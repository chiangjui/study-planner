import Link from "next/link";

// 子頁面的頂部：左邊返回上一層（只有子頁面才有，例如課程詳細 → 課程列表），右邊按鈕
// 回到今日頁由導覽列負責（桌機頂部、手機底部）
export default function PageHeader({
  title,
  backHref,
  backLabel,
  children,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-3 flex min-h-11 items-center gap-4">
      {backHref && (
        <Link href={backHref} className="flex h-11 items-center text-xs uppercase tracking-[0.1em] text-muted hover:text-fg">
          ← {backLabel}
        </Link>
      )}
      <h1 className={`text-xs uppercase tracking-[0.1em] ${backHref ? "ml-auto" : "mr-auto"}`}>{title}</h1>
      {children}
    </header>
  );
}
