import PageHeader from "@/components/PageHeader";
import HabitsManager from "@/components/habits/HabitsManager";
import WorkoutsManager from "@/components/habits/WorkoutsManager";

// 習慣與運動頁：桌機左右兩欄，手機上下排列
export default function HabitsPage() {
  return (
    <main className="mx-auto max-w-[1360px] px-4 py-4 md:px-8 md:py-6">
      <PageHeader title="Habits & Workouts" />
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <HabitsManager />
        <WorkoutsManager />
      </div>
    </main>
  );
}
