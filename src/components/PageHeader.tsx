import Link from "next/link";

// 子頁面的頂部：左邊返回（手機才顯示，桌機有導覽列），右邊頁面標題與按鈕
export default function PageHeader({
  title,
  backHref = "/",
  backLabel = "Today",
  children,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-3 flex min-h-11 items-center justify-between gap-4">
      <Link
        href={backHref}
        className={`flex h-11 items-center text-xs uppercase tracking-[0.1em] text-muted hover:text-fg ${
          backHref === "/" ? "md:hidden" : ""
        }`}
      >
        ← {backLabel}
      </Link>
      <h1 className={`text-xs uppercase tracking-[0.1em] ${backHref === "/" ? "md:mr-auto" : ""}`}>{title}</h1>
      {children}
    </header>
  );
}
