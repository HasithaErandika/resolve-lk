# Database Migrations

Run these in the Supabase SQL editor (Project → SQL Editor → New query), **in numeric order**, each as its own run. They are not idempotent against partial state — if one fails partway through, fix the error and re-run that same file rather than skipping ahead.

| # | File | What it does |
|---|---|---|
| 001 | [`001_init_schema.sql`](001_init_schema.sql) | Creates `profiles` and `civic_issues`, the new-user trigger, the `updated_at` trigger, and all RLS policies. |
| 002 | [`002_points_rpc_and_search_indexes.sql`](002_points_rpc_and_search_indexes.sql) | Adds the `increment_points` atomic-update function the backend calls for contribution points, plus the `created_at` sort index and trigram search indexes on `description`/`landmark`. |
| 003 | [`003_expand_categories.sql`](003_expand_categories.sql) | Widens the `civic_issues.category` check constraint from 4 values to 8 (adds Drainage, Sewerage, Public Safety, Other). Must be run before the app tries to submit a report in one of the new categories. |

After 001 and 002, seed sample data with [`../seed.sql`](../seed.sql) so the feed/dashboard aren't empty for the demo.

## Adding a new migration

Name it `NNN_short_description.sql`, one more than the current highest number, and add a row to the table above. Keep each migration additive (`create ... if not exists`, `create or replace function`, `alter table ... add column if not exists`) so it's safe to run against a database that already has an earlier migration applied — don't edit a migration that's already been run against the shared Supabase project; add a new one instead.
