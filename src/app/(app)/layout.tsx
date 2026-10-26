import AuthGuard from "@/components/AuthGuard";

// (app) 資料夾裡的所有頁面都需要登入
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
