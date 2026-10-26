// 可勾選的方框：外層 44px 方便手指點，內層 20px 方框
// 勾選時用簡單的縮放 + 變色動畫
export default function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string; // 給螢幕閱讀器用
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="group flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-[4px] border transition-all duration-200 group-active:scale-90 ${
          checked ? "border-primary bg-primary" : "border-muted group-hover:border-fg"
        }`}
      >
        <svg
          viewBox="0 0 16 16"
          className={`h-3 w-3 transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
      </span>
    </button>
  );
}
