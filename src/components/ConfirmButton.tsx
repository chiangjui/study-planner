"use client";

import { useEffect, useState } from "react";

/**
 * 需要確認的按鈕（例如刪除）：第一次按 → 變成「再按一次確認」，5 秒內再按才執行
 * 不用瀏覽器內建的 confirm()，因為有些環境（例如 app 內的預覽視窗）會直接擋掉它
 */
export default function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "再按一次確認",
  className = "",
  armedClassName = "text-secondary",
  ariaLabel,
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  confirmLabel?: React.ReactNode;
  className?: string;
  armedClassName?: string;
  ariaLabel?: string;
}) {
  const [armed, setArmed] = useState(false);

  // 5 秒內沒按第二次就恢復
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      aria-label={armed ? undefined : ariaLabel}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      className={`${className} ${armed ? armedClassName : ""}`}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
