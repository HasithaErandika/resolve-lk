-- 001_init_schema.sql
-- Resolve LK — initial schema: profiles, civic_issues, triggers, RLS.
-- Run in the Supabase SQL editor (Project → SQL Editor → New query), in
-- order, before 002_points_rpc_and_search_indexes.sql.
-- See docs/srs/05-data-model.md for the rationale behind each decision here.

-- =========================================================
-- profiles
-- Extends auth.users with app-level role + NIC (National
-- Identity Card) uniqueness. Supabase Auth alone has no
-- citizen/admin distinction and no NIC field.
-- =========================================================

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  nic text unique,
  role text not null default 'citizen' check (role in ('citizen', 'admin')),
  points integer not null default 0,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table profiles enable row level security;

create policy "users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created — whether
-- that's the backend auto-provisioning a citizen from their NIC on first
-- report (supabaseAdmin.auth.admin.createUser), or an admin account created
-- by hand in the Supabase dashboard. full_name/nic come from user_metadata.
-- Public reporting always lands here as 'citizen' — admin role is granted
-- manually afterwards (see the UPDATE statement at the bottom).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, nic, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'nic',
    'citizen'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- civic_issues
-- =========================================================

create table if not exists civic_issues (
  id uuid default gen_random_uuid() primary key,
  citizen_id uuid references auth.users not null,
  category text not null check (category in ('Garbage', 'Road', 'Water', 'Lighting')),
  ward text not null,
  landmark text not null,
  description text not null check (char_length(description) >= 20),
  photo_url text,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Resolved')),
  ai_priority text check (ai_priority in ('Low', 'Medium', 'Critical')),
  ai_department text,
  ai_reason text,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

create index if not exists civic_issues_citizen_id_idx on civic_issues (citizen_id);
create index if not exists civic_issues_status_idx on civic_issues (status);
create index if not exists civic_issues_category_idx on civic_issues (category);

-- Keep updated_at current on every UPDATE (e.g. admin status changes).
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists civic_issues_set_updated_at on civic_issues;
create trigger civic_issues_set_updated_at
  before update on civic_issues
  for each row execute procedure public.set_updated_at();

alter table civic_issues enable row level security;

-- Citizens can see their own issues.
create policy "citizens_select_own"
  on civic_issues for select
  using (auth.uid() = citizen_id);

-- Citizens can insert their own issues.
-- (Defense in depth — normal writes go through the backend's service role
-- key, which bypasses RLS entirely. This policy protects any direct writes.)
create policy "citizens_insert_own"
  on civic_issues for insert
  with check (auth.uid() = citizen_id);

-- Admins can see every issue.
create policy "admins_select_all"
  on civic_issues for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins can update any issue (status changes).
create policy "admins_update_all"
  on civic_issues for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- =========================================================
-- Promote a user to admin (run manually, once, per admin account —
-- there is no admin self-registration anywhere in this system)
-- =========================================================
-- update profiles set role = 'admin' where id = '<the admin user''s uuid>';
