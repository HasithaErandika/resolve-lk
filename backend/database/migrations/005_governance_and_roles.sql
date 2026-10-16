-- 005_governance_and_roles.sql
-- Resolve LK - governance redesign, part 1: provinces, councils, and the
-- extended profiles role/scope model (citizen / municipal_officer /
-- provincial_officer / system_admin). Requires 001-004 to have already run.
-- See docs/srs/03-governance-and-roles.md for the rationale and
-- docs/srs/06-data-model.md for the full schema writeup.

-- =========================================================
-- provinces
-- =========================================================

create table if not exists provinces (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table provinces enable row level security;

create policy "provinces_public_read"
  on provinces for select
  using (true);

-- =========================================================
-- councils
-- =========================================================

create table if not exists councils (
  id uuid default gen_random_uuid() primary key,
  province_id uuid references provinces not null,
  name text not null,
  district text not null,
  local_authority_type text not null default 'municipal_council'
    check (local_authority_type in ('municipal_council')), -- 'urban_council', 'pradeshiya_sabha' reserved for Phase 2
  operates_own_water_scheme boolean not null default false,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  unique (province_id, name)
);

alter table councils enable row level security;

create policy "councils_public_read"
  on councils for select
  using (true);

-- =========================================================
-- profiles - extend with contact info + role/scope
-- =========================================================

alter table profiles add column if not exists contact_email text;
alter table profiles add column if not exists contact_phone text;
alter table profiles add column if not exists council_id uuid references councils;
alter table profiles add column if not exists province_id uuid references provinces;

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('citizen', 'municipal_officer', 'provincial_officer', 'system_admin'));

alter table profiles drop constraint if exists role_scope_matches;
alter table profiles add constraint role_scope_matches check (
  (role = 'municipal_officer' and council_id is not null and province_id is null) or
  (role = 'provincial_officer' and province_id is not null and council_id is null) or
  (role in ('citizen', 'system_admin') and council_id is null and province_id is null)
);

-- Replaces the 001 version: now also carries contact info and scope from
-- auth metadata, for both citizen self-provisioning and officer provisioning
-- (see services/citizenService.js and services/councilService.js).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, nic, contact_email, contact_phone, role, council_id, province_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'nic',
    new.raw_user_meta_data ->> 'contact_email',
    new.raw_user_meta_data ->> 'contact_phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'citizen'),
    nullif(new.raw_user_meta_data ->> 'council_id', '')::uuid,
    nullif(new.raw_user_meta_data ->> 'province_id', '')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

-- =========================================================
-- No self-registration above citizen (reminder - enforced in application
-- code, see middleware/auth.js requireRole and services/councilService.js):
--   System Administrator -> creates Provincial Officer accounts
--   Provincial Officer   -> creates Municipal Officer accounts (own province only)
-- =========================================================
