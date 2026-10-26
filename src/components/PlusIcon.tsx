// 十字（+）圖示：大小與粗細照 Proto Mono 的「+」字形比例畫（跟著文字大小縮放），
// 但用 SVG 畫才能在按鈕裡完全置中（文字「+」的字形不在正中間，字距也會把它往旁邊推）
export default function PlusIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-[1em] w-[1em]" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 5.625v6.75M5.625 9h6.75" />
    </svg>
  );
}
