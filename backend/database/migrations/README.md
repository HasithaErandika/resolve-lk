# Database Migrations

Run these in the Supabase SQL editor (Project → SQL Editor → New query), **in numeric order**, each as its own run. They are not idempotent against partial state - if one fails partway through, fix the error and re-run that same file rather than skipping ahead.

| # | File | What it does |
|---|---|---|
| 001 | [`001_init_schema.sql`](001_init_schema.sql) | Creates `profiles` and `civic_issues`, the new-user trigger, the `updated_at` trigger, and all RLS policies. **Superseded by 005-008 below** - kept as historical record of the original hackathon-scoped schema. |
| 002 | [`002_points_rpc_and_search_indexes.sql`](002_points_rpc_and_search_indexes.sql) | Adds `increment_points` plus search/sort indexes. **The `increment_points` function is dropped again in 008** - the indexes it also creates are still needed and stay. |
| 003 | [`003_expand_categories.sql`](003_expand_categories.sql) | Widens `civic_issues.category` from 4 values to 8. Still current - categories didn't change in the governance redesign. |
| 004 | [`004_add_gps_coordinates.sql`](004_add_gps_coordinates.sql) | Adds optional `latitude`/`longitude` columns. Still current. |
| 005 | [`005_governance_and_roles.sql`](005_governance_and_roles.sql) | **Governance redesign, part 1.** Creates `provinces` and `councils`; extends `profiles` with `contact_email`, `contact_phone`, `council_id`, `province_id`; widens `role` to `citizen`/`municipal_officer`/`provincial_officer`/`system_admin` with a `role_scope_matches` constraint. See [`docs/srs/03-governance-and-roles.md`](../../docs/srs/03-governance-and-roles.md). |
| 006 | [`006_issue_workflow_and_jurisdiction.sql`](006_issue_workflow_and_jurisdiction.sql) | **Governance redesign, part 2.** `TRUNCATE`s `civic_issues` (no data worth backfilling - re-seed after), adds `council_id`, widens `status` to the full 6-state pipeline, adds jurisdiction fields (`ai_jurisdiction`, `ai_redirect_authority`), SLA fields (`sla_ack_due_at`, `sla_resolve_due_at`, `escalated`, `escalated_at`, `reopened_count`), creates `issue_status_history` and the `council_sla_stats` view. |
| 007 | [`007_rls_council_province_scoping.sql`](007_rls_council_province_scoping.sql) | **Governance redesign, part 3.** Drops the old flat admin RLS policies; adds council-scoped Municipal Officer policies and province-scoped (read-only) Provincial Officer policies. |
| 008 | [`008_drop_points.sql`](008_drop_points.sql) | **Governance redesign, part 4.** Drops `increment_points` and `profiles.points` - replaced by the public `council_sla_stats` view from 006. |
| 009 | [`009_council_coordinates.sql`](009_council_coordinates.sql) | Adds an optional `latitude`/`longitude` reference point per council, used by `services/councilService.js#findNearestCouncil` (Haversine) to suggest - never enforce - the right council on the report form. |

**Running against a fresh Supabase project:** run 001 → 009 in order, then seed with [`../seed.sql`](../seed.sql) (provinces/councils reference data, no auth dependency) followed by [`../seed.mjs`](../seed.mjs) (creates officer/citizen accounts and sample issues via the Supabase Admin API - this needs real auth users, which can't be hand-inserted via the SQL editor). See the header of each file for details.

**Running against the project the original hackathon build used:** 001-004 are already applied; run 005 → 009 next. 006's `TRUNCATE` clears the old-shape sample issues - re-seed afterwards.

## Adding a new migration

Name it `NNN_short_description.sql`, one more than the current highest number, and add a row to the table above. Prefer additive changes (`create ... if not exists`, `create or replace function`, `alter table ... add column if not exists`) so a migration is safe to run against a database that already has earlier ones applied - don't edit a migration that's already been run against a shared Supabase project; add a new one instead. A destructive step (like 006's `TRUNCATE`) is sometimes the right call, but call it out explicitly in a comment, the way 006 does.
