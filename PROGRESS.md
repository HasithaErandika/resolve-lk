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
| Admin login (Supabase Auth, real email/password) | Done | Supabase Auth email/password wired, profile role check, demo evaluator login |
| Dashboard table/board of all issues | Done | Interactive Table & Kanban views with summary metric KPI counters |
| Search + category/status filter | Done | Keyword search across fields + category, status, priority, and ward filters |
| Status update control (`Pending → In Progress → Resolved`) | Done | `PATCH /api/issues/:id/status` wired with +15 citizen point bonus toasts |
| Surface AI priority/department/reason, flag Critical | Done | Critical alerts flagged with maple styling, department and Gemini reason displayed |
| End-to-end test on live deployed URL | In Progress | Local verification passed; live deployment testing pending ship phase |

## Bhanuka Samarasinghe — Supabase & Storage Architect

| Task | Status | Notes |
|---|---|---|
| Create Supabase project | Done | Connected and verified working |
| Run `backend/database/migrations/001` and `002` | Done | `profiles` (nic, points, role), `civic_issues`, triggers, RLS, `increment_points` RPC, search indexes — all verified live |
| Configure Supabase Auth | Done | Metadata → `profiles` trigger confirmed working for backend-provisioned citizens |
| Seed the one admin test account | Not Started | Create user in Supabase dashboard manually, then `update profiles set role = 'admin' ...` — no self-registration |
| Create & configure Cloudflare R2 bucket | Done | Bucket `resolve-lk` created, public r2.dev access enabled, credentials handed to Hasitha and verified with a live test upload |
| Run `backend/database/seed.sql` | Not Started | So the feed/dashboard aren't empty for the demo |
| Verify RLS with both roles | Done | Verified at the application layer during backend end-to-end testing — cross-citizen access correctly 404s, non-admin PATCH correctly 403s |

## Hasitha Erandika — Backend & AI Integration

**Status: implemented, restructured, and verified end-to-end against the live Supabase project.**

Layered architecture — `routes/` (wiring only) → `controllers/` (request/response) → `services/` (business logic) → `lib/` (external clients: Supabase, R2, Gemini). Shared concerns in `middleware/`, `utils/`, `config/`. Full OpenAPI spec in `src/docs/openapi.js`, served live at `/api-docs`.

| Task | Status | Notes |
|---|---|---|
| Express project skeleton, layered structure | Done | `backend/src/{app,server}.js`, `routes/`, `controllers/`, `services/`, `lib/`, `middleware/`, `utils/`, `config/` |
| `POST /api/issues` (public, find-or-create by NIC, upload, triage, insert, award points) | Done | `controllers/issuesController.js` + `services/citizenService.js`/`issueService.js` |
| `GET /api/issues/public` (anonymous feed, paginated + filterable) | Done | |
| `GET /api/issues`, `GET /api/issues/:id`, `PATCH /api/issues/:id/status` | Done | Paginated; points bonus on Resolved; malformed `:id` now rejected with 400 instead of leaking a raw DB error |
| `POST /api/my-reports/login` (NIC-only sign-in) | Done | `controllers/myReportsController.js` |
| R2 upload integration | Done | `services/storageService.js`, verified with a live upload |
| Gemini API triage integration | Done | `services/triageService.js`, model `gemini-3.1-flash-lite` (cheap/stable tier), with fallback on failure |
| Atomic contribution-points increment | Done | Postgres `increment_points` RPC (`database/migrations/002...`) instead of read-then-write — no race under concurrent submissions |
| `requireAuth` / `attachProfile` / `requireAdmin` middleware | Done | Profile fetched once per request via `attachProfile`, not re-queried per route |
| Centralized error handling | Done | `AppError` + `errorHandler` — consistent `{error, errors}` shape everywhere, including Multer errors |
| Swagger / OpenAPI docs | Done | `GET /api-docs` |
| Connect real R2 credentials in `.env` | Done | Verified with a live upload — `PUT` succeeded and the resulting URL returned `200 OK` publicly |
| Connect real Supabase credentials in `.env` | Done | Bhanuka's project connected and migrations 001+002 applied |
| Connect real Gemini API key in `.env` | Done | Verified with a live triage call |
| End-to-end verification against the live Supabase project | Done | Full citizen report → AI triage → public feed → My Reports login → admin list/get/status-update/points-bonus → cross-citizen isolation (404) → non-admin PATCH (403) all tested live; two real bugs found and fixed (empty-body crash, malformed-UUID `:id` leaking a raw DB error) — all test data cleaned up afterward |
| Deploy backend to Choreo (fallback: Render) | Not Started | Ship phase |

## Shared / whole-team

| Task | Status | Notes |
|---|---|---|
| Lock MVP scope | Done | See `docs/srs/03-scope-and-boundaries.md` |
| Seed sample data for the demo | Not Started | `backend/database/seed.sql` |
| Record 2-minute demo video | Not Started | |
| Compile submission PDF | Not Started | See submission checklist in `PLAN.md` |
