import PageHeader from "@/components/PageHeader";
import WeekCalendar from "@/components/calendar/WeekCalendar";

// 週行事曆頁
export default function CalendarPage() {
  return (
    <main className="mx-auto max-w-[1360px] px-4 py-4 md:px-8 md:py-6">
      <PageHeader title="Calendar" />
      <WeekCalendar />
    </main>
  );
}
