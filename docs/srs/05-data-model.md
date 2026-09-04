# 05 — Data Model & Row Level Security

Owner: **Bhanuka Samarasinghe (Supabase & Storage Architect)**. Run the migrations in [`backend/database/migrations/`](../../backend/database/migrations/) in order (001, then 002) in the Supabase SQL editor early in the Build phase — everything else depends on it. (Those files are the source of truth; this doc explains the *why*.)

## Tables

### `profiles`

Extends `auth.users` with an app-level role, NIC, and a contribution-points counter. Supabase Auth alone has no `citizen`/`admin` distinction and no NIC field.

Citizens are identified by their **National Identity Card (NIC) number** — the one identity value every Sri Lankan citizen already has, and it stops one person from filing duplicate/fake reports under multiple accounts. Supabase Auth still requires a real **email** as the account's actual username/password-login field, so the report form collects both: **NIC is the durable identity** (what find-or-create and "My Reports" are keyed on), **email satisfies Supabase's login requirement**. See [`02-solution-overview.md`](02-solution-overview.md) for the full flow.

```sql
create table profiles (
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
-- report, or an admin account created by hand in the Supabase dashboard.
-- full_name/nic come from user_metadata.
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

### NIC & email validation rules (Seneja Thehansi, on the report form; mirrored server-side by Hasitha in `backend/src/validation/issues.js`)

Sri Lankan NIC numbers come in two valid formats:

- **Old format:** 9 digits followed by `V` or `X` (e.g. `851234567V`)
- **New format:** 12 digits (e.g. `200112345678`)

```
^([0-9]{9}[VvXx]|[0-9]{12})$
```

Friendly error message on NIC mismatch: *"Please enter a valid NIC number — either 9 digits followed by V/X, or 12 digits."*
Friendly error message on invalid email: *"Please enter a valid email address — we use it to set up your account."*

There is no separate "duplicate NIC" error to show — reusing an existing NIC is the normal, expected path (it just reuses that citizen's account); it is not treated as an error.

**Scope note:** we validate NIC *format* and *uniqueness in our own database* only. We do not verify the NIC against the Department for Registration of Persons or any government registry — that integration doesn't exist as a public API and is out of scope for a 4-hour build. State this plainly if asked in the demo Q&A.

**Auth trade-off (mention as a known limitation, not a blocker):** the backend sets each auto-provisioned account's password to the citizen's own NIC, so "My Reports" can work with just a NIC typed in — see [`06-api-specification.md`](06-api-specification.md#post-apimy-reportslogin). Since NIC is semi-public information in Sri Lanka, this means anyone who knows a citizen's NIC could view (not forge) their report history. Acceptable for a 4-hour civic-reporting demo; flagged as a production hardening gap, alongside storing NIC as plain text rather than encrypted at rest.

**To create the admin test account:** create a user via the Supabase dashboard (Authentication → Add user) with a real admin email, then in the SQL editor:

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

> Note: since the backend performs writes with the **service role key**, RLS is bypassed for those requests by design (that's what the service role is for). RLS here is what protects any *direct* frontend reads with the anon key — including the session a citizen gets from `POST /api/my-reports/login`. Keep both — the backend enforces business rules (e.g. "citizens can only submit as themselves"), RLS is the database-level backstop.

## Contribution points

`profiles.points` is a simple running counter, updated by the backend (not a DB trigger, for a hackathon-simple/easy-to-explain-live implementation — see `backend/src/lib/citizens.js#awardPoints`):

- **+10** when a citizen submits a report (`POST /api/issues`)
- **+15** bonus when an admin marks that report `Resolved` (`PATCH /api/issues/:id/status`)

## Sample seed data

See [`backend/database/seed.sql`](../../backend/database/seed.sql) — run it after the schema is in place, once at least one citizen account exists, so the feed and admin dashboard aren't empty during the demo.

## Cloudflare R2 setup (Bhanuka Samarasinghe)

1. Create a bucket, e.g. `resolve-lk-photos`.
2. Enable public access (or connect the bucket to a public `r2.dev` subdomain / custom domain) so stored photo URLs are directly viewable.
3. Create an R2 API token (Account → R2 → Manage API tokens) with read/write access scoped to this bucket.
4. Hand the following to Hasitha for the backend `.env`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL_BASE`.
