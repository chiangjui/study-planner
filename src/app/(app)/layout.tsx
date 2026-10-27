import AuthGuard from "@/components/AuthGuard";
import AppNav, { MobileNav } from "@/components/AppNav";
import SyncStatus from "@/components/SyncStatus";
import { PomodoroProvider } from "@/lib/pomodoro";

// (app) 資料夾裡的所有頁面都需要登入
// 番茄鐘放在這一層，換頁時計時不會中斷
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PomodoroProvider>
        <AppNav />
        {/* 手機：離線或有待同步的修改時，在最上面顯示一條提示 */}
        <div className="flex justify-center md:hidden">
          <SyncStatus />
        </div>
        {/* 手機版底部留空間給導覽列 */}
        <div className="pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
        <MobileNav />
      </PomodoroProvider>
    </AuthGuard>
  );
}
