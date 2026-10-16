# PROGRESS.md - Live Task Tracker

> This tracker now reflects the governance-redesign build (Citizen -> Municipal Officer -> Provincial Officer -> System Administrator), the target contract described in `docs/srs/`. The prior hackathon-scoped build (flat citizen/admin, points, NIC-as-password) has been fully replaced in the codebase - see `history.md` for how the project got here.
>
> **What "Done" means below:** the code exists, type-checks/builds/lints clean, and was read back for internal consistency. It has **not** been run against a real Supabase project, R2 bucket, or Gemini API key in this environment (none of those credentials exist here) - that verification still has to happen against your actual project, the same way the original build's end-to-end testing did.

Status values: **Not Started**, **In Progress**, **Done (code only, not live-verified)**.

Reminder: no role above Citizen self-registers. Municipal Officer accounts are provisioned by their Provincial Officer; Provincial Officer accounts by a System Administrator - see [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md#roles-in-resolve-lk).

## Database (`backend/database/`)

| Task | Status | Notes |
|---|---|---|
| Migrations 005-009 (provinces, councils incl. lat/lon, extended `profiles`, `civic_issues` council/jurisdiction/SLA fields incl. PRDA, `issue_status_history`, `council_sla_stats` view, RLS, drop points) | Done (code only) | Written as a clean rebuild (006 `TRUNCATE`s `civic_issues`) per your call that only test data existed. Not yet run against a live project. |
| `seed.sql` (provinces + councils reference data, incl. coordinates) | Done (code only) | 3 provinces, 5 real named councils (Colombo, Sri Jayawardenepura Kotte, Dehiwala-Mount Lavinia, Kandy, Galle). You asked to hold off correcting/expanding this further yourself. |
| `seed.mjs` (officer + citizen accounts, sample issues incl. one `Reopened` and one `escalated`) | Done (code only) | Node script using the Supabase Admin API, since auth users can't be hand-inserted via SQL. Same note as above - not run live. |

## Backend (`backend/src/`)

| Task | Status | Notes |
|---|---|---|
| `services/slaService.js` (priority -> SLA due-dates) | Done | |
| `services/triageService.js` (jurisdiction-aware AI triage, incl. PRDA/RDA road-name hinting via `lib/rdaRoads.js`) | Done | |
| `lib/geo.js` + `services/councilService.js#findNearestCouncil` (Haversine council suggestion) | Done | |
| `services/otpService.js` (Supabase-native OTP request/verify) | Done | Deviates from the original SRS sketch (no custom `otp_codes` table) - docs updated to match. |
| `services/citizenService.js` (passwordless citizen provisioning) | Done | |
| `services/issueService.js` (council/province scoping, full 6-state transition table, reopen escalation) | Done | |
| `services/councilService.js` / `services/escalationService.js` (public listings/stats, escalation queue, officer provisioning) | Done | |
| `middleware/auth.js` (`requireRole`, scope enforced in services) | Done | |
| `validation/issuesValidation.js` (new statuses, `council_id`, `contact_email`, optional photo) | Done | |
| Routes + controllers for issues, my-reports/otp, councils, provinces, provincial, admin | Done | |
| `src/jobs/slaBreachJob.js` (`npm run sla:sweep`) | Done (code only) | Not wired into a live scheduler in this environment - documented as needing an hourly cron in production. |
| `docs/openapi.js` | Done | |
| Live end-to-end verification against a real Supabase/R2/Gemini project | **Not started** | No credentials available in this environment. |

## Frontend (`frontend/src/`)

| Task | Status | Notes |
|---|---|---|
| Types (`types/issue.ts`, `types/council.ts`) | Done | |
| Report form: council picker, Haversine "did you mean" suggestion, optional photo, `contact_email` | Done | |
| "My Reports": two-step NIC + OTP flow, points removed, confirm/dispute actions on `Resolved` | Done | |
| Public feed: SLA-transparency stats strip | Done | |
| Council Directory page: real 29-council reference list by province, governance hierarchy explainer, legal framework references, verified contact info where sourced (Colombo only so far) | Done | |
| Officer auth (`OfficerAuthContext`), `OfficerLogin`, `OfficerPortal` routing by role | Done | |
| Municipal Officer dashboard (table + board views, council-scoped, single-next-status actions) | Done | |
| Provincial Officer dashboard (escalation queue, Municipal Officer provisioning form) | Done | |
| Professional header/footer, mobile nav, hero illustration (inline SVG, no external asset) | Done | |
| Mobile input sizing fix (16px on small screens to prevent iOS zoom) across report/search/OTP forms | Done | |
| `npx tsc -b`, `npm run build`, `npm run lint` | Done | All clean as of this build. |
| Manual browser testing (desktop and mobile viewport) | **Not started** | No browser tooling available in this environment this session; you should click through both flows before treating this as final. |

## Shared / whole-team

| Task | Status | Notes |
|---|---|---|
| Lock the governance-redesign scope | Done | See `docs/srs/04-scope-and-boundaries.md` |
| Seed sample data for a live demo | Not started (deliberately, on your instruction) | `backend/database/seed.sql` + `seed.mjs` exist and are correct against real council names, but you asked to hold off populating/correcting the data further yourself |
| Record a demo video | Not started | |
