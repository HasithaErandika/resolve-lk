-- 008_drop_points.sql
-- Resolve LK - governance redesign, part 4: remove the citizen
-- contribution-points system entirely. Replaced by the public
-- council_sla_stats view (see 006_issue_workflow_and_jurisdiction.sql) - -- accountability is the council's, made visible, not the citizen's,
-- gamified. See docs/srs/03-governance-and-roles.md#public-transparency-replaces-citizen-contribution-points.
-- Requires 001-007 to have already run.

drop function if exists public.increment_points(uuid, integer);

alter table profiles drop column if exists points;
