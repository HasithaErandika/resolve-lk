# PLAN.md - Execution Plan

Project: **Resolve LK** · Team of 4

`CLAUDE.md` and `docs/srs/` hold the *what* and *why* (now redesigned against Sri Lanka's real Municipal Council / Province hierarchy - see [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md)); this file holds the *when* and the *checklists*.

## Redesign roadmap (current)

The SRS was rewritten to target real Municipal Councils, not a hackathon demo - the v1 scope in [`docs/srs/04-scope-and-boundaries.md`](docs/srs/04-scope-and-boundaries.md) is substantially larger than what the original 4-hour session built (see the historical schedule below, kept for record). Rebuilding against the new contract is a phased effort, not a single sitting:

| Stage | Work | Depends on |
|---|---|---|
| 1. Schema migration | `provinces`, `councils`, extended `profiles` (role/scope), `issue_status_history` - see [`docs/srs/06-data-model.md`](docs/srs/06-data-model.md) | - |
| 2. Backend rebuild | Jurisdiction-aware triage, SLA engine + escalation job, OTP endpoints, officer-provisioning endpoints, full status-pipeline transitions - see [`docs/srs/07-api-specification.md`](docs/srs/07-api-specification.md) | Stage 1 |
| 3. Frontend rebuild | Report form with council picker, NIC+OTP My Reports, Municipal Officer dashboard, Provincial Officer dashboard, public SLA-transparency stats | Stage 2 |
| 4. Seed & verify | Realistic named province/council seed data; walk a Municipal Officer and a Provincial Officer through their full flow end to end | Stages 1–3 |
| 5. Visual design pass | Only once the workflow above is proven - implement the gov.lk-style visual language spec ([`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md#visual-design-language--specification-only-not-implemented-in-this-phase)), using shadcn/ui + TanStack Table | Stage 4 |

`PROGRESS.md` currently tracks the original hackathon-scoped build (still real, working code - a flat citizen/admin model) - treat it as the Stage 0 baseline this roadmap builds on top of, not as already reflecting the stages above.

## Historical: original 4-hour hackathon session

Kept for record - this was the actual plan followed for the SE3090 Assignment 2 submission before the redesign above.

### Golden rules

- **Lock scope by minute 20.** Nothing new gets added to the feature list after that.
- **Stop writing new features by minute 175.** Everything after that is polish, deploy, record, submit.
- Every member commits their own work under their own name/account - needed for the "Contribution from all registered members" rubric line (5 marks).

## Schedule

| Time | Phase | Everyone | Seneja (Citizen Experience) | Jayashan (Admin Dashboard) | Bhanuka (Supabase/Storage) | Hasitha (Backend/AI) |
|---|---|---|---|---|---|---|
| 0–20 | Plan | Confirm problem, lock MVP scope, agree on API contract (see [API spec](docs/srs/06-api-specification.md)) | - | - | - | - |
| 20–45 | Design | Divide up work per [team allocation](docs/srs/07-team-allocation.md) | Sketch landing/feed/form layout | Sketch dashboard layout & filters | Create Supabase project, run `backend/database/migrations/001` and `002` | *(backend already scaffolded - see `backend/src`)* get API keys (Supabase, R2, Gemini) |
| 45–175 | Build | Heads down | Wire the landing page's public feed to `GET /api/issues/public` and the report form to `POST /api/issues`; build My Reports | Build dashboard table/board, search + filter UI, wire admin login | Wire up Supabase Auth, RLS policies, seed one admin account; create & configure R2 bucket (public access) | Plug real Supabase/R2/Gemini credentials into `.env`; smoke-test every route |
| 175–205 | Polish | Integrate + fix | Test validation errors end to end, confirm points display | Wire dashboard to real `GET /api/issues` + status updates, confirm AI priority renders | Verify RLS with both roles, insert seed data | Verify triage output shape matches DB columns, fix edge cases |
| 205–225 | Ship | Deploy + verify in incognito | Deploy frontend to Cloudflare Pages | Test full flow end-to-end on the live URL | Confirm Supabase + R2 reachable from deployed frontend/backend | Deploy backend to Choreo (or Render fallback) |
| 225–240 | Submit | Record video, compile PDF | - | - | - | - |

## Minimum Requirements Checklist (Definition of Done)

Copied from the assignment brief - every box must be checked before minute 205.

- [ ] Clear landing page / main UI
- [ ] Sri Lankan problem explained inside the app
- [ ] At least 2 functional features (issue submission + admin dashboard/status update, minimum)
- [ ] At least 1 form accepting user input (the report form - NIC + email double as signup)
- [ ] Input validation with friendly error messages (NIC format, email format, description length, ...)
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

Per assignment §1.7 - everything below goes into **one PDF**, renamed with your Group ID:

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
