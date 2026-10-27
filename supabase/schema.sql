-- =====================================================================
-- Study Planner 資料表與 Row Level Security
-- 使用方式：整份貼到 Supabase 後台 → SQL Editor → Run
--
-- 共通設計：
-- - 每張表都有 user_id，預設值是 auth.uid()（目前登入者），前端新增時不用自己帶
-- - 每張表都開啟 RLS：每個人只能讀寫 user_id 等於自己的資料
-- - 刪除帳號時，該帳號的資料一起刪除（on delete cascade）
-- - 「日期」欄位用 date（不含時間），今天是幾號由前端依 Asia/Taipei 計算
-- =====================================================================


-- ---------------------------------------------------------------------
-- courses：課程基本資料
-- grading       成績比重，例如 [{"item": "期中考", "percent": 30}, ...]
-- weekly_topics 每週進度，例如 [{"week": 1, "date": "2026-09-14", "topic": "..."}, ...]
--               （有些課一週上兩次，所以同一週可能有兩筆）
-- ---------------------------------------------------------------------
create table public.courses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null,
  teacher       text,
  credits       smallint not null default 0 check (credits >= 0),
  grading       jsonb not null default '[]'::jsonb,
  weekly_topics jsonb not null default '[]'::jsonb,
  notes         text,
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- course_schedules：上課時段（一門課可以有多個）
-- weekday      1 = 週一 … 7 = 週日
-- period_label 節次，只用來顯示，例如 "5-6"、"F-G"
-- room         教室（同一門課不同時段可能在不同教室）
-- ---------------------------------------------------------------------
create table public.course_schedules (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  weekday      smallint not null check (weekday between 1 and 7),
  start_time   time not null,
  end_time     time not null,
  period_label text,
  room         text,
  check (end_time > start_time)
);


-- ---------------------------------------------------------------------
-- tasks：待辦、作業、考試、報告
-- type         homework 作業 / exam 考試 / report 報告 / general 一般
-- due_date     截止日（可空）
-- planned_date / planned_end_date 預計執行的第一天與最後一天（可空，可以跨多天）
-- start_time / end_time 時間（可空），有填就會排進行事曆時間軸（屬於 due_date 那一天）
-- 刪除課程時，待辦保留，只是 course_id 變成空的
-- ---------------------------------------------------------------------
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  course_id    uuid references public.courses (id) on delete set null,
  type         text not null default 'general'
               check (type in ('homework', 'exam', 'report', 'general')),
  due_date         date,
  planned_date     date,
  planned_end_date date,
  start_time       time,
  end_time         time,
  done             boolean not null default false,
  done_dates       date[] not null default '{}', -- 跨多天的待辦：已完成的日期
  created_at       timestamptz not null default now(),
  check (
    (planned_date is null and planned_end_date is null)
    or (planned_date is not null and planned_end_date >= planned_date)
  ),
  check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time and due_date is not null)
  )
);

create index tasks_user_due_idx on public.tasks (user_id, due_date);
create index tasks_user_planned_idx on public.tasks (user_id, planned_date);


-- ---------------------------------------------------------------------
-- study_sessions：讀書紀錄（番茄鐘結束時自動新增）
-- 刪除課程時，讀書紀錄保留，讀書總時數不會消失
-- ---------------------------------------------------------------------
create table public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_id        uuid references public.courses (id) on delete set null,
  started_at       timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  created_at       timestamptz not null default now()
);

create index study_sessions_user_started_idx on public.study_sessions (user_id, started_at);


-- ---------------------------------------------------------------------
-- habits / habit_logs：習慣項目與每日打卡
-- 同一個習慣同一天只能有一筆打卡（再點一次 = 刪除那筆 = 取消打卡）
-- ---------------------------------------------------------------------
create table public.habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  log_date date not null,
  unique (habit_id, log_date)
);

create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date);


-- ---------------------------------------------------------------------
-- workouts：運動紀錄
-- ---------------------------------------------------------------------
create table public.workouts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_date     date not null,
  kind             text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  created_at       timestamptz not null default now()
);

create index workouts_user_date_idx on public.workouts (user_id, workout_date);


-- ---------------------------------------------------------------------
-- user_settings：個人設定（每人一筆，user_id 就是主鍵）
-- 前端第一次讀不到時，用預設值顯示，儲存時再 upsert
-- ---------------------------------------------------------------------
create table public.user_settings (
  user_id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  daily_goal_hours numeric(3, 1) not null default 4 check (daily_goal_hours > 0),
  focus_minutes    smallint not null default 25 check (focus_minutes between 1 and 180),
  break_minutes    smallint not null default 5 check (break_minutes between 1 and 60),
  updated_at       timestamptz not null default now()
);


-- =====================================================================
-- Row Level Security
-- 對每張表：開啟 RLS + 一條規則「只能讀寫自己的資料」
-- (select auth.uid()) 的寫法是 Supabase 建議的，效能比直接寫 auth.uid() 好
-- =====================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'courses', 'course_schedules', 'tasks', 'study_sessions',
    'habits', 'habit_logs', 'workouts', 'user_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows only" on public.%I
         for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t
    );
    -- 只開放給已登入的使用者；未登入（anon）完全無法存取
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
