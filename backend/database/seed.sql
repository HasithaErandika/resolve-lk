-- Resolve LK - reference data seed: provinces + councils.
-- Pure SQL, no auth dependency - safe to run directly in the Supabase SQL
-- editor after migrations 001-008. Run BEFORE seed.mjs (which looks these
-- rows up by name to attach officer accounts and sample issues to them).
--
-- This is a working demonstration subset, not the full real count (9
-- provinces / 29 Municipal Councils) - see docs/srs/04-scope-and-boundaries.md
-- for why v1 seeds a subset rather than all of them.

insert into provinces (name) values
  ('Western Province'),
  ('Central Province'),
  ('Southern Province')
on conflict (name) do nothing;

-- Coordinates are each council's approximate administrative-centre point - -- used only for the Haversine "nearest council" suggestion, not a real
-- jurisdiction boundary. See docs/srs/03-governance-and-roles.md
-- #location-based-council-suggestion-haversine.
insert into councils (province_id, name, district, operates_own_water_scheme, latitude, longitude)
select p.id, c.name, c.district, c.operates_own_water_scheme, c.latitude, c.longitude
from (values
  ('Western Province', 'Colombo Municipal Council', 'Colombo', false, 6.9271, 79.8612),
  ('Western Province', 'Sri Jayawardenepura Kotte Municipal Council', 'Colombo', false, 6.8905, 79.9185),
  ('Western Province', 'Dehiwala-Mount Lavinia Municipal Council', 'Colombo', false, 6.8484, 79.8653),
  ('Central Province', 'Kandy Municipal Council', 'Kandy', false, 7.2906, 80.6337),
  ('Southern Province', 'Galle Municipal Council', 'Galle', false, 6.0535, 80.2210)
) as c(province_name, name, district, operates_own_water_scheme, latitude, longitude)
join provinces p on p.name = c.province_name
on conflict (province_id, name) do nothing;
