-- 002_points_rpc_and_search_indexes.sql
-- Resolve LK — contribution-points atomic increment + search/sort indexes.
-- Requires 001_init_schema.sql to have already been run.

-- =========================================================
-- Sort + search indexes
-- =========================================================

-- Every listing query orders by created_at desc (see services/issueService.js).
create index if not exists civic_issues_created_at_idx on civic_issues (created_at desc);

-- Trigram index so the ilike '%term%' search in GET /api/issues(/public)
-- can use an index scan instead of a full table scan as the table grows.
create extension if not exists pg_trgm;
create index if not exists civic_issues_description_trgm_idx
  on civic_issues using gin (description gin_trgm_ops);
create index if not exists civic_issues_landmark_trgm_idx
  on civic_issues using gin (landmark gin_trgm_ops);

-- =========================================================
-- Contribution points — atomic increment
-- Called via supabase.rpc('increment_points', {...}) instead of a
-- read-then-write from the backend, so two reports (or a report landing at
-- the same moment as a Resolved bonus) can never race and drop an update.
-- =========================================================

create or replace function public.increment_points(p_citizen_id uuid, p_amount integer)
returns integer as $$
declare
  new_total integer;
begin
  update profiles
  set points = points + p_amount
  where id = p_citizen_id
  returning points into new_total;

  return new_total;
end;
$$ language plpgsql security definer;
