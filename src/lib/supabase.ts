import { createClient } from "@supabase/supabase-js";

// 從 .env.local（本機）或 GitHub Secrets（部署）讀取，build 時會被寫進程式碼
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 沒設定環境變數時，登入頁會顯示提示，而不是直接整個 build 失敗
export const isSupabaseConfigured = Boolean(url && anonKey);

// 全站共用同一個 Supabase client（登入狀態會自動存在瀏覽器的 localStorage）
export const supabase = createClient(
  url ?? "http://localhost:54321",
  anonKey ?? "missing-anon-key",
);
