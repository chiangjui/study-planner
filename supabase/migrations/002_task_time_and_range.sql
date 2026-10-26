-- =====================================================================
-- 002：待辦可以加上時間、預計執行可以跨多天
-- 使用方式：貼到 Supabase 後台 → SQL Editor → Run（只需要執行一次）
--
-- planned_end_date  預計執行的最後一天（開始日 = planned_date）
-- start_time / end_time  有填就會排進行事曆時間軸（時間屬於 due_date 那一天）
-- =====================================================================

alter table public.tasks
  add column if not exists planned_end_date date,
  add column if not exists start_time time,
  add column if not exists end_time time;

-- 舊資料：預計執行只有一天，結束日 = 開始日
update public.tasks
set planned_end_date = planned_date
where planned_date is not null and planned_end_date is null;

-- 預計執行：有開始日才有結束日，且結束日不早於開始日
alter table public.tasks
  add constraint tasks_planned_range_check
  check (
    (planned_date is null and planned_end_date is null)
    or (planned_date is not null and planned_end_date >= planned_date)
  );

-- 時間：開始、結束要一起填，結束晚於開始，而且必須有日期
alter table public.tasks
  add constraint tasks_time_check
  check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time and due_date is not null)
  );
