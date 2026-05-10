create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_app_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,

  logs jsonb not null default '{}'::jsonb,
  history jsonb not null default '[]'::jsonb,
  pain_logs jsonb not null default '[]'::jsonb,
  cardio_logs jsonb not null default '[]'::jsonb,
  timer_sessions jsonb not null default '[]'::jsonb,
  weight_history jsonb not null default '[]'::jsonb,
  custom_plans jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_app_data add column if not exists timer_sessions jsonb not null default '[]'::jsonb;
alter table public.user_app_data add column if not exists weight_history jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';

alter table public.profiles enable row level security;
alter table public.user_app_data enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "user_app_data_select_own" on public.user_app_data for select using (auth.uid() = user_id);
create policy "user_app_data_insert_own" on public.user_app_data for insert with check (auth.uid() = user_id);
create policy "user_app_data_update_own" on public.user_app_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_app_data_delete_own" on public.user_app_data for delete using (auth.uid() = user_id);
