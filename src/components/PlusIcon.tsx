// 十字（+）圖示：用 SVG 畫，比文字「+」更能在按鈕裡完全置中
// （Proto Mono 的「+」字形不在正中間，按鈕的字距也會把它往旁邊推）
export default function PlusIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M8 2.5v11M2.5 8h11" strokeLinecap="round" />
    </svg>
  );
}
