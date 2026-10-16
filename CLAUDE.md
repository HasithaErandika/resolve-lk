# CLAUDE.md - Project Context for AI-Assisted Development

This file gives Claude (or any AI coding assistant) the context needed to work on **Resolve LK** without re-deriving decisions already made. Read this before generating code for any part of the project.

## What this project is

Resolve LK is a civic-issue reporting and resolution platform built against Sri Lanka's actual local government hierarchy: **Citizen → Municipal Council (one Municipal Officer account per council) → Province (one Provincial Officer account per province) → System Administrator**. It began as a 4-hour SE3090 hackathon prototype (team of 4, SLIIT) but the design documented in `docs/srs/` is now written for real Municipal Councils, not a demo - read [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md) first; it is the single most load-bearing document in this repo and explains *why* the roles below are shaped the way they are, grounded in how Municipal Councils, provincial oversight, and jurisdiction over categories like water/roads/electricity actually work in Sri Lanka.

Reporting and browsing are fully public - no login wall, and this is a deliberate, permanent policy, not a gap to close later. Citizens report issues (NIC + contact + category + council + description, optional photo) through one form; a Municipal Officer (the council's Commissioner's office) triages and resolves issues for their own council only; a Provincial Officer oversees every council in their province and handles SLA escalations. An AI auto-triage feature scores each report's priority **and** flags whether it's actually the council's jurisdiction (vs. NWSDB/RDA/CEB/Police). Full background: [`docs/srs/01-problem-statement.md`](docs/srs/01-problem-statement.md), [`docs/srs/02-solution-overview.md`](docs/srs/02-solution-overview.md), [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md).

**Do not build anything listed as out-of-scope** in [`docs/srs/04-scope-and-boundaries.md`](docs/srs/04-scope-and-boundaries.md) - this includes items explicitly deferred to Phase 2 (SMS OTP, Urban Council/Pradeshiya Sabha support, full Sinhala/Tamil UI, the government visual-design system, department sub-roles, map-based reporting) as well as permanently out of scope (native mobile app, a separate field-crew app, gating report submission behind identity verification, DRP registry verification). Time and real deployability are the binding constraints, not ambition - a phase boundary exists for a reason, follow it.

