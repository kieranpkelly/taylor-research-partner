create table if not exists public.taylor_access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null
);

create index if not exists taylor_access_requests_status_created_idx
  on public.taylor_access_requests (status, created_at desc);

alter table public.taylor_access_requests enable row level security;
