# 06 - Data Model & Row Level Security

Run migrations in [`backend/database/migrations/`](../../backend/database/migrations/) in order in the Supabase SQL editor - everything else depends on it. This doc explains the *why*; the migration files are the source of truth for exact SQL.

**This is a full schema redesign from the hackathon version** - new tables (`provinces`, `councils`, `issue_status_history`), an extended `profiles` role model, and `civic_issues` gaining council scoping, jurisdiction fields, and SLA timestamps. Citizen OTP rides on Supabase Auth's own passwordless email flow, not a new table, see the note near the end of this document. See [`03-governance-and-roles.md`](03-governance-and-roles.md) for the reasoning behind every new column below - this doc is the "what," that one is the "why."

## `provinces`

```sql
create table provinces (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,          -- e.g. 'Western Province'
  created_at timestamp with time zone default timezone('utc', now()) not null
);
```

Nine rows, seeded once. Exists as a first-class table (not a free-text field) because a Provincial Officer's entire scope is defined by it.

## `councils`

```sql
create table councils (
  id uuid default gen_random_uuid() primary key,
  province_id uuid references provinces not null,
  name text not null,                              -- e.g. 'Colombo Municipal Council'
  district text not null,                           -- e.g. 'Colombo'
  local_authority_type text not null default 'municipal_council'
    check (local_authority_type in ('municipal_council')), -- 'urban_council', 'pradeshiya_sabha' reserved for Phase 2
  operates_own_water_scheme boolean not null default false, -- see jurisdiction table in 03-governance-and-roles.md
  latitude double precision,   -- single reference point (administrative centre), not a jurisdiction boundary
  longitude double precision,  -- see findNearestCouncil() below
  created_at timestamp with time zone default timezone('utc', now()) not null,
  unique (province_id, name)
);
```

`latitude`/`longitude` back `services/councilService.js#findNearestCouncil`, a Haversine straight-line distance from a citizen's GPS point to each council's reference point, used only as a "did you mean this council?" suggestion on the report form, never a hard override. See [`03-governance-and-roles.md`](03-governance-and-roles.md#location-based-council-suggestion-haversine) for why a single reference point per council is a stated approximation, not a real jurisdiction boundary.

`local_authority_type` is constrained to `municipal_council` only in v1 by the `check`, deliberately - widening it to include Urban Councils/Pradeshiya Sabhas later is a one-line migration, not a redesign (see [`04-scope-and-boundaries.md`](04-scope-and-boundaries.md)).

## `profiles`

Extends `auth.users` with an app-level role, scope, NIC, and contact details. Four roles, three of which carry a scope column that every query must be filtered by server-side (see [`05-architecture.md`](05-architecture.md)).

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  nic text unique,                       -- citizens only; null for officer/admin accounts
  contact_email text,
  contact_phone text,                    -- collected for future SMS OTP (Phase 2); unused for delivery in v1
  role text not null default 'citizen'
    check (role in ('citizen', 'municipal_officer', 'provincial_officer', 'system_admin')),
  council_id uuid references councils,   -- required if role = 'municipal_officer', null otherwise
  province_id uuid references provinces, -- required if role = 'provincial_officer', null otherwise
  created_at timestamp with time zone default timezone('utc', now()) not null,
  constraint role_scope_matches check (
    (role = 'municipal_officer' and council_id is not null and province_id is null) or
    (role = 'provincial_officer' and province_id is not null and council_id is null) or
    (role in ('citizen', 'system_admin') and council_id is null and province_id is null)
  )
);

alter table profiles enable row level security;

create policy "users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created - a citizen
-- auto-provisioned by the backend on first report, or an officer/admin
-- account created by the provisioning chain described in
-- 03-governance-and-roles.md. Metadata is passed by whichever backend call
-- created the auth.users row.
create function public.handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**No `points` column.** The hackathon version's gamification counter is removed entirely - see [`03-governance-and-roles.md`](03-governance-and-roles.md#public-transparency-replaces-citizen-contribution-points) for what replaces it (a computed, not stored, public stats view).

