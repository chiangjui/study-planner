# Study Planner

個人學業與日常管理 Web App（Next.js 靜態輸出 + Supabase，部署到 GitHub Pages）。

## 本機開發

```bash
npm install
cp .env.example .env.local   # 填入 Supabase URL 與 anon key
npm run dev
```

打開 http://localhost:3000/study-planner/ （注意網址要包含 basePath）

## 專案結構

- `src/app/login/` — 登入／註冊頁
- `src/app/(app)/` — 需要登入的頁面（由 `AuthGuard` 在瀏覽器端檢查）
- `src/lib/supabase.ts` — Supabase client
- `public/fonts/` — Proto Mono 字體
- `next.config.ts` — 靜態輸出、basePath（repo 名稱改了要同步改這裡）
