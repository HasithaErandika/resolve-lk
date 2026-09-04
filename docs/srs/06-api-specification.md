# 06 — API Specification

Owner: **Hasitha Erandika (Backend & AI Integration)**. Base path: `/api`. Implemented in `backend/src/routes/`, `controllers/`, and `services/` — this doc explains the contract for whoever's calling it (Seneja and Jayashan on the frontend). A live, interactive version of this spec is served at **`GET /api-docs`** (Swagger UI) whenever the backend is running — source: `backend/src/docs/openapi.js`.

Every endpoint below has been exercised end-to-end against the live Supabase project (real citizen signup-via-report, AI triage, public feed, My Reports login, admin list/get/status-update, points bonus, cross-citizen isolation, role enforcement) — this is a verified contract, not just a plan.

Only three routes require a bearer token: `GET /api/issues` (my-reports/admin), `GET /api/issues/:id`, and `PATCH /api/issues/:id/status` (admin). Everything else — submitting a report, browsing the public feed, and the My Reports login handshake — is intentionally open, since neither citizen action should sit behind a login. See [`02-solution-overview.md`](02-solution-overview.md).

## Auth

There is no `/auth/signup` or `/auth/login` route. Two different things happen instead:

- **Citizens** never explicitly log in. `POST /api/issues` auto-provisions or reuses an account behind the scenes (see below). If a citizen wants to see their own history, `POST /api/my-reports/login` (NIC only) hands back a real Supabase session for the frontend to adopt.
- **Admins** log in the normal way, directly against Supabase Auth from the frontend (`supabase.auth.signInWithPassword`) with a real admin email/password (seeded manually — see [`05-data-model.md`](05-data-model.md)).

**Middleware — `requireAuth`** (`middleware/auth.js`): reads the bearer token, calls `supabase.auth.getUser(token)`; 401 if invalid/missing.
**Middleware — `attachProfile`**: runs after `requireAuth`; fetches the caller's profile (`id, role, points`) once and attaches it as `req.profile`, so downstream handlers never re-query it.
**Middleware — `requireAdmin`**: runs after `attachProfile`; 403 if `req.profile.role !== 'admin'`.

## Pagination (all listing endpoints)

`GET /api/issues` and `GET /api/issues/public` both accept:

| Param | Default | Notes |
|---|---|---|
| `page` | `1` | 1-indexed |
| `pageSize` | `20` | clamped to a max of `100` |
| `category` | — | one of `Garbage`, `Road`, `Water`, `Lighting`, `Drainage`, `Sewerage`, `Public Safety`, `Other` |
| `status` | — | one of `Pending`, `In Progress`, `Resolved` |
| `search` | — | matches `description`/`landmark` (case-insensitive, backed by a trigram index — see `database/migrations/002...`) |

Response envelope:

```json
{ "issues": [ /* ... */ ], "page": 1, "pageSize": 20, "total": 42 }
```

## `POST /api/issues`

**PUBLIC — no auth header needed.** Creates a new civic issue. This is also, functionally, the citizen "signup" — see [`02-solution-overview.md`](02-solution-overview.md).

- **Content-Type:** `multipart/form-data`
- **Fields:**
  | Field | Type | Required | Validation |
  |---|---|---|---|
  | `nic` | string | yes | Sri Lankan NIC format (old or new) |
  | `email` | string | yes | valid email — used as the Supabase Auth username if this NIC is new |
  | `full_name` | string | no | passed through to the profile if this NIC is new |
  | `category` | string | yes | one of `Garbage`, `Road`, `Water`, `Lighting`, `Drainage`, `Sewerage`, `Public Safety`, `Other` |
  | `ward` | string | yes | non-empty |
  | `landmark` | string | yes | non-empty |
  | `description` | string | yes | ≥ 20 characters |
  | `photo` | file | no | image mime type, ≤ 5MB |
  | `latitude` | number | no | -90 to 90; captured via the browser's Geolocation API, not a Maps integration |
  | `longitude` | number | no | -180 to 180 |

- **Server steps:** validate fields → find-or-create the citizen's account by `nic` (new NIC: create a Supabase Auth user with the given `email` and password = `nic`; existing NIC: reuse it, ignoring whatever email was typed this time) → if `photo` present, upload to R2, get public URL → call the Gemini API with `category` + `description` → insert the row (with `citizen_id` = that account's id) using the Supabase service role client → atomically award **+10** contribution points (`increment_points` RPC) → return the created row.
- **Success:** `201 Created`
  ```json
  {
    "id": "uuid",
    "category": "Garbage",
    "ward": "Colombo 06",
    "landmark": "Near Wellawatte market",
    "description": "...",
    "photo_url": "https://.../photo.jpg",
    "status": "Pending",
    "ai_priority": "Critical",
    "ai_department": "Public Health",
    "ai_reason": "...",
    "created_at": "2026-09-04T10:00:00Z",
    "contributor_points": 10
  }
  ```
