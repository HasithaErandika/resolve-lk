# PLAN.md — 4-Hour Hackathon Execution Plan

Project: **Resolve LK** · SE3090 Assignment 2 · Team of 4

This is the operational plan for the session. `CLAUDE.md` and `docs/srs/` hold the *what* and *why*; this file holds the *when* and the *checklists*.

## Golden rules

- **Lock scope by minute 20.** Nothing new gets added to the feature list after that — see [`docs/srs/03-scope-and-boundaries.md`](docs/srs/03-scope-and-boundaries.md) for what's already excluded.
- **Stop writing new features by minute 175.** Everything after that is polish, deploy, record, submit.
- Every member commits their own work under their own name/account — needed for the "Contribution from all registered members" rubric line (5 marks).

## Schedule

| Time | Phase | Everyone | Member 1 (Citizen FE) | Member 2 (Admin FE) | Member 3 (Supabase/Storage) | Member 4 (Backend/AI) |
|---|---|---|---|---|---|---|
| 0–20 | Plan | Confirm problem, lock MVP scope, agree on API contract (see [API spec](docs/srs/06-api-specification.md)) | — | — | — | — |
| 20–45 | Design | Divide up work per [team allocation](docs/srs/07-team-allocation.md) | Sketch form fields & validation rules | Sketch dashboard layout & filters | Create Supabase project, run schema SQL | Init GitHub repo, Express skeleton, get API keys (Supabase, R2, Claude) |
| 45–175 | Build | Heads down | Build landing page + problem explainer + issue form + validation | Build dashboard table/board, search + filter UI | Wire up Supabase Auth, RLS policies, seed one admin account; create & configure R2 bucket (public access) | Build `POST /api/issues`, `GET /api/issues`, `PATCH /api/issues/:id/status`; R2 upload; Claude triage call |
| 175–205 | Polish | Integrate + fix | Wire form to real `POST /api/issues`, test validation errors | Wire dashboard to real `GET /api/issues` + status updates, confirm AI priority renders | Verify RLS with both roles, insert seed data | Verify triage output shape matches DB columns, fix edge cases |
| 205–225 | Ship | Deploy + verify in incognito | Deploy frontend to Cloudflare Pages | Test full flow end-to-end on the live URL | Confirm Supabase + R2 reachable from deployed frontend/backend | Deploy backend to Choreo (or Render fallback) |
| 225–240 | Submit | Record video, compile PDF | — | — | — | — |

## Minimum Requirements Checklist (Definition of Done)

Copied from the assignment brief — every box must be checked before minute 205.

- [ ] Clear landing page / main UI
- [ ] Sri Lankan problem explained inside the app
- [ ] At least 2 functional features (issue submission + admin dashboard/status update, minimum)
- [ ] At least 1 form accepting user input (citizen signup form + issue submission form)
- [ ] Input validation with friendly error messages (incl. NIC format + duplicate-NIC check on signup)
- [ ] A way to display/search/filter/update/process information (admin dashboard search+filter+status update)
- [ ] Responsive on desktop and mobile
- [ ] Basic navigation between sections/screens
- [ ] Sample data relevant to the problem (seeded issues)
- [ ] Clear demonstration of value to Sri Lankan users

Full mapping to rubric criteria: [`docs/srs/08-requirements-traceability.md`](docs/srs/08-requirements-traceability.md)

## Deployment checklist

- [ ] Frontend live on Cloudflare Pages, tested in an incognito window
- [ ] Backend live on Choreo (or Render fallback), tested with a real request from the deployed frontend
- [ ] `VITE_API_BASE_URL` on the deployed frontend points at the deployed backend, not `localhost`
- [ ] Supabase RLS confirmed working against the deployed app (not just local dev)
- [ ] R2 bucket public URL confirmed reachable (paste a photo URL directly into a browser tab)
- [ ] 5–10 seeded sample issues present so the dashboard isn't empty for the demo

## Submission checklist

Per assignment §1.7 — everything below goes into **one PDF**, renamed with your Group ID:

- [ ] Git repository link
- [ ] Deployed application link
- [ ] Two-minute demonstration video link
- [ ] Team member names and student IDs
- [ ] Short description of the problem and the solution
- [ ] List of technologies and AI tools used
- [ ] AI Prompt Log (from [`docs/ai-prompt-log.md`](docs/ai-prompt-log.md))
- [ ] README.md in the repo is complete (all fields filled, no leftover placeholders)
- [ ] AI usage declared in both the README and the PDF

## Demo video checklist (≤ 2 minutes)

- [ ] Team + project intro (brief)
- [ ] The Sri Lankan problem, stated clearly
- [ ] The solution, stated clearly
- [ ] Live demo: citizen submits an issue with a photo
- [ ] Live demo: AI priority appears on the admin dashboard
- [ ] Live demo: admin changes status
- [ ] Confirm it's the deployed link, not localhost
- [ ] Close on expected impact
