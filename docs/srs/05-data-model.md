# 05 — Data Model & Row Level Security

Owner: **Member 3 (Supabase & Storage Architect)**. Run this in the Supabase SQL editor early in the Build phase — everything else depends on it.

## Tables

### `profiles`

Extends `auth.users` with an app-level role. Supabase Auth alone has no `citizen`/`admin` distinction — this table is what makes role-based access possible.

Citizens register with their **National Identity Card (NIC) number** as a unique identifier — it's the one identity value every Sri Lankan citizen already has, and it stops one person from filing duplicate/fake reports under multiple accounts.

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  nic text unique,
  role text not null default 'citizen' check (role in ('citizen', 'admin')),
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table profiles enable row level security;

create policy "users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
-- Public signup always lands here as 'citizen' by default.
-- nic/full_name are passed as Supabase Auth signup metadata (see below).
create function public.handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### NIC validation rules (Member 1, on the signup form; mirror server-side)

Sri Lankan NIC numbers come in two valid formats:

- **Old format:** 9 digits followed by `V` or `X` (e.g. `851234567V`)
- **New format:** 12 digits (e.g. `200112345678`)

```
^([0-9]{9}[VvXx]|[0-9]{12})$
```

Friendly error message on mismatch: *"Please enter a valid NIC number — either 9 digits followed by V/X, or 12 digits."*
Friendly error message on duplicate (the `profiles_nic_key` unique constraint will reject it — surface a clean message, not the raw DB error): *"An account already exists for this NIC. Please log in instead."*

**Scope note:** we validate *format* and *uniqueness in our own database* only. We do not verify the NIC against the Department for Registration of Persons or any government registry — that integration doesn't exist as a public API and is out of scope for a 4-hour build. State this plainly if asked in the demo Q&A.

**Privacy note (mention as a known limitation, not a blocker):** NIC is stored as plain text for the hackathon to keep signup simple. In a production system this column should be encrypted at rest and masked in the UI (e.g. admin views show only the last 4 digits). Not required to implement for the demo, but worth stating you're aware of it — it reads well in the "quality & ownership" part of the Q&A.

**To create the admin test account:** sign up normally through the app (or Supabase dashboard → Authentication → Add user), then in the SQL editor:

```sql
update profiles set role = 'admin' where id = '<the admin user''s uuid>';
```

Do this once during setup. Do not build a UI for it.

### `civic_issues`

```sql
create table civic_issues (
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
```

## Row Level Security

```sql
alter table civic_issues enable row level security;

-- Citizens can see their own issues
create policy "citizens_select_own"
  on civic_issues for select
  using (auth.uid() = citizen_id);

-- Citizens can insert their own issues (defense in depth — normal writes go
-- through the backend's service role key, which bypasses RLS entirely)
create policy "citizens_insert_own"
  on civic_issues for insert
  with check (auth.uid() = citizen_id);

-- Admins can see every issue
create policy "admins_select_all"
  on civic_issues for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins can update any issue (status changes)
create policy "admins_update_all"
  on civic_issues for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
```

> Note: since the backend performs writes with the **service role key**, RLS is bypassed for those requests by design (that's what the service role is for). RLS here is what protects any *direct* frontend reads with the anon key. Keep both — the backend enforces business rules (e.g. "citizens can only submit as themselves"), RLS is the database-level backstop.

## Sample seed data

Run after the schema is in place, once at least one citizen account exists, so the admin dashboard isn't empty during the demo:

```sql
insert into civic_issues (citizen_id, category, ward, landmark, description, status, ai_priority, ai_department, ai_reason)
values
  ('<citizen uuid>', 'Garbage', 'Colombo 06', 'Near Wellawatte market', 'Large uncollected garbage pile attracting stray dogs and mosquitoes for over a week.', 'Pending', 'Critical', 'Public Health', 'Standing waste near a market poses a dengue and sanitation risk.'),
  ('<citizen uuid>', 'Road', 'Nugegoda', 'Opposite the bus stand', 'Deep pothole causing two-wheeler accidents during evening traffic.', 'In Progress', 'Medium', 'Roads & Infrastructure', 'Accident risk but not an immediate public health hazard.'),
  ('<citizen uuid>', 'Lighting', 'Maharagama', 'Access road to the housing scheme', 'Streetlight has been off for three weeks, area is unsafe at night.', 'Pending', 'Medium', 'Electrical Maintenance', 'Safety concern, not urgent health risk.'),
  ('<citizen uuid>', 'Water', 'Dehiwala', 'Near the railway crossing', 'Burst pipe flooding the road since yesterday morning.', 'Resolved', 'Critical', 'Water Supply', 'Active water loss and road hazard required immediate response.');
```

## Cloudflare R2 setup (Member 3)

1. Create a bucket, e.g. `resolve-lk-photos`.
2. Enable public access (or connect the bucket to a public `r2.dev` subdomain / custom domain) so stored photo URLs are directly viewable.
3. Create an R2 API token (Account → R2 → Manage API tokens) with read/write access scoped to this bucket.
4. Hand the following to Member 4 for the backend `.env`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL_BASE`.
