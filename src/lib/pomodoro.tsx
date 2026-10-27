"use client";

/**
 * 番茄鐘計時器（全站共用）
 *
 * 不中斷的關鍵：只記錄「開始時間」與「結束時間」(endsAt)，
 * 剩餘時間每次都用 endsAt - 現在 計算；狀態存在 localStorage，
 * 所以換頁、重新整理、關掉分頁再打開都能接續。
 * setInterval 只負責更新畫面上的數字，不負責計時。
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { insertRow } from "@/lib/store";

type Running = {
  phase: "focus" | "break";
  courseId: string;
  startedAt: number; // 這個階段開始的時間（毫秒）
  endsAt: number; // 這個階段結束的時間（毫秒）
  focusMinutes: number;
  breakMinutes: number;
};
export type TimerState = { phase: "idle" } | Running;

const IDLE: TimerState = { phase: "idle" };
const STORAGE_KEY = "study-planner:pomodoro";

function load(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TimerState) : IDLE;
  } catch {
    return IDLE;
  }
}

function save(state: TimerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 無痕模式等情況可能無法寫入，計時仍可在這個頁面繼續
  }
}

// 用 Web Audio 發出三聲短嗶，不需要音效檔
function beep(ctx: AudioContext | null) {
  if (!ctx) return;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    const t = ctx.currentTime + i * 0.3;
    osc.start(t);
    osc.stop(t + 0.15);
  }
}

// 計時結束提醒：一定播聲音；分頁在背景時另外發瀏覽器通知
function notify(ctx: AudioContext | null, title: string, body: string) {
  beep(ctx);
  if (document.hidden && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

// 寫入一筆讀書紀錄（先存本機，有網路時自動同步，所以離線也能記錄）
function recordSession(courseId: string, startedAt: number, minutes: number) {
  insertRow("study_sessions", {
    course_id: courseId,
    started_at: new Date(startedAt).toISOString(),
    duration_minutes: minutes,
  });
}

type PomodoroContextValue = {
  state: TimerState;
  remainingMs: number;
  start: (courseId: string, focusMinutes: number, breakMinutes: number) => void;
  stop: () => void; // 休息中：略過休息
  finishEarly: () => void; // 專注中提早結束：已專注的分鐘數照樣記錄
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro 必須在 PomodoroProvider 裡使用");
  return ctx;
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  // 這個元件只在登入後才會顯示，所以可以直接讀 localStorage
  const [state, setState] = useState<TimerState>(load);
  const [now, setNow] = useState(() => Date.now());
  const audioRef = useRef<AudioContext | null>(null);

  const persist = useCallback((next: TimerState) => {
    save(next);
    setState(next);
    setNow(Date.now());
  }, []);

  // 每 250ms 更新一次畫面上的倒數數字
  useEffect(() => {
    if (state.phase === "idle") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.phase]);

  // 在結束時間點觸發一次（單次 setTimeout 在背景分頁也比較準時）
  useEffect(() => {
    if (state.phase === "idle") return;

    function complete() {
      // 以 localStorage 為準：如果另一個分頁已經處理過，就直接同步
      const current = load();
      if (current.phase === "idle" || state.phase === "idle" || current.startedAt !== state.startedAt) {
        setState(current);
        return;
      }

      if (current.phase === "focus") {
        // 先切換到休息（避免重複記錄），再寫入讀書紀錄
        const breakEnd = current.endsAt + current.breakMinutes * 60_000;
        persist(
          breakEnd > Date.now()
            ? { ...current, phase: "break", startedAt: current.endsAt, endsAt: breakEnd }
            : IDLE, // 關掉分頁太久，休息時間也已經過了
        );
        notify(audioRef.current, "專注結束！", `已記錄 ${current.focusMinutes} 分鐘，休息一下吧`);

        recordSession(current.courseId, current.endsAt - current.focusMinutes * 60_000, current.focusMinutes);
      } else {
        persist(IDLE);
        notify(audioRef.current, "休息結束", "準備開始下一輪專注");
      }
    }

    const id = setTimeout(complete, Math.max(0, state.endsAt - Date.now()));
    return () => clearTimeout(id);
  }, [state, persist]);

  // 其他分頁開始或停止計時時同步
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setState(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const start = useCallback(
    (courseId: string, focusMinutes: number, breakMinutes: number) => {
      // 瀏覽器規定聲音與通知權限要在使用者點擊時取得，所以在按下開始時準備好
      audioRef.current ??= new AudioContext();
      audioRef.current.resume();
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
      const t = Date.now();
      persist({ phase: "focus", courseId, startedAt: t, endsAt: t + focusMinutes * 60_000, focusMinutes, breakMinutes });
    },
    [persist],
  );

  const stop = useCallback(() => persist(IDLE), [persist]);

  // 提早結束專注：例如 50 分鐘的專注在第 42 分鐘結束，就記錄 42 分鐘（不到 1 分鐘不記錄）
  const finishEarly = useCallback(() => {
    const current = load();
    persist(IDLE);
    if (current.phase !== "focus") return;
    const minutes = Math.floor((Date.now() - current.startedAt) / 60_000);
    if (minutes >= 1) recordSession(current.courseId, current.startedAt, minutes);
  }, [persist]);

  const remainingMs = state.phase === "idle" ? 0 : Math.max(0, state.endsAt - now);

  return (
    <PomodoroContext.Provider value={{ state, remainingMs, start, stop, finishEarly }}>
      {children}
    </PomodoroContext.Provider>
  );
}
