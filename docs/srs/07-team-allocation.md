# 07 — Team Allocation

4 registered members, 4 clear ownership areas, no overlap. Every member still touches real code — this is a division of primary ownership, not a wall between people. Helping across boundaries during Build/Polish is expected and good for the "contribution from all members" rubric line, as long as your primary area is solid first.

| Area | Owner | Maps to assignment's "typical focus" |
|---|---|---|
| Citizen Experience (landing page, public feed, report form) — **not a dashboard** | Seneja Thehansi | Problem & solution design + UI development |
| Admin Dashboard | Jayashan Guruge | UI development |
| Supabase & Storage Architect | Bhanuka Samarasinghe | Functional implementation (data layer) |
| Backend & AI Integration | Hasitha Erandika | Functional implementation + testing/deployment |

## Seneja Thehansi — Citizen Experience

Citizens never see a dashboard or a login screen. This is a public site with one form on it.

- Scaffold the Vite + React + Tailwind app *(done — see `frontend/`)*.
- Build the landing page, including the in-app explanation of the Sri Lankan problem (assignment requirement #2).
- Build the public issue feed section (no login) — pulls from `GET /api/issues/public`.
- Build the report form — **this is the only form citizens ever see**, and it doubles as signup: NIC (format-validated) + email + category + ward/zone + landmark + description + optional photo. See [`02-solution-overview.md`](02-solution-overview.md) for why there's no separate signup step.
- Implement client-side validation with friendly, specific error messages (assignment requirement #5) — NIC format, email format, description length.
- Build the lightweight "My Reports" page: one NIC input, calls `POST /api/my-reports/login`, then adopts the returned session with `supabase.auth.setSession()` and lists the citizen's own reports + contribution points.
- Wire the form to `POST /api/issues` (already implemented by Hasitha — see `backend/src/routes/issues.js`).
- Deploy the frontend to Cloudflare Pages during the Ship phase.

## Jayashan Guruge — Admin Dashboard

The one dashboard in this app, and it's admin-only, with a real login.

- Build the admin login (Supabase Auth email/password — real admin accounts, seeded manually by Bhanuka).
- Build the municipal admin dashboard: table or Kanban view of all issues (`GET /api/issues`, authenticated).
- Implement search (by keyword) and filter (by category, by status).
- Implement the status-update control (`Pending → In Progress → Resolved`), wired to `PATCH /api/issues/:id/status`.
- Surface the AI priority/department/reason clearly — visually flag `Critical` issues.
- During Ship, run the full end-to-end test on the live deployed URL (both the public citizen flow and the admin flow) and report bugs immediately.

## Bhanuka Samarasinghe — Supabase & Storage Architect

- Create the Supabase project.
- Run `backend/database/schema.sql`: `profiles` (with the unique `nic` column and `points` counter), `civic_issues`, the new-user trigger, and all RLS policies.
- Configure Supabase Auth (email/password) and confirm `full_name`/`nic` metadata flows into `profiles` via the trigger — including when accounts are auto-created server-side (not just self-signup).
- Seed the one admin test account (manual role flip in SQL editor — see the schema file).
- Create and configure the Cloudflare R2 bucket (public read access, API token), and hand credentials to Hasitha.
- Run `backend/database/seed.sql` before the demo so the feed isn't empty.
- During Polish, verify RLS actually restricts citizens to their own rows and allows admins to see everything — test both roles.

## Hasitha Erandika — Backend & AI Integration

**Status: scaffolded and largely implemented** — `backend/src` already has the Express app, all routes, middleware, and lib code described below; remaining work is mostly plugging in real Supabase/R2/Gemini credentials and testing end to end once Bhanuka's Supabase project and R2 bucket exist.

- Initialize the GitHub repository and the Express project skeleton *(done)*.
- Implement `POST /api/issues` (public — validates NIC + email, auto-provisions or reuses a citizen account, uploads the photo, triages with Gemini, inserts the row, awards points) *(done, see `backend/src/routes/issues.js`)*.
- Implement `GET /api/issues/public` (anonymous feed for the landing page) *(done)*.
- Implement `GET /api/issues`, `GET /api/issues/:id`, `PATCH /api/issues/:id/status` (authenticated; the status route also awards a points bonus on `Resolved`) *(done)*.
- Implement `POST /api/my-reports/login` (NIC-only sign-in for the citizen's own report history) *(done, see `backend/src/routes/myReports.js`)*.
- Implement the R2 upload (via `@aws-sdk/client-s3`) *(done, see `backend/src/lib/r2.js`)*.
- Integrate the **Gemini API** for auto-triage *(done, see `backend/src/lib/gemini.js`)*.
- Implement the `requireAuth` / `requireAdmin` middleware *(done)*.
- Remaining: plug in real `.env` values once Supabase/R2/Gemini are connected, smoke-test every route against the live Supabase project, deploy to Choreo (fallback: Render) during the Ship phase.

## Contribution evidence (for the rubric's 5-mark "Contribution from all registered members" line)

- Every member commits to the repo under their own GitHub account — no single "here's everyone's code" dump commit.
- The README's contribution table (filled in at the end) states each person's actual work.
- The demo is presented jointly — each member should be ready to explain and, if asked, live-modify the part they built.
