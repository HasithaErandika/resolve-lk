-- 003_expand_categories.sql
-- Resolve LK — expands civic_issues.category beyond the original 4 values.
-- Requires 001_init_schema.sql to have already been run.

alter table civic_issues drop constraint if exists civic_issues_category_check;

alter table civic_issues add constraint civic_issues_category_check
  check (category in (
    'Garbage',
    'Road',
    'Water',
    'Lighting',
    'Drainage',
    'Sewerage',
    'Public Safety',
    'Other'
  ));
