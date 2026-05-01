create extension if not exists pgcrypto;

create table if not exists public.taylor_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  messages jsonb not null default '[]'::jsonb,
  selected_files text[] not null default '{}'::text[],
  allow_web boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists taylor_sessions_user_updated_idx
  on public.taylor_sessions (user_id, updated_at desc);

create table if not exists public.taylor_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  details jsonb not null default '{}'::jsonb,
  comment text,
  improvement_thought text,
  created_at timestamptz not null default now()
);

create index if not exists taylor_usage_log_user_created_idx
  on public.taylor_usage_log (user_id, created_at desc);

alter table public.taylor_sessions enable row level security;
alter table public.taylor_usage_log enable row level security;

drop policy if exists "Users can read their own Taylor sessions" on public.taylor_sessions;
create policy "Users can read their own Taylor sessions"
  on public.taylor_sessions for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own Taylor sessions" on public.taylor_sessions;
create policy "Users can insert their own Taylor sessions"
  on public.taylor_sessions for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Taylor sessions" on public.taylor_sessions;
create policy "Users can update their own Taylor sessions"
  on public.taylor_sessions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Taylor sessions" on public.taylor_sessions;
create policy "Users can delete their own Taylor sessions"
  on public.taylor_sessions for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own Taylor usage log" on public.taylor_usage_log;
create policy "Users can read their own Taylor usage log"
  on public.taylor_usage_log for select
  using ((select auth.uid()) = user_id);
