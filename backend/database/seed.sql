-- Resolve LK — sample seed data
-- Run after schema.sql, once at least one citizen account exists
-- (sign up through the app, or Supabase dashboard → Authentication → Add user).
-- Replace '<citizen uuid>' with a real auth.users id from that account.

insert into civic_issues (citizen_id, category, ward, landmark, description, status, ai_priority, ai_department, ai_reason)
values
  ('<citizen uuid>', 'Garbage', 'Colombo 06', 'Near Wellawatte market', 'Large uncollected garbage pile attracting stray dogs and mosquitoes for over a week.', 'Pending', 'Critical', 'Public Health', 'Standing waste near a market poses a dengue and sanitation risk.'),
  ('<citizen uuid>', 'Road', 'Nugegoda', 'Opposite the bus stand', 'Deep pothole causing two-wheeler accidents during evening traffic.', 'In Progress', 'Medium', 'Roads & Infrastructure', 'Accident risk but not an immediate public health hazard.'),
  ('<citizen uuid>', 'Lighting', 'Maharagama', 'Access road to the housing scheme', 'Streetlight has been off for three weeks, area is unsafe at night.', 'Pending', 'Medium', 'Electrical Maintenance', 'Safety concern, not urgent health risk.'),
  ('<citizen uuid>', 'Water', 'Dehiwala', 'Near the railway crossing', 'Burst pipe flooding the road since yesterday morning.', 'Resolved', 'Critical', 'Water Supply', 'Active water loss and road hazard required immediate response.');