**No password for citizens, ever.** Citizen `auth.users` rows are created via `supabaseAdmin.auth.admin.createUser` with no password set and email confirmation bypassed at creation - access is exclusively via the OTP flow in [`05-architecture.md`](05-architecture.md), which mints a session directly rather than checking a credential.

### Officer provisioning chain (matches `03-governance-and-roles.md`)

- **System Administrator** accounts: seeded once, manually, at deployment - same "no UI, one SQL statement during setup" pattern as the original hackathon admin account, but now explicitly the *top* of the chain rather than the only account type.
- **Provincial Officer** accounts: created by a System Administrator (`POST /api/admin/provincial-officers` - see [`07-api-specification.md`](07-api-specification.md)), one per province.
- **Municipal Officer** accounts: created by that council's Provincial Officer (`POST /api/provincial/municipal-officers`), one per council in their own `province_id` only - enforced server-side and by RLS.

### NIC & contact validation rules

Sri Lankan NIC formats, unchanged from the original design:

```
^([0-9]{9}[VvXx]|[0-9]{12})$
```

Friendly error: *"Please enter a valid NIC number - either 9 digits followed by V/X, or 12 digits."*

**Scope note, unchanged:** NIC *format* and *uniqueness in our own database* only - no DRP registry verification exists as a public API. See [`03-governance-and-roles.md`](03-governance-and-roles.md#citizen-identity-what-stays-frictionless-and-what-changed) for why this is an accepted, stated trade-off rather than a blocker.

## `civic_issues`

```sql
create table civic_issues (
  id uuid default gen_random_uuid() primary key,
  citizen_id uuid references auth.users not null,
  council_id uuid references councils not null,
  category text not null check (category in ('Garbage', 'Road', 'Water', 'Lighting', 'Drainage', 'Sewerage', 'Public Safety', 'Other')),
  ward text not null,
  landmark text not null,
  description text not null check (char_length(description) >= 20),
  photo_url text,
  latitude numeric,
  longitude numeric,
  status text not null default 'Submitted'
    check (status in ('Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Verified', 'Reopened')),
  ai_priority text check (ai_priority in ('Low', 'Medium', 'High', 'Critical')),
  ai_jurisdiction text not null default 'in_council' check (ai_jurisdiction in ('in_council', 'redirect')),
  ai_redirect_authority text check (ai_redirect_authority in ('NWSDB', 'RDA', 'PRDA', 'CEB', 'Police', 'Other', null)), -- PRDA: Provincial Road Development Authority, for C/D-class roads
  ai_department text,
  ai_reason text,
  sla_ack_due_at timestamp with time zone not null,
  sla_resolve_due_at timestamp with time zone not null,
  escalated boolean not null default false,
  escalated_at timestamp with time zone,
  reopened_count integer not null default 0,
  assigned_to uuid references profiles,   -- reserved for Phase 2 department/assignee sub-roles; unused in v1
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);
```

`sla_ack_due_at`/`sla_resolve_due_at` are computed by the backend at insert time from `ai_priority`, using the fixed target table in [`03-governance-and-roles.md`](03-governance-and-roles.md#sla-targets-and-escalation) - not recomputed later, so a priority correction doesn't retroactively change a deadline that's already been communicated.

## `issue_status_history`

```sql
create table issue_status_history (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references civic_issues on delete cascade not null,
  from_status text,                 -- null for the initial 'Submitted' row
  to_status text not null,
  changed_by uuid references profiles,  -- null for system-generated transitions (e.g. auto-verify)
  note text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);
```

The audit trail the hackathon version had no room for - every status change, who made it, and an optional note (e.g. why an issue was reopened).

## Citizen OTP: no `otp_codes` table, Supabase Auth handles it natively

The original sketch of this document called for a hand-rolled `otp_codes` table (hash the code, track expiry and attempt count ourselves). On implementation this was replaced with **Supabase Auth's own passwordless email OTP** (`supabasePublic.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })` to send a 6-digit code, `supabasePublic.auth.verifyOtp({ email, token, type: 'email' })` to exchange it for a session, see `services/otpService.js`). Supabase already generates, stores, rate-limits, and expires the code, and already sends the email, so there is no new table, no new vendor, and no custom hashing/rate-limiting code to get wrong. This is a deliberate, documented deviation from the original sketch, not an oversight, see `PLAN.md`'s "Key implementation decision: OTP delivery" note from the build session.

Practical implication: a citizen's `contact_email` is also their `auth.users.email`, OTP can only be sent to a real Supabase Auth identity's email, so `contact_email` is required at report-submission time, not optional.

## Row Level Security

```sql
alter table civic_issues enable row level security;
alter table issue_status_history enable row level security;
alter table councils enable row level security;
alter table provinces enable row level security;

-- Citizens can see their own issues
create policy "citizens_select_own"
  on civic_issues for select
  using (auth.uid() = citizen_id);

-- Municipal Officers see only their own council's issues
create policy "municipal_officers_select_own_council"
  on civic_issues for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'municipal_officer'
        and profiles.council_id = civic_issues.council_id
    )
  );

create policy "municipal_officers_update_own_council"
  on civic_issues for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'municipal_officer'
        and profiles.council_id = civic_issues.council_id
    )
  );

-- Provincial Officers see every issue for every council in their province (read-only)
create policy "provincial_officers_select_own_province"
  on civic_issues for select
  using (
    exists (
      select 1 from profiles p
      join councils c on c.id = civic_issues.council_id
      where p.id = auth.uid()
        and p.role = 'provincial_officer'
        and p.province_id = c.province_id
    )
  );

-- Everyone (including anonymous, via the anon key) can read councils/provinces - -- needed for the report form's council picker and the public transparency pages
create policy "councils_public_read" on councils for select using (true);
create policy "provinces_public_read" on provinces for select using (true);
```

> As before: the backend performs writes with the **service role key**, so RLS is bypassed for those requests by design - RLS here is the database-level backstop for any *direct* frontend reads with the anon key (including the session a citizen gets from the OTP flow, and every officer's authenticated session). The backend still enforces `council_id`/`province_id` scoping in application code on every query, so a bug in one layer doesn't remove the other.

## Public SLA-transparency stats

Not a stored table - computed on read (a view, or a query in `services/statsService.js`) from `civic_issues` + `issue_status_history`, grouped by `council_id` and `category`:

```sql
create view council_sla_stats as
select
  council_id,
  category,
  count(*) filter (where status in ('Resolved', 'Verified')) as resolved_count,
  count(*) filter (where status in ('Resolved', 'Verified') and updated_at <= sla_resolve_due_at) as resolved_within_sla,
  avg(extract(epoch from (updated_at - created_at))) filter (where status in ('Resolved', 'Verified')) as avg_resolution_seconds,
  count(*) filter (where status not in ('Resolved', 'Verified')) as open_count
from civic_issues
where ai_jurisdiction = 'in_council'   -- redirected issues don't count against a council's SLA
group by council_id, category;
```

Excluding `ai_jurisdiction = 'redirect'` rows is the direct implementation of the rule in [`03-governance-and-roles.md`](03-governance-and-roles.md#category--responsible-authority-jurisdiction): a council shouldn't be held accountable for NWSDB's pipe.

## Sample seed data

See [`backend/database/seed.sql`](../../backend/database/seed.sql) - seeded with a working subset of **real, named** provinces and councils (not all 9/29, but enough to demonstrate the hierarchy genuinely functions), sample citizens, issues across every status in the pipeline (including at least one `Reopened` and one `escalated = true`, so the Provincial Officer view isn't empty), and one Provincial Officer + Municipal Officer per seeded council.

## Cloudflare R2 setup

Unchanged from the original design - see [`backend/database/migrations/`](../../backend/database/migrations/) setup notes. Bucket, public read access, API token scoped to the bucket.