**Do not implement the visual design language described in [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md#visual-design-language--specification-only-not-implemented-in-this-phase).** That section is a documented specification for a future UI rebuild (an official gov.lk-style aesthetic) - it exists so the direction is agreed in advance, not as an instruction to restyle the current frontend now.

## Tech stack (fixed - do not substitute)

| Concern | Choice | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Deployed to **Cloudflare Pages** |
| Backend | Node.js + Express | Deployed to **WSO2 Choreo** (fallback: Render) |
| Database | Supabase (PostgreSQL) | Also provides Auth |
| Auth | Supabase Auth | Roles handled via a `profiles` table (role + `council_id`/`province_id` scope), NOT Supabase's built-in metadata alone. Citizens have **no password** - see rule 2 below. |
| File storage | **Cloudflare R2** | S3-compatible. **Not** Supabase Storage. |
| AI | **Google Gemini API** | Called server-side only, from Express, never from the frontend. Returns priority **and** jurisdiction - see rule 12. |
| OTP delivery (v1) | Email | SMS is a Phase 2 item requiring a paid gateway - see [`docs/srs/04-scope-and-boundaries.md`](docs/srs/04-scope-and-boundaries.md) |

Rationale and diagrams: [`docs/srs/05-architecture.md`](docs/srs/05-architecture.md)

## Repository structure

```
resolve-lk/
├── frontend/            # React + Vite + Tailwind app (public landing/feed/report + Municipal/Provincial Officer dashboards)
├── backend/
│   ├── database/
│   │   ├── migrations/    # run in order in the Supabase SQL editor
│   │   └── seed.sql
│   └── src/
│       ├── app.js          # Express app construction (no listen)
│       ├── server.js       # entrypoint - loads env, calls app.listen
│       ├── config/         # env.js - validates all required env vars at startup
│       ├── routes/         # route wiring only, no logic
│       ├── controllers/    # request/response glue
│       ├── services/       # business logic (citizens, issues, storage, triage, sla, otp)
│       ├── lib/             # thin external clients (Supabase, R2, Gemini) + nic.js
│       ├── middleware/      # auth, requireRole, scopeToCouncil/scopeToProvince, upload (Multer), errorHandler
│       ├── validation/      # field-level input validation
│       ├── utils/           # AppError, asyncHandler
│       └── docs/            # openapi.js - served live at GET /api-docs
├── docs/
│   ├── srs/               # problem, solution, governance/roles, scope, architecture, data model, API spec, team allocation, requirements traceability
│   └── ai-prompt-log.md
├── .github/workflows/    # CI (build/lint checks)
├── README.md
├── PLAN.md
├── PROGRESS.md
└── CLAUDE.md
```

`frontend/` and `backend/` are already scaffolded - see their own directories. **`PROGRESS.md` currently tracks the prior hackathon-scoped implementation** (verified end-to-end against a live Supabase project, but built against the flat citizen/admin model this redesign replaces). Treat `docs/srs/` as the current target contract and `PROGRESS.md` as showing what's built against the *old* contract until it's updated against this one - do not assume backend code matches this file set until `PROGRESS.md` says so.

Route handlers stay thin - a route file only wires a path to a controller function; a controller only translates HTTP in/out; all actual logic (Supabase queries, R2 uploads, Gemini calls, SLA computation, OTP handling) lives in `services/`. Any error worth a specific HTTP status is thrown as an `AppError` (`utils/AppError.js`) and caught by the single `errorHandler` middleware - never build a response object inside a controller for an error case.

## Core architectural rules

1. **Reporting and browsing need no login at all.** `POST /api/issues` and `GET /api/issues/public` are public routes. Never add an auth requirement to either - this is a deliberate, permanent policy (see [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md#citizen-identity-what-stays-frictionless-and-what-changed)), not a hackathon shortcut to be "fixed" later.
2. **The report form doubles as citizen signup, and citizens never have a password.** It collects NIC (durable identity, unique) and a contact email/phone (for OTP delivery only). First-time NIC → the backend auto-provisions an account (`supabaseAdmin.auth.admin.createUser` with **no password set**); returning NIC → reuses the existing account. Never set a citizen's password to their NIC or anything else derived from user-supplied data - that was the original hackathon design and is a closed security gap, not a pattern to reintroduce.
3. **Writes go through the backend.** The frontend never inserts/updates `civic_issues` or `profiles` directly. All of that - including citizen account provisioning and officer account provisioning - happens in Express using the Supabase **service role** key (server-side only, never shipped to the client).
4. **"My Reports" access is NIC + one-time code (OTP), never a password field.** A citizen types their NIC, requests a code (`POST /api/my-reports/otp/request`), enters it (`POST /api/my-reports/otp/verify`), and the backend mints a session for the frontend to adopt with `supabase.auth.setSession()`. Never show a citizen a password field, and never generate a code from anything derivable from public data (NIC, name, etc.) - see `services/otpService.js`.
5. **Municipal Officers and Provincial Officers log in for real, and never self-register.** Municipal Officer accounts are provisioned by their province's Provincial Officer; Provincial Officer accounts are provisioned by a System Administrator. There is no signup form for either role, at any layer.
6. **Role AND scope checks happen server-side.** Any officer-only backend route must verify the caller's Supabase JWT, check `profiles.role`, and additionally filter every query by `profiles.council_id` (Municipal Officer) or `profiles.province_id`'s councils (Provincial Officer). Never trust a role or scope claim sent from the client. RLS is the database-level backstop for this, not the only enforcement layer - see [`docs/srs/06-data-model.md`](docs/srs/06-data-model.md).
7. **Photo upload flow (keep it simple):** frontend sends a multipart form directly to `POST /api/issues`; Express uploads the file to R2 using `@aws-sdk/client-s3`, calls Gemini for triage, computes SLA due-dates, then inserts the row into Supabase - all in one request/response cycle. Do not build a separate presigned-URL upload step.
8. **Gemini API key, R2 credentials, the Supabase service role key, and OTP-delivery credentials live only in backend environment variables.** Never expose them to the frontend bundle.
9. **There is no citizen points/gamification system.** It was removed in the redesign. Public accountability comes from `GET /api/councils/stats` (SLA-compliance stats per council/category), not a per-citizen counter - see [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md#public-transparency-replaces-citizen-contribution-points). Do not add a points column or points logic back in.
10. **`attachProfile` middleware fetches the caller's profile once per request** (`req.profile`, including `role`, `council_id`, `province_id`) - routes and role/scope middleware read from it instead of each re-querying `profiles`.
11. **Listing endpoints are paginated** (`page`/`pageSize`, max 100) - never add an unbounded `select('*')` listing query.
12. **AI triage returns jurisdiction, not just priority.** `services/triageService.js` must return `{priority, jurisdiction, redirect_authority, department, reason}` and validate `jurisdiction`/`redirect_authority` against the table in [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md#category--responsible-authority-jurisdiction) before trusting it. A `jurisdiction: "redirect"` issue is still recorded and still shown to the reporting citizen, but excluded from the owning council's SLA stats.
13. **SLA due-dates are computed once, at submission time**, from a fixed priority→target-hours table (see [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md#sla-targets-and-escalation)) - never recomputed later, and never used to silently move a deadline that's already been communicated.
14. **The status pipeline is `Submitted → Acknowledged → In Progress → Resolved → Verified`, with a `Reopened` path** - not the old flat three-state `Pending/In Progress/Resolved`. Every transition is written to `issue_status_history` (who, when, from/to, optional note). A citizen may only transition their own `Resolved` issue to `Verified` or `Reopened`; all forward transitions are the owning council's Municipal Officer only.

Full schema and RLS policies: [`docs/srs/06-data-model.md`](docs/srs/06-data-model.md)
Full endpoint list: [`docs/srs/07-api-specification.md`](docs/srs/07-api-specification.md)

## Environment variables

**`frontend/.env.local`**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8787
```

**`backend/.env`**
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL_BASE=
GEMINI_API_KEY=
CORS_ORIGIN=http://localhost:5173
PORT=8787
```

Never commit real values - both `.env` files are gitignored; `.env.example` in each app lists these keys with empty values for reference.

## Conventions

- Commit small and often, one logical change per commit, so the Git history reflects real contribution from all 4 members.
- Every significant AI-generated chunk of code gets logged in `docs/ai-prompt-log.md` - tool, prompt, purpose, what was changed after review. Do this as you go, not at the end.
- Validation errors shown to users must be specific and friendly (e.g. "Description must be at least 20 characters so engineers have enough detail" - not "invalid input").
- Keep the UI responsive-first: test every screen at mobile width, not just desktop, across all three account types (citizen, Municipal Officer, Provincial Officer).
- Every team member must be able to explain any code they touched, including the real-world reasoning behind role/scope checks - not just what the code does.

## Team ownership (who to attribute code to / who owns what)

See [`docs/srs/08-team-allocation.md`](docs/srs/08-team-allocation.md) for the full breakdown. Summary:

- **Seneja Thehansi** - Citizen experience: landing page, public feed + SLA-transparency display, report form (with council picker), NIC + OTP "My Reports" flow, citizen confirm/dispute on `Resolved` issues.
- **Jayashan Guruge** - Municipal Officer dashboard and Provincial Officer dashboard (cross-council view, escalation queue, officer-provisioning UI).
- **Bhanuka Samarasinghe** - Supabase schema (`provinces`, `councils`, extended `profiles`, `issue_status_history`), RLS for council/province scoping, Cloudflare R2 bucket setup.
- **Hasitha Erandika** - Express backend, jurisdiction-aware AI triage, SLA engine + escalation job, OTP endpoints, officer-provisioning endpoints, deploys backend.
