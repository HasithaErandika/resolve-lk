-- 004_add_gps_coordinates.sql
-- Resolve LK — optional GPS tag on a report (captured via the browser's
-- Geolocation API on the report form, not a Maps/geocoding integration).
-- Requires 001_init_schema.sql to have already been run.

alter table civic_issues
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table civic_issues drop constraint if exists civic_issues_latitude_range;
alter table civic_issues add constraint civic_issues_latitude_range
  check (latitude is null or latitude between -90 and 90);

alter table civic_issues drop constraint if exists civic_issues_longitude_range;
alter table civic_issues add constraint civic_issues_longitude_range
  check (longitude is null or longitude between -180 and 180);
