-- 006_issue_workflow_and_jurisdiction.sql
-- Resolve LK - governance redesign, part 2: council scoping, jurisdiction-
-- aware AI triage fields, SLA due-dates, the full status pipeline, and the
-- issue_status_history audit trail. Requires 005 to have already run.
-- See docs/srs/03-governance-and-roles.md for the SLA/jurisdiction tables
-- and docs/srs/06-data-model.md for the full schema writeup.

-- Clean rebuild: only seed/test issues exist so far, and none of them carry
-- the council_id/jurisdiction/SLA data this migration requires. Rather than
-- inventing values to backfill, clear the table - re-seed with
-- database/seed.mjs afterwards.
truncate table civic_issues cascade;

-- =========================================================
-- civic_issues - council scoping
-- =========================================================

alter table civic_issues add column if not exists council_id uuid references councils;
alter table civic_issues alter column council_id set not null;

-- =========================================================
-- civic_issues - status pipeline
-- Submitted -> Acknowledged -> In Progress -> Resolved -> Verified
--                                    ^                        |
--                                    +------ Reopened <--------+
-- =========================================================

alter table civic_issues alter column status set default 'Submitted';
alter table civic_issues drop constraint if exists civic_issues_status_check;
alter table civic_issues add constraint civic_issues_status_check
  check (status in ('Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Verified', 'Reopened'));

-- =========================================================
-- civic_issues - AI triage: priority + jurisdiction
-- =========================================================

alter table civic_issues drop constraint if exists civic_issues_ai_priority_check;
alter table civic_issues add constraint civic_issues_ai_priority_check
  check (ai_priority in ('Low', 'Medium', 'High', 'Critical'));

alter table civic_issues add column if not exists ai_jurisdiction text not null default 'in_council'
  check (ai_jurisdiction in ('in_council', 'redirect'));
alter table civic_issues add column if not exists ai_redirect_authority text
  check (ai_redirect_authority in ('NWSDB', 'RDA', 'PRDA', 'CEB', 'Police', 'Other'));

-- =========================================================
-- civic_issues - SLA targets + escalation
-- Due-dates are computed once, at submission, from the fixed priority ->
-- target-hours table in docs/srs/03-governance-and-roles.md - never
-- recomputed later. See services/slaService.js.
-- =========================================================

alter table civic_issues add column if not exists sla_ack_due_at timestamp with time zone;
alter table civic_issues add column if not exists sla_resolve_due_at timestamp with time zone;
alter table civic_issues alter column sla_ack_due_at set not null;
alter table civic_issues alter column sla_resolve_due_at set not null;

alter table civic_issues add column if not exists escalated boolean not null default false;
alter table civic_issues add column if not exists escalated_at timestamp with time zone;
alter table civic_issues add column if not exists reopened_count integer not null default 0;

-- Reserved for a Phase 2 department/assignee sub-role within a council - -- unused in v1, see docs/srs/04-scope-and-boundaries.md.
alter table civic_issues add column if not exists assigned_to uuid references profiles;

-- =========================================================
-- issue_status_history - full audit trail of every status transition
-- =========================================================

create table if not exists issue_status_history (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references civic_issues on delete cascade not null,
  from_status text,
  to_status text not null,
  changed_by uuid references profiles,
  note text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

create index if not exists issue_status_history_issue_id_idx on issue_status_history (issue_id);

alter table issue_status_history enable row level security;

-- Citizens can see the history of their own issues.
create policy "citizens_select_own_issue_history"
  on issue_status_history for select
  using (
    exists (
      select 1 from civic_issues
      where civic_issues.id = issue_status_history.issue_id
        and civic_issues.citizen_id = auth.uid()
    )
  );

-- Municipal Officers can see history for their own council's issues.
create policy "municipal_officers_select_own_council_history"
  on issue_status_history for select
  using (
    exists (
      select 1 from civic_issues
      join profiles on profiles.id = auth.uid()
      where civic_issues.id = issue_status_history.issue_id
        and profiles.role = 'municipal_officer'
        and profiles.council_id = civic_issues.council_id
    )
  );

-- Provincial Officers can see history for every council in their province.
create policy "provincial_officers_select_own_province_history"
  on issue_status_history for select
  using (
    exists (
      select 1 from civic_issues
      join councils on councils.id = civic_issues.council_id
      join profiles on profiles.id = auth.uid()
      where civic_issues.id = issue_status_history.issue_id
        and profiles.role = 'provincial_officer'
        and profiles.province_id = councils.province_id
    )
  );

-- =========================================================
-- council_sla_stats - the public transparency view that replaces the old
-- citizen contribution-points system. Excludes redirected (out-of-
-- jurisdiction) issues, since a council shouldn't be scored on NWSDB's pipe.
-- =========================================================

create or replace view council_sla_stats as
select
  council_id,
  category,
  count(*) filter (where status in ('Resolved', 'Verified')) as resolved_count,
  count(*) filter (where status in ('Resolved', 'Verified') and updated_at <= sla_resolve_due_at) as resolved_within_sla,
  avg(extract(epoch from (updated_at - created_at)))
    filter (where status in ('Resolved', 'Verified')) as avg_resolution_seconds,
  count(*) filter (where status not in ('Resolved', 'Verified')) as open_count
from civic_issues
where ai_jurisdiction = 'in_council'
group by council_id, category;
