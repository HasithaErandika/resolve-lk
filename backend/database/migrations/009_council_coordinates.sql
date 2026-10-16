-- 009_council_coordinates.sql
-- Resolve LK - adds a single reference lat/lon per council, used for the
-- Haversine-based "nearest council" suggestion on the report form.
-- Requires 005 (councils table) to have already run.
-- See docs/srs/03-governance-and-roles.md#location-based-council-suggestion-haversine
-- for what this is (a suggestion) and isn't (a real jurisdiction-boundary
-- polygon) - see services/councilService.js#findNearestCouncil.

alter table councils add column if not exists latitude double precision;
alter table councils add column if not exists longitude double precision;

alter table councils drop constraint if exists councils_latitude_range;
alter table councils add constraint councils_latitude_range
  check (latitude is null or latitude between -90 and 90);

alter table councils drop constraint if exists councils_longitude_range;
alter table councils add constraint councils_longitude_range
  check (longitude is null or longitude between -180 and 180);
