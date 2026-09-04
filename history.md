# Resolve LK — Session History

A chronological record of the AI-assisted work done on this project across one extended Claude Code session. This is a summary of what happened and why, not a verbatim transcript — secrets (API keys, passwords) that appeared in the conversation are redacted here; real values live only in the gitignored `.env` files.

---

## 1. Project setup and documentation

Started from a blank directory. Built out the initial project scaffolding and documentation before any code:

- `docs/srs/` — problem statement, solution overview, scope and boundaries, architecture (with Mermaid diagrams), data model, API specification, team allocation, requirements traceability.
- `README.md`, `CLAUDE.md`, `PLAN.md` — project overview, AI-assistant context file, and the 4-hour hackathon execution plan.
- `.github/workflows/` — basic CI (build/lint checks) for frontend and backend.
- Corrected an early architecture draft: switched planned storage from Supabase Storage to **Cloudflare R2**, deployment targets to **Cloudflare Pages** (frontend) and **Choreo** (backend, Render as fallback), and fixed several architectural gaps (missing role model, incomplete RLS policies, unclear write-path ownership).

**Key design decisions locked in early:**
- No login wall for reporting or browsing — the report form doubles as citizen signup via **NIC** (National Identity Card number).
- NIC is the durable identity; a real **email** is also collected because Supabase Auth requires one as the login field. First-time NIC auto-provisions an account (password = the NIC itself); returning NIC reuses it.
- Admins are seeded manually in Supabase — no self-registration, ever.
- A lightweight **"My Reports"** flow lets a citizen see their own history by typing just their NIC (the backend resolves it to the account's email and signs them in server-side).
- Citizens earn **contribution points**: +10 per report, +15 bonus when an admin marks it Resolved.

Team roles assigned in the docs: Seneja Thehansi (citizen experience/frontend), Jayashan Guruge (admin dashboard), Bhanuka Samarasinghe (Supabase & storage), Hasitha Erandika (backend & AI, and the primary user of this session).

---

## 2. Backend implementation

Built the Express API from scratch, then substantially restructured it partway through:

- **Initial pass:** flat `routes/`, `lib/`, `middleware/`, `validation/` structure. Endpoints: `POST /api/issues`, `GET /api/issues/public`, `GET /api/issues`, `GET /api/issues/:id`, `PATCH /api/issues/:id/status`, `POST /api/my-reports/login`.
- **AI triage:** originally spec'd for the Claude API, then switched to **Google Gemini** (`gemini-3.1-flash-lite` — a cheap/stable tier, chosen deliberately after being asked not to default to a token-heavy model).
- **Restructure to a layered architecture:** `routes/` (wiring only) → `controllers/` (request/response) → `services/` (business logic) → `lib/` (thin external clients: Supabase, R2, Gemini), plus `middleware/`, `utils/` (`AppError`, `asyncHandler`), and `config/env.js` (fail-fast env validation). All code comments stripped per instruction — self-documenting naming instead.
- **Swagger/OpenAPI** added: a hand-written spec (`src/docs/openapi.js`, not JSDoc-comment-based, to keep route files comment-free) served live at `GET /api-docs`.
- **Query optimization:** contribution points moved from a read-then-write to an atomic Postgres `increment_points` RPC (race-safe under concurrent submissions). Added pagination (`page`/`pageSize`, max 100) to both listing endpoints. Added an `attachProfile` middleware so a request's profile is fetched once, not re-queried per route. Added a trigram (`pg_trgm`) index for search and a `created_at` sort index.
- **Database migrations** split into numbered files under `backend/database/migrations/` (`001_init_schema.sql`, `002_points_rpc_and_search_indexes.sql`, `003_expand_categories.sql`), replacing an earlier monolithic `schema.sql`, with a `README.md` explaining the convention.
- **Categories expanded** from 4 (Garbage, Road, Water, Lighting) to 8, adding Drainage, Sewerage, Public Safety, Other — required a DB constraint migration (003) since category is enforced by a Postgres check constraint.

### Real bugs found and fixed during live testing
- An empty/malformed request body crashed to a generic 500 instead of returning clean validation errors (fixed by defaulting `req.body` defensively).
- A malformed (non-UUID) `:id` param leaked a raw Postgres error as a 500 — fixed with a `router.param('id', ...)` UUID guard, now a clean 400.
- Multer's `fileFilter` threw a plain `Error` for non-image uploads, which the error handler didn't recognize — fixed to throw an `AppError` so it returns a friendly 400 instead of a generic 500.
- A stray bit of chat text ("according to") got typed directly into `issuesController.js` mid-session (editor focus mixup), breaking the file's syntax — caught via `node --check` and fixed immediately.

---

## 3. Live infrastructure setup and verification

Real credentials were connected and tested end-to-end multiple times over the session:

- **Cloudflare R2** — bucket created, public `r2.dev` access enabled, credentials verified with a live test upload (confirmed the resulting URL returned `200 OK` publicly).
- **Gemini API** — key connected; initial model choice (`gemini-2.5-flash`) had been deprecated server-side, discovered via a live 404 from the API itself, and corrected to `gemini-3.1-flash-lite` after listing available models and picking deliberately for cost.
- **Supabase** — connected, migrations applied by Bhanuka, then **the project was swapped for a new one** partway through the session (old ref `lecacrfsttweidmrgmze` → new ref `dwavgabxxgjmmpykiieq`), which was the actual root cause of an "admin login is restricted" report (new project had no schema/seed/admin account yet, not a code bug).
- **Admin account** — the user's own account (`wickramasinghe.erandika@gmail.com`) was created and promoted to `role = 'admin'` via a direct SQL update (the sanctioned, documented path — no self-registration).
- **Sample data** — 8 realistic seed issues inserted across all 4 original categories, all 3 statuses, and 3 real citizen accounts, for a populated demo.

Two full end-to-end verification passes were run directly against the live backend and Supabase project (creating real test accounts/reports, then cleaning them up afterward): citizen report submission → real R2 upload → real Gemini triage → public feed → My Reports login → admin list/get/status-update → points bonus (verified atomic: 10 + 15 = 25) → cross-citizen isolation (404) → non-admin PATCH rejection (403).

---

## 4. Frontend implementation

- Converted the entire frontend from JS/JSX to **TypeScript/TSX** (Vite's `react-ts` template config, `typescript-eslint`).
- Set up **Tailwind CSS v4** with a custom "autumn" theme (`maple`, `pumpkin`, `golden`, `bark`, `birch`, plus a complementary `fern` for the "Resolved" status the palette didn't originally cover).
- Processed the team's logo (removed a white background via PIL, generated favicon sizes), wired it into the header, footer, and browser tab.
- Built out the citizen-facing pages: `Home`, `Report`, `Feed`, `MyReports`, plus a shared `RootLayout`, `Header`, `Footer`.
- Integrated teammates' merged work via git (Jayashan's full admin dashboard PR, Seneja's citizen-experience routing refactor) — resolved several integration gaps left by the merges: missing `react-router-dom`/`@supabase/supabase-js` dependencies, a missing `<BrowserRouter>` wrapper causing a hard crash, and pages that had been built but never wired into routing (the old single-page `App.tsx` was still rendering instead of the new multi-page structure).
- Wired every citizen-facing page to the **real backend** (previously mock/`setTimeout`-based): `ReportForm` → `POST /api/issues`, `Feed` → `GET /api/issues/public`, `MyReports` → `POST /api/my-reports/login` + `supabase.auth.setSession()` + `GET /api/issues`.
- Removed all demo/mock code on request: the "Instant Demo Sign-in" shortcut and `isDemoMode` logic in `AdminAuthContext`, and the `sampleIssues.ts` mock data file (deleted entirely) along with every fallback-to-fake-data path in `Feed.tsx` and `lib/adminApi.ts` — failures now surface as real error states instead of silently showing fake content.
- Design pass: removed every em dash from the codebase (replaced with periods/commas/colons, including backend-side user-facing validation messages), switched the page background from a warm cream tint to pure white (birch kept only as a sparing accent), centered page headers, fixed a heading-scale inconsistency, replaced straight quotes with typographic ones, and removed a skewed decorative background band in favor of a flatter, more minimal section treatment.
- Added a reusable searchable combobox (`SearchableSelect.tsx`) for the Category and Ward/Zone fields on the report form; expanded the ward list from 20 to 50+.
- Added search to `Feed` (debounced, hits the real API with category filter) and `MyReports` (client-side, instant); debounced the admin dashboard's existing search (previously refired on every keystroke).
- Added a shared read-only `IssueDetailModal.tsx` (full photo/description/AI-triage view), wired to `IssueCard` via an `onClick` prop, used by both `Feed` and `MyReports`.

---

## 5. Process notes

- A merge conflict never actually occurred, but a genuine git divergence did: local `development` and `origin/development` had diverged (a teammate's admin-dashboard PR landed upstream while local backend restructuring work was uncommitted). Resolved with a clean `git merge`, preserving both sides; committed without the `Co-Authored-By` trailer per explicit instruction.
- Throughout, backend verification favored real, live testing (actual HTTP requests against the actual Supabase project, with test data cleaned up afterward) over assuming code correctness from reading alone — this is how most of the "real bugs found" above were actually caught.
- `PROGRESS.md` was kept as the live per-member task tracker throughout, updated as work landed.

---

## Where things stand

See `PROGRESS.md` for the current, itemized status per team member. Backend is fully implemented and verified end-to-end. Frontend is fully wired to the real API with no remaining mock data. Outstanding before ship: re-verify/re-seed against the (new) Supabase project if not already done, run migration `003_expand_categories.sql`, deploy frontend (Cloudflare Pages) and backend (Choreo/Render), record the demo video, and compile the submission PDF.
