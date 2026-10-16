-- 007_rls_council_province_scoping.sql
-- Resolve LK - governance redesign, part 3: replace the flat
-- admins_select_all/admins_update_all policies with council- and
-- province-scoped access for Municipal Officers and Provincial Officers.
-- Requires 005 and 006 to have already run.
-- See docs/srs/06-data-model.md#row-level-security.

alter table civic_issues drop policy if exists "admins_select_all";
alter table civic_issues drop policy if exists "admins_update_all";

-- Municipal Officers see and update only their own council's issues.
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

-- Provincial Officers see (read-only) every issue for every council in
-- their own province - they cannot directly change an issue's status
-- (accountability for the fix stays with the owning council); see
-- docs/srs/03-governance-and-roles.md.
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

-- Citizens may transition their own Resolved issue to Verified or Reopened
-- (confirm/dispute - see docs/srs/03-governance-and-roles.md#status-pipeline).
-- The existing "citizens_select_own" policy already covers reads; citizens
-- need an update policy too now that the pipeline gives them a write action.
-- Application code (services/issueService.js) still enforces which specific
-- transitions are valid - this is the RLS backstop, not the only check.
create policy "citizens_update_own_resolved"
  on civic_issues for update
  using (auth.uid() = citizen_id);
