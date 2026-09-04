# 07 — Team Allocation

4 registered members, 4 clear ownership areas, no overlap. Every member still touches real code — this is a division of primary ownership, not a wall between people. Helping across boundaries during Build/Polish is expected and good for the "contribution from all members" rubric line, as long as your primary area is solid first.

| Area | Owner | Maps to assignment's "typical focus" |
|---|---|---|
| Citizen Frontend | Member 1 | Problem & solution design + UI development |
| Admin Frontend | Member 2 | UI development |
| Supabase & Storage Architect | Member 3 | Functional implementation (data layer) |
| Backend & AI Integration | Member 4 | Functional implementation + testing/deployment |

## Member 1 — Citizen Frontend

- Scaffold the Vite + React + Tailwind app.
- Build the landing page, including the in-app explanation of the Sri Lankan problem (assignment requirement #2).
- Build the citizen signup/login form, including the **NIC number field** (format-validated, see [`05-data-model.md`](05-data-model.md)) passed as Supabase Auth signup metadata.
- Build the citizen issue-submission form: category, ward/zone dropdown, landmark, description, photo upload.
- Implement client-side validation with friendly, specific error messages (assignment requirement #5) — including NIC format and duplicate-NIC errors.
- Wire the form to `POST /api/issues` once Member 4's endpoint is ready.
- Deploy the frontend to Cloudflare Pages during the Ship phase.

## Member 2 — Admin Frontend

- Build the municipal admin dashboard: table or Kanban view of all issues.
- Implement search (by keyword) and filter (by category, by status).
- Implement the status-update control (`Pending → In Progress → Resolved`), wired to `PATCH /api/issues/:id/status`.
- Surface the AI priority/department/reason clearly — visually flag `Critical` issues.
- During Ship, run the full end-to-end test on the live deployed URL (both roles) and report bugs immediately.

## Member 3 — Supabase & Storage Architect

- Create the Supabase project.
- Run the schema from [`05-data-model.md`](05-data-model.md): `profiles` (including the unique `nic` column), `civic_issues`, the new-user trigger, and all RLS policies.
- Configure Supabase Auth (email/password), confirming `full_name`/`nic` signup metadata flows into `profiles` via the trigger.
- Seed the one admin test account (manual role flip in SQL editor).
- Create and configure the Cloudflare R2 bucket (public read access, API token), and hand credentials to Member 4.
- Insert sample seed data before the demo.
- During Polish, verify RLS actually restricts citizens to their own rows and allows admins to see everything — test both roles.

## Member 4 — Backend & AI Integration

- Initialize the GitHub repository and the Express project skeleton.
- Implement `POST /api/issues`, `GET /api/issues`, `GET /api/issues/:id`, `PATCH /api/issues/:id/status` per [`06-api-specification.md`](06-api-specification.md).
- Implement the R2 upload (via `@aws-sdk/client-s3`).
- Integrate the Claude API for auto-triage.
- Implement the `requireAuth` / `requireAdmin` middleware.
- Deploy the backend to Choreo (fallback: Render) during the Ship phase.

## Contribution evidence (for the rubric's 5-mark "Contribution from all registered members" line)

- Every member commits to the repo under their own GitHub account — no single "here's everyone's code" dump commit.
- The README's contribution table (filled in at the end) states each person's actual work.
- The demo is presented jointly — each member should be ready to explain and, if asked, live-modify the part they built.
