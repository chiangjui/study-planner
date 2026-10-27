-- =====================================================================
-- 003：跨多天的待辦可以每天分開勾選完成
-- 使用方式：貼到 Supabase 後台 → SQL Editor → New query → Run（只需要執行一次）
--
-- done_dates：已完成的日期（例如預計執行 4 天，第一天做完就記下第一天）
-- 原本的 done 欄位仍代表「整筆完成」
-- =====================================================================

alter table public.tasks
  add column if not exists done_dates date[] not null default '{}';
