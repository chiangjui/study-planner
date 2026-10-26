"use client";

import { useUser } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";

// 今日頁：第 3 階段會換成完整的 Bento Grid 儀表板，目前只是確認登入成功
export default function TodayPage() {
  const user = useUser();

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="card flex flex-col gap-6 md:max-w-md">
        <p className="card-title">Today</p>
        <div>
          <p className="text-sm text-muted">已登入</p>
          <p className="mt-1 break-all">{user.email}</p>
        </div>
        <button
          className="btn-primary self-start"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
