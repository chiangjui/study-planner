// Service Worker：把網站檔案存在電腦上，離線也能打開 app
// （資料的離線與同步由 src/lib/store.ts 負責，這裡只處理網頁檔案）
//
// 策略：
// - 網頁（HTML 與頁面資料 .txt）：先上網拿最新的，失敗（離線）才用存起來的
// - /_next/static/ 的程式與樣式：檔名含版本號、內容不會變，直接用存起來的
// - 其他（字型、圖示）：先用存起來的，同時在背景更新

const PAGES_CACHE = "pages-v1";
const STATIC_CACHE = "static-v1";
const BASE = self.location.pathname.replace(/sw\.js$/, ""); // 例如 /study-planner/

// 所有頁面（安裝時先存好，第一次離線也打得開）
const PAGES = ["", "login/", "calendar/", "courses/", "course/", "habits/", "settings/", "study/"];

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // 清掉舊版本的快取
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![PAGES_CACHE, STATIC_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 存下每個頁面，以及頁面用到的程式與樣式
async function precache() {
  const pages = await caches.open(PAGES_CACHE);
  const statics = await caches.open(STATIC_CACHE);
  await Promise.all(
    PAGES.map(async (p) => {
      try {
        const url = BASE + p;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        await pages.put(url, res.clone());
        const html = await res.text();
        const assets = [...html.matchAll(/["'](\/[^"']*\/_next\/static\/[^"']+)["']/g)].map((m) => m[1]);
        await Promise.all([...new Set(assets)].map((a) => statics.add(a).catch(() => {})));
        // 頁面切換時用的頁面資料
        const txt = await fetch(url + "index.txt", { cache: "no-store" }).catch(() => null);
        if (txt && txt.ok) await pages.put(url + "index.txt", txt);
      } catch {
        // 某一頁失敗不影響其他頁
      }
    }),
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // 只處理這個網站自己的 GET 請求（Supabase 的資料請求不經過這裡）
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
  } else if (req.mode === "navigate" || url.pathname.endsWith(".txt")) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) (await caches.open(cacheName)).put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const res = await fetch(req);
    // 存的時候去掉網址後面的 ?…（例如 /course/?id=xxx 都用同一份頁面）
    if (res.ok) cache.put(stripSearch(req.url), res.clone());
    return res;
  } catch {
    const cached = await cache.match(stripSearch(req.url));
    if (cached) return cached;
    // 找不到這一頁：回到首頁（首頁會自己處理）
    return (await cache.match(BASE)) || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  const update = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || update;
}

function stripSearch(href) {
  const u = new URL(href);
  u.search = "";
  return u.href;
}
