# CLAUDE.md — Project Context for AI-Assisted Development

This file gives Claude (or any AI coding assistant) the context needed to work on **Resolve LK** without re-deriving decisions already made. Read this before generating code for any part of the project.

## What this project is

Resolve LK is a civic-issue reporting and resolution web app for Sri Lankan local councils, built for the SE3090 Mini Hackathon (4-hour supervised build, team of 4). Citizens report issues (garbage, road damage, water, lighting); municipal admins triage and resolve them. An AI auto-triage feature scores each report's priority. Full background: [`docs/srs/01-problem-statement.md`](docs/srs/01-problem-statement.md) and [`docs/srs/02-solution-overview.md`](docs/srs/02-solution-overview.md).

**Do not build anything listed as out-of-scope** in [`docs/srs/03-scope-and-boundaries.md`](docs/srs/03-scope-and-boundaries.md) — no real maps/GPS, no native mobile app, no third "worker" app, no admin self-registration. Time is the binding constraint, not ambition.

## Tech stack (fixed — do not substitute)

| Concern | Choice | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Deployed to **Cloudflare Pages** |
| Backend | Node.js + Express | Deployed to **WSO2 Choreo** (fallback: Render) |
| Database | Supabase (PostgreSQL) | Also provides Auth |
| Auth | Supabase Auth (email/password) | Roles handled via a `profiles` table, NOT Supabase's built-in metadata alone |
| File storage | **Cloudflare R2** | S3-compatible. **Not** Supabase Storage. |
| AI | Anthropic Claude API | Called server-side only, from Express, never from the frontend |

Rationale and diagrams: [`docs/srs/04-architecture.md`](docs/srs/04-architecture.md)

## Repository structure (planned)

```
resolve-lk/
├── frontend/           # React + Vite + Tailwind app (citizen + admin UI)
├── backend/            # Express API
├── docs/
│   ├── srs/             # problem, solution, scope, architecture, data model, API spec, team allocation
│   └── ai-prompt-log.md
├── .github/workflows/   # CI (build/lint checks)
├── README.md
├── PLAN.md
└── CLAUDE.md
```

`frontend/` and `backend/` do not exist yet — they get scaffolded when implementation starts. Do not create them until told to.

## Core architectural rules

1. **Writes go through the backend.** The frontend never inserts/updates `civic_issues` directly. Citizen submission and admin status updates both hit Express endpoints, which use the Supabase **service role** key (server-side only, never shipped to the client).
2. **Reads can go direct.** The frontend may query Supabase directly with the anon key for read-only views (e.g. a citizen's own issue list), relying on RLS. The admin dashboard may also just call the backend's `GET /api/issues` for consistency — either is acceptable; pick one and be consistent within a feature.
3. **Role check happens server-side.** Any admin-only backend route must verify the caller's Supabase JWT and check `profiles.role = 'admin'` before proceeding. Never trust a role claim sent from the client.
4. **Photo upload flow (keep it simple):** frontend sends a multipart form directly to `POST /api/issues`; Express uploads the file to R2 using `@aws-sdk/client-s3` (R2 is S3-compatible), then calls Claude for triage, then inserts the row into Supabase — all in one request/response cycle. Do not build a separate presigned-URL upload step; it adds CORS complexity not worth it in 4 hours.
5. **Claude API key and R2 credentials live only in backend environment variables.** Never expose them to the frontend bundle.
6. **Admin accounts are seeded manually**, not created through public signup. Public signup always creates a `citizen` profile.
7. **Citizens register with their NIC (National Identity Card) number**, stored as a unique column on `profiles` and passed through as Supabase Auth signup metadata. Validate the format (`^([0-9]{9}[VvXx]|[0-9]{12})$`) client- and server-side, and surface a clean "an account already exists for this NIC" message on the unique-constraint conflict rather than a raw DB error. We only validate format + uniqueness in our own DB — no government registry check, that's explicitly out of scope.

Full schema and RLS policies: [`docs/srs/05-data-model.md`](docs/srs/05-data-model.md)
Full endpoint list: [`docs/srs/06-api-specification.md`](docs/srs/06-api-specification.md)

## Environment variables

**`frontend/.env.local`**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

**`backend/.env`**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL_BASE=
ANTHROPIC_API_KEY=
PORT=8787
```

Never commit real values. `.env.example` files (once `frontend/` and `backend/` exist) should list these keys with empty/placeholder values only.

## Conventions

- Commit small and often, one logical change per commit, so the Git history reflects real contribution from all 4 members (this is separately marked).
- Every significant AI-generated chunk of code gets logged in `docs/ai-prompt-log.md` — tool, prompt, purpose, what was changed after review. Do this as you go, not at the end.
- Validation errors shown to users must be specific and friendly (e.g. "Description must be at least 20 characters so engineers have enough detail" — not "invalid input").
- Keep the UI responsive-first: test every screen at mobile width, not just desktop.
- Every team member must be able to explain any code they touched — this is checked live in the demo.

## Team ownership (who to attribute code to / who owns what)

See [`docs/srs/07-team-allocation.md`](docs/srs/07-team-allocation.md) for the full breakdown. Summary:

- **Member 1** — Citizen frontend (landing page, problem explainer, issue submission form + validation), deploys frontend.
- **Member 2** — Admin frontend (dashboard, search/filter, status updates).
- **Member 3** — Supabase (schema, Auth, RLS, seeded admin) + Cloudflare R2 bucket setup.
- **Member 4** — Express backend, R2 upload integration, Claude API triage integration, deploys backend.
