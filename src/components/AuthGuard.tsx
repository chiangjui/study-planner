"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { clearStore, initStore } from "@/lib/store";

const UserContext = createContext<User | null>(null);

// 在已登入的頁面中取得目前使用者
export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser 必須在 AuthGuard 裡使用");
  return user;
}

// 離線時：直接讀瀏覽器裡存的登入資料（登入憑證可能已過期，但離線時仍允許使用，上線後會自動更新）
function storedUser(): User | null {
  try {
    const key = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    return key ? (JSON.parse(localStorage.getItem(key)!).user as User) : null;
  } catch {
    return null;
  }
}

/**
 * 登入檢查（全部在瀏覽器端完成，因為靜態網站沒有伺服器）
 * - 還在確認登入狀態時：顯示載入中
 * - 沒登入：導向 /login
 * - 已登入：開始同步資料，顯示頁面內容
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    function signedIn(u: User) {
      setUser(u);
      initStore(u.id);
    }

    // 離線：直接用存著的登入資料（不等 getSession，它離線時會一直重試更新憑證，要等很久）
    const offlineUser = navigator.onLine ? null : storedUser();
    if (offlineUser) signedIn(offlineUser);

    // 讀取瀏覽器裡已存的登入狀態（離線時在背景進行，上線後會更新憑證）
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) signedIn(data.session.user);
      else if (!offlineUser) {
        const u = navigator.onLine ? null : storedUser();
        if (u) signedIn(u);
        else router.replace("/login");
      }
    });

    // 之後如果登出（或 session 失效），導回登入頁；離線時更新憑證失敗不算登出
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) signedIn(session.user);
      else if (event === "SIGNED_OUT") {
        clearStore();
        router.replace("/login");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="card-title">Loading…</p>
      </div>
    );
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
