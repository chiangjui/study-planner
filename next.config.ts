import type { NextConfig } from "next";

// GitHub Pages 網址會是 https://<帳號>.github.io/<repo 名稱>/
// 如果你的 repo 不叫 study-planner，只要改這一行
const repoName = "study-planner";
const basePath = `/${repoName}`;

const nextConfig: NextConfig = {
  // 靜態輸出：build 後產生純 HTML/CSS/JS 到 out/，不需要伺服器
  output: "export",
  basePath,
  assetPrefix: basePath,
  // /login → /login/index.html，GitHub Pages 對這種結構支援最穩
  trailingSlash: true,
  // 靜態輸出無法使用 Next.js 內建的圖片最佳化
  images: { unoptimized: true },
  // 讓瀏覽器端程式碼也能取得 basePath（例如組 Email 確認信的回跳網址）
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
