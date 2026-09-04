# PROGRESS.md — Live Task Tracker

Update this as you go during the session — it's what "contribution from all registered members" gets judged against, alongside commit history. Status values: **Not Started**, **In Progress**, **Done**.

Reminder: admins never self-register. Admin accounts are created manually in the Supabase dashboard and promoted with one SQL statement — see [`docs/srs/05-data-model.md`](docs/srs/05-data-model.md). There is no admin signup form to build.

## Seneja Thehansi — Citizen Experience

| Task | Status | Notes |
|---|---|---|
| Scaffold Vite + React + Tailwind app | Done | `frontend/` — Vite, Tailwind v4, ESLint all wired up |
| Landing page + problem explainer | In Progress | Static placeholder in `App.jsx`; needs real problem copy from `docs/srs/01-problem-statement.md` |
| Public issue feed section | In Progress | Static sample cards in place; needs wiring to `GET /api/issues/public` |
| Report form (NIC + email + issue fields) | In Progress | Form UI built, fields disabled; needs wiring to `POST /api/issues` + client-side validation |
| "My Reports" page (NIC-only login) | Not Started | Calls `POST /api/my-reports/login`, then `supabase.auth.setSession()` |
| Responsive check (mobile widths) | Not Started | |
| Deploy frontend to Cloudflare Pages | Not Started | |

## Jayashan Guruge — Admin Dashboard

| Task | Status | Notes |
|---|---|---|
| Admin login (Supabase Auth, real email/password) | Not Started | No self-registration — admin accounts are seeded manually by Bhanuka |
| Dashboard table/board of all issues | Not Started | `GET /api/issues` (authenticated, admin sees all) |
| Search + category/status filter | Not Started | |
| Status update control (`Pending → In Progress → Resolved`) | Not Started | `PATCH /api/issues/:id/status` |
| Surface AI priority/department/reason, flag Critical | Not Started | |
| End-to-end test on live deployed URL | Not Started | Ship phase |

## Bhanuka Samarasinghe — Supabase & Storage Architect

| Task | Status | Notes |
|---|---|---|
| Create Supabase project | Not Started | |
| Run `backend/database/schema.sql` | Not Started | `profiles` (nic, points, role), `civic_issues`, trigger, RLS |
| Configure Supabase Auth | Not Started | Email/password; confirm metadata → `profiles` trigger works for both self-provisioned citizens and manually created admins |
| Seed the one admin test account | Not Started | Create user in Supabase dashboard manually, then `update profiles set role = 'admin' ...` — no self-registration |
| Create & configure Cloudflare R2 bucket | Done | Bucket `resolve-lk` created, public r2.dev access enabled, credentials handed to Hasitha and verified with a live test upload |
| Run `backend/database/seed.sql` | Not Started | So the feed/dashboard aren't empty for the demo |
| Verify RLS with both roles | Not Started | Polish phase |

## Hasitha Erandika — Backend & AI Integration

| Task | Status | Notes |
|---|---|---|
| Express project skeleton | Done | `backend/src/index.js` + folder structure |
| `POST /api/issues` (public, find-or-create by NIC, upload, triage, insert, award points) | Done | `backend/src/routes/issues.js` |
| `GET /api/issues/public` (anonymous feed) | Done | |
| `GET /api/issues`, `GET /api/issues/:id`, `PATCH /api/issues/:id/status` | Done | Points bonus on Resolved implemented |
| `POST /api/my-reports/login` (NIC-only sign-in) | Done | `backend/src/routes/myReports.js` |
| R2 upload integration | Done | `backend/src/lib/r2.js` |
| Gemini API triage integration | Done | `backend/src/lib/gemini.js`, with fallback on failure |
| `requireAuth` / `requireAdmin` middleware | Done | |
| Connect real R2 credentials in `.env` | Done | Verified with a live upload — `PUT` succeeded and the resulting URL returned `200 OK` publicly |
| Connect real Supabase credentials in `.env` | Not Started | Blocked on Bhanuka's Supabase project (URL + anon key + service role key needed) |
| Connect real Gemini API key in `.env` | Not Started | Need a key from [Google AI Studio](https://aistudio.google.com/apikey) |
| Smoke-test every route against the live Supabase project | Not Started | Blocked on Supabase credentials above |
| Deploy backend to Choreo (fallback: Render) | Not Started | Ship phase |

## Shared / whole-team

| Task | Status | Notes |
|---|---|---|
| Lock MVP scope | Done | See `docs/srs/03-scope-and-boundaries.md` |
| Seed sample data for the demo | Not Started | `backend/database/seed.sql` |
| Record 2-minute demo video | Not Started | |
| Compile submission PDF | Not Started | See submission checklist in `PLAN.md` |
