# Study Planner

個人學業與日常管理 Web App（Next.js 靜態輸出 + Supabase，部署到 GitHub Pages）。

## 本機開發

```bash
npm install
cp .env.example .env.local   # 填入 Supabase URL 與 anon key
npm run dev
```

打開 http://localhost:3000/study-planner/ （網址要包含 basePath）

## 資料庫（Supabase SQL Editor）

- 全新專案：執行 `supabase/schema.sql`（建立所有資料表與 RLS），再執行 `supabase/seed.sql`（匯入課程）
- 已經建好的專案：只需要依序執行 `supabase/migrations/` 裡**還沒執行過**的檔案

## 部署（GitHub Pages）

push 到 `main` 分支時，`.github/workflows/deploy.yml` 會自動 build 並部署。

需要先在 GitHub repo 設定：

1. **Settings → Pages → Source** 選 **GitHub Actions**
2. **Settings → Secrets and variables → Actions** 新增兩個 secret：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`（只能用 anon / publishable key）
3. Supabase 後台 **Authentication → URL Configuration**：
   - Site URL：`https://<帳號>.github.io/study-planner/`
   - Redirect URLs 加入同一個網址（保留 `http://localhost:3000/study-planner/` 方便本機開發）

repo 名稱如果不是 `study-planner`，要同步修改 `next.config.ts` 最上面的 `repoName`。

## 專案結構

- `src/app/login/` — 登入／註冊頁
- `src/app/(app)/` — 需要登入的頁面（今日、行事曆、課程、習慣、設定）
- `src/components/` — 共用元件（卡片、待辦編輯視窗、導覽列…）
- `src/lib/` — Supabase client、日期（Asia/Taipei）、番茄鐘計時器、型別
- `supabase/` — 資料表、RLS、課程 seed、migrations
- `public/fonts/` — Proto Mono 字體
