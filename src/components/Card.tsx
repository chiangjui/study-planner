type Tone = "default" | "primary" | "secondary";

// 三種卡片底色：一般（深灰）、重點（霧藍）、次要（灰米色，文字改深色）
const TONE_CLASS: Record<Tone, string> = {
  default: "bg-card text-fg",
  primary: "bg-primary text-fg",
  secondary: "bg-secondary text-bg",
};

type CardProps = {
  title: string;
  tone?: Tone;
  action?: React.ReactNode; // 標題右側的小按鈕或文字
  className?: string; // 用來設定在格子裡佔幾欄、幾列
  children: React.ReactNode;
};

export default function Card({ title, tone = "default", action, className = "", children }: CardProps) {
  return (
    <section className={`flex flex-col rounded-card p-5 ${TONE_CLASS[tone]} ${className}`}>
      <header className="mb-4 flex min-h-6 items-center justify-between gap-2">
        <h2
          className={`text-xs uppercase tracking-[0.1em] ${
            tone === "default" ? "text-muted" : "opacity-80"
          }`}
        >
          {title}
        </h2>
        {action}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

// 大數字搭配小分母，例如「1.8 / 4H」「2 / 5」
export function BigNumber({ value, denominator }: { value: string | number; denominator?: string }) {
  return (
    <p className="flex items-baseline justify-between gap-3">
      <span className="text-5xl leading-none tabular-nums">{value}</span>
      {denominator && <span className="text-sm tabular-nums opacity-70">/ {denominator}</span>}
    </p>
  );
}

// 卡片裡沒有資料時的提示
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}
