"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const UserContext = createContext<User | null>(null);

// 在已登入的頁面中取得目前使用者
export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser 必須在 AuthGuard 裡使用");
  return user;
}

/**
 * 登入檢查（全部在瀏覽器端完成，因為靜態網站沒有伺服器）
 * - 還在確認登入狀態時：顯示載入中
 * - 沒登入：導向 /login
 * - 已登入：顯示頁面內容
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 先讀取瀏覽器裡已存的登入狀態
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser(data.session.user);
        setChecking(false);
      } else {
        router.replace("/login");
      }
    });

    // 之後如果登出（或 session 過期），也要導回登入頁
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        router.replace("/login");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (checking || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="card-title">Loading…</p>
      </div>
    );
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