- **Validation error:** `400 Bad Request`
  ```json
  { "error": "Validation failed.", "errors": { "description": "Description must be at least 20 characters so engineers have enough detail." } }
  ```
- **Non-image photo:** `400 Bad Request` — `{ "errors": { "photo": "Photo must be an image file." } }`
- **Photo over 5MB:** `400 Bad Request` — `{ "errors": { "photo": "Photo must be 5MB or smaller." } }`

## `GET /api/issues/public`

**PUBLIC — no auth header needed.** The anonymous, browsable feed for the landing page — a "gig board" of open issues. Never includes `citizen_id` or any other identifying detail. Paginated (see above).

## `POST /api/my-reports/login`

**PUBLIC.** A citizen types only their NIC to see their own report history — no password field is ever shown.

- **Body:** `{ "nic": "200112345678" }`
- **Server steps:** look up the profile by `nic` → look up that account's real email via the Supabase admin API → sign in with `(email, nic)` — password has always been the NIC — → return the resulting session.
- **Success:** `200 OK`
  ```json
  { "session": { "access_token": "...", "refresh_token": "...", "...": "..." } }
  ```
  The frontend adopts this with `supabase.auth.setSession({ access_token, refresh_token })`, then calls `GET /api/issues` to list the citizen's own reports and current points.
- **Not found:** `404 Not Found` — `{ "error": "No account found for this NIC. Report an issue first to create one." }`
- **Invalid NIC format:** `400 Bad Request`

## `GET /api/issues`

Requires a session. Paginated (see above). Behavior depends on caller role:
- **citizen:** returns only their own issues ("My Reports")
- **admin:** returns all issues (the admin dashboard)

- **Auth:** required
- **Success:** `200 OK` — paginated envelope of full issue objects (includes `citizen_id`, unlike the public feed)

## `GET /api/issues/:id`

Fetch one issue. Citizens may only fetch their own; admins may fetch any.

- **Auth:** required
- **Success:** `200 OK` — single issue object
- **Malformed id (not a UUID):** `400 Bad Request` — `{ "error": "Validation failed.", "errors": { "id": "Invalid issue id." } }`
- **Not found / not permitted:** `404 Not Found`

## `PATCH /api/issues/:id/status`

Update an issue's status. Admin-only. Marking an issue `Resolved` atomically awards the reporting citizen a **+15** points bonus.

- **Auth:** required, `requireAdmin`
- **Body:** `{ "status": "In Progress" }` — one of `Pending`, `In Progress`, `Resolved`
- **Success:** `200 OK` — updated issue object
- **Invalid status:** `400 Bad Request`
- **Not admin:** `403 Forbidden`

## Error shape (consistent across all routes)

```json
{ "error": "human-readable message", "errors": { "field": "specific message" } }
```

`errors` is only present for field-level validation failures; otherwise a top-level `error` string is enough. Every thrown error — including Multer upload errors and unexpected exceptions — is normalized to this shape by the single `errorHandler` middleware (`middleware/errorHandler.js`); no route formats its own error response.

## Implementation notes

- `lib/supabaseClient.js` exports two clients: `supabaseAdmin` (service role key — verifies JWTs, does all DB reads/writes, provisions accounts) and `supabasePublic` (anon key — used only inside the My Reports login service to perform the actual sign-in, exactly as the frontend would).
- `services/storageService.js` streams the Multer-buffered photo to R2 via `@aws-sdk/client-s3`'s `PutObjectCommand`.
- `services/triageService.js` sends a small, deterministic prompt to Gemini (model `gemini-3.1-flash-lite`) instructing it to return only JSON matching `{priority, department, reason}`. The response shape is validated before trusting it — falls back to `priority: "Medium"` if parsing fails, so a bad AI response never blocks a submission.
- `services/citizenService.js#awardPoints` calls the `increment_points` Postgres function (an atomic `UPDATE ... SET points = points + $1`) instead of reading then writing from Node — two reports (or a report and a Resolved bonus) landing at the same moment can never race and drop an update.
- `routes/issues.routes.js` validates that `:id` is a well-formed UUID via `router.param('id', ...)` before it ever reaches a query — a malformed id used to leak a raw Postgres error as a generic 500; it's now a clean 400.
