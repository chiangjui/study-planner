"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useOnline } from "@/lib/useOnline";

type Mode = "login" | "signup";

// 把常見的 Supabase 英文錯誤訊息轉成中文
function toChinese(message: string) {
  if (message.includes("Invalid login credentials")) return "Email 或密碼錯誤";
  if (message.includes("Email not confirmed")) return "請先到信箱點擊確認信";
  if (message.includes("User already registered")) return "這個 Email 已經註冊過了";
  if (message.includes("Password should be")) return "密碼至少需要 6 個字元";
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const online = useOnline();

  // 已經登入的話，直接進首頁
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(toChinese(error.message));
      else router.replace("/");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // 確認信裡的連結點下去後回到這個網站（含 basePath）
        options: {
          emailRedirectTo: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`,
        },
      });
      if (error) setError(toChinese(error.message));
      else if (data.session) router.replace("/"); // Supabase 關閉 Email 確認時會直接登入
      else setNotice("註冊成功！請到信箱點擊確認信後再登入。");
    }

    setLoading(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl tracking-[0.1em]">STUDY PLANNER</h1>

        <div className="card">
          {/* 登入／註冊切換 */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-[4px] bg-bg p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`h-11 rounded-[4px] text-xs uppercase tracking-[0.1em] transition-colors ${
                  mode === m ? "bg-card text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {!online && (
            <p className="mb-4 rounded-[4px] border border-line p-3 text-sm text-secondary">
              目前離線：登入需要網路。登入過的裝置離線時可以直接使用。
            </p>
          )}

          {!isSupabaseConfigured && (
            <p className="mb-4 rounded-[4px] border border-line p-3 text-sm text-secondary">
              尚未設定 Supabase：請建立 .env.local 並重新啟動。
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="card-title">Email</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="card-title">Password</span>
              <input
                className="input"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {notice && <p className="text-sm text-secondary">{notice}</p>}

            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? "…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
