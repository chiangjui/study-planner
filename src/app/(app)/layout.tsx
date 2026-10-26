import AuthGuard from "@/components/AuthGuard";
import AppNav from "@/components/AppNav";
import { PomodoroProvider } from "@/lib/pomodoro";

// (app) 資料夾裡的所有頁面都需要登入
// 番茄鐘放在這一層，換頁時計時不會中斷
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PomodoroProvider>
        <AppNav />
        {children}
      </PomodoroProvider>
    </AuthGuard>
  );
}
