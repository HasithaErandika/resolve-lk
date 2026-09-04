# CLAUDE.md — Project Context for AI-Assisted Development

This file gives Claude (or any AI coding assistant) the context needed to work on **Resolve LK** without re-deriving decisions already made. Read this before generating code for any part of the project.

## What this project is

Resolve LK is a civic-issue reporting and resolution web app for Sri Lankan local councils, built for the SE3090 Mini Hackathon (4-hour supervised build, team of 4). Reporting and browsing are fully public — no login wall. Citizens report issues (garbage, road damage, water, lighting) through one form that also functions as signup (NIC + email); municipal admins log in for real to triage and resolve them. An AI auto-triage feature scores each report's priority, and citizens earn contribution points. Full background: [`docs/srs/01-problem-statement.md`](docs/srs/01-problem-statement.md) and [`docs/srs/02-solution-overview.md`](docs/srs/02-solution-overview.md).

**Do not build anything listed as out-of-scope** in [`docs/srs/03-scope-and-boundaries.md`](docs/srs/03-scope-and-boundaries.md) — no real maps/GPS, no native mobile app, no third "worker" app, no admin self-registration, **no citizen dashboard or traditional login screen**. Time is the binding constraint, not ambition.

## Tech stack (fixed — do not substitute)

| Concern | Choice | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Deployed to **Cloudflare Pages** |
| Backend | Node.js + Express | Deployed to **WSO2 Choreo** (fallback: Render) |
| Database | Supabase (PostgreSQL) | Also provides Auth |
| Auth | Supabase Auth (email/password) | Roles handled via a `profiles` table, NOT Supabase's built-in metadata alone |
| File storage | **Cloudflare R2** | S3-compatible. **Not** Supabase Storage. |
| AI | **Google Gemini API** | Called server-side only, from Express, never from the frontend |

Rationale and diagrams: [`docs/srs/04-architecture.md`](docs/srs/04-architecture.md)

## Repository structure

```
resolve-lk/
├── frontend/            # React + Vite + Tailwind app (public landing/feed/report + admin dashboard)
├── backend/             # Express API
│   └── database/         # schema.sql, seed.sql (run in the Supabase SQL editor)
├── docs/
│   ├── srs/               # problem, solution, scope, architecture, data model, API spec, team allocation
│   └── ai-prompt-log.md
├── .github/workflows/    # CI (build/lint checks)
├── README.md
├── PLAN.md
└── CLAUDE.md
```

`frontend/` and `backend/` are already scaffolded — see their own directories. The backend (routes, middleware, lib) is largely implemented; the frontend currently has a static landing page placeholder (public feed and report form are UI-only, not yet wired to the API).

## Core architectural rules

1. **Reporting and browsing need no login at all.** `POST /api/issues` and `GET /api/issues/public` are public routes. Never add an auth requirement to either — that's the whole point of the design (see [`02-solution-overview.md`](02-solution-overview.md)).
2. **The report form doubles as citizen signup.** It collects NIC (durable identity, unique) and email (Supabase Auth's required login field). First-time NIC → the backend auto-provisions an account (`supabaseAdmin.auth.admin.createUser`, password = the NIC itself); returning NIC → reuses the existing account regardless of what email was typed this time.
3. **Writes go through the backend.** The frontend never inserts/updates `civic_issues` or `profiles` directly. All of that — including citizen account provisioning — happens in Express using the Supabase **service role** key (server-side only, never shipped to the client).
4. **"My Reports" is the only citizen-facing login-like moment, and it's one field.** A citizen types their NIC into `POST /api/my-reports/login`; the backend resolves it to that account's email, signs in server-side (password is still the NIC), and returns a session for the frontend to adopt with `supabase.auth.setSession()`. Never show a citizen a password field.
5. **Admins log in for real**, directly against Supabase Auth from the frontend, with real seeded credentials — this is the one traditional login screen in the app.
6. **Role check happens server-side.** Any admin-only backend route must verify the caller's Supabase JWT and check `profiles.role = 'admin'` before proceeding. Never trust a role claim sent from the client.
7. **Photo upload flow (keep it simple):** frontend sends a multipart form directly to `POST /api/issues`; Express uploads the file to R2 using `@aws-sdk/client-s3` (R2 is S3-compatible), then calls Gemini for triage, then inserts the row into Supabase — all in one request/response cycle. Do not build a separate presigned-URL upload step.
8. **Gemini API key, R2 credentials, and the Supabase service role key live only in backend environment variables.** Never expose them to the frontend bundle.
9. **Contribution points are a plain counter on `profiles.points`**, updated in application code (`backend/src/lib/citizens.js#awardPoints`): +10 on report submission, +15 bonus when an admin marks a report `Resolved`. Not a DB trigger — kept simple and easy to explain live in the demo.

Full schema and RLS policies: [`docs/srs/05-data-model.md`](docs/srs/05-data-model.md)
Full endpoint list: [`docs/srs/06-api-specification.md`](docs/srs/06-api-specification.md)

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

Never commit real values — both `.env` files are gitignored; `.env.example` in each app lists these keys with empty values for reference.

## Conventions

- Commit small and often, one logical change per commit, so the Git history reflects real contribution from all 4 members (this is separately marked).
- Every significant AI-generated chunk of code gets logged in `docs/ai-prompt-log.md` — tool, prompt, purpose, what was changed after review. Do this as you go, not at the end.
- Validation errors shown to users must be specific and friendly (e.g. "Description must be at least 20 characters so engineers have enough detail" — not "invalid input").
- Keep the UI responsive-first: test every screen at mobile width, not just desktop.
- Every team member must be able to explain any code they touched — this is checked live in the demo.

## Team ownership (who to attribute code to / who owns what)

See [`docs/srs/07-team-allocation.md`](docs/srs/07-team-allocation.md) for the full breakdown. Summary:

- **Seneja Thehansi** — Citizen experience: landing page, public feed, report form (no dashboard), My Reports page. Deploys frontend.
- **Jayashan Guruge** — Admin dashboard: login, table/board, search/filter, status updates.
- **Bhanuka Samarasinghe** — Supabase (schema, Auth, RLS, seeded admin) + Cloudflare R2 bucket setup.
- **Hasitha Erandika** — Express backend, R2 upload integration, Gemini API triage integration, points logic, deploys backend. *(Backend is already largely implemented — see `backend/src`.)*
