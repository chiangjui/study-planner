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

## 離線使用

- 資料存在瀏覽器的本機資料庫（IndexedDB），離線也能查看、新增、修改；上線後自動同步到 Supabase（`src/lib/store.ts`）
- 網站檔案由 Service Worker 存在電腦上，離線也能打開（`public/sw.js`，只在正式網站啟用）
- 建議在 Safari 用「檔案 → 加入 Dock」（Mac）或「分享 → 加入主畫面」（iPhone），像 App 一樣開啟
- 同一筆資料在兩台裝置離線時都被修改，上線後以最後同步的為準
- 有還沒同步的修改時不能登出（登出會清掉這台裝置上的資料副本）

## 專案結構

- `src/app/login/` — 登入／註冊頁
- `src/app/(app)/` — 需要登入的頁面（今日、行事曆、課程、習慣、設定）
- `src/components/` — 共用元件（卡片、待辦編輯視窗、導覽列…）
- `src/lib/` — 本機資料庫與同步（store）、Supabase client、日期（Asia/Taipei）、番茄鐘計時器、型別
- `supabase/` — 資料表、RLS、課程 seed、migrations
- `public/fonts/` — Proto Mono 字體
