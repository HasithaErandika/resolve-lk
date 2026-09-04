# 06 — API Specification

Owner: **Hasitha Erandika (Backend & AI Integration)**. Base path: `/api`. Already implemented in `backend/src/routes/` — this doc explains the contract for whoever's calling it (Seneja and Jayashan on the frontend).

Only two routes require a bearer token: `GET /api/issues` (my-reports/admin) and `PATCH /api/issues/:id/status` (admin). Everything else — submitting a report and browsing the public feed — is intentionally open, since neither citizen action should sit behind a login. See [`02-solution-overview.md`](02-solution-overview.md).

## Auth

There is no `/auth/signup` or `/auth/login` route. Two different things happen instead:

- **Citizens** never explicitly log in. `POST /api/issues` auto-provisions or reuses an account behind the scenes (see below). If a citizen wants to see their own history, `POST /api/my-reports/login` (NIC only) hands back a real Supabase session for the frontend to adopt.
- **Admins** log in the normal way, directly against Supabase Auth from the frontend (`supabase.auth.signInWithPassword`) with a real admin email/password (seeded manually — see [`05-data-model.md`](05-data-model.md)).

**Middleware — `requireAuth`**: reads the bearer token, calls `supabase.auth.getUser(token)`; 401 if invalid/missing.
**Middleware — `requireAdmin`**: runs after `requireAuth`; looks up `profiles.role` for the user; 403 if not `admin`.

## `POST /api/issues`

**PUBLIC — no auth header needed.** Creates a new civic issue. This is also, functionally, the citizen "signup" — see [`02-solution-overview.md`](02-solution-overview.md).

- **Content-Type:** `multipart/form-data`
- **Fields:**
  | Field | Type | Required | Validation |
  |---|---|---|---|
  | `nic` | string | yes | Sri Lankan NIC format (old or new) |
  | `email` | string | yes | valid email — used as the Supabase Auth username if this NIC is new |
  | `full_name` | string | no | passed through to the profile if this NIC is new |
  | `category` | string | yes | one of `Garbage`, `Road`, `Water`, `Lighting` |
  | `ward` | string | yes | non-empty |
  | `landmark` | string | yes | non-empty |
  | `description` | string | yes | ≥ 20 characters |
  | `photo` | file | no | image mime type, ≤ 5MB |

- **Server steps:** validate fields → find-or-create the citizen's account by `nic` (new NIC: create a Supabase Auth user with the given `email` and password = `nic`; existing NIC: reuse it, ignoring whatever email was typed this time) → if `photo` present, upload to R2, get public URL → call the Gemini API with `category` + `description` → insert the row (with `citizen_id` = that account's id) using the Supabase service role client → award **+10** contribution points → return the created row.
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
  { "errors": { "description": "Description must be at least 20 characters so engineers have enough detail." } }
  ```

## `GET /api/issues/public`

**PUBLIC — no auth header needed.** The anonymous, browsable feed for the landing page — a "gig board" of open issues. Never includes `citizen_id` or any other identifying detail.

- **Query params:** `category` (optional filter), `status` (optional filter), `search` (optional, matches `description`/`landmark`)
- **Success:** `200 OK` — array of `{ id, category, ward, landmark, description, photo_url, status, ai_priority, ai_department, ai_reason, created_at }`

## `POST /api/my-reports/login`

**PUBLIC.** A citizen types only their NIC to see their own report history — no password field is ever shown.

- **Body:** `{ "nic": "200112345678" }`
- **Server steps:** look up the profile by `nic` → look up that account's real email via the Supabase admin API → sign in with `(email, nic)` — password has always been the NIC — → return the resulting session.
- **Success:** `200 OK`
  ```json
  { "session": { "access_token": "...", "refresh_token": "...", "...": "..." } }
  ```
  The frontend adopts this with `supabase.auth.setSession({ access_token, refresh_token })`, then calls `GET /api/issues` (or reads Supabase directly) to list the citizen's own reports and current points.
- **Not found:** `404 Not Found` — `{ "error": "No account found for this NIC. Report an issue first to create one." }`
- **Invalid NIC format:** `400 Bad Request`

## `GET /api/issues`

Requires a session. Behavior depends on caller role:
- **citizen:** returns only their own issues ("My Reports")
- **admin:** returns all issues (the admin dashboard)

- **Auth:** required
- **Query params:** `category` (optional filter), `status` (optional filter), `search` (optional, matches against `description`/`landmark`)
- **Success:** `200 OK` — array of full issue objects (includes `citizen_id`, unlike the public feed)

## `GET /api/issues/:id`

Fetch one issue. Citizens may only fetch their own; admins may fetch any.

- **Auth:** required
- **Success:** `200 OK` — single issue object
- **Not found / not permitted:** `404 Not Found`

## `PATCH /api/issues/:id/status`

Update an issue's status. Admin-only. Marking an issue `Resolved` awards the reporting citizen a **+15** points bonus.

- **Auth:** required, `requireAdmin`
- **Body:** `{ "status": "In Progress" }` — one of `Pending`, `In Progress`, `Resolved`
- **Success:** `200 OK` — updated issue object
- **Invalid status:** `400 Bad Request`
- **Not admin:** `403 Forbidden`

## Error shape (consistent across all routes)

```json
{ "error": "human-readable message", "errors": { "field": "specific message" } }
```

`errors` is only present for field-level validation failures; otherwise a top-level `error` string is enough.

## Implementation notes

- Two Supabase clients: `supabaseAdmin` (service role key — verifies JWTs, does all DB reads/writes, provisions accounts) and `supabasePublic` (anon key — used only inside `POST /api/my-reports/login` to perform the actual sign-in, exactly as the frontend would). See `backend/src/lib/supabase.js`.
- `multer` (memory storage) receives the photo upload; the buffer streams to R2 via `@aws-sdk/client-s3`'s `PutObjectCommand`, endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, `region: "auto"`. See `backend/src/lib/r2.js`.
- The Gemini prompt is small and deterministic: a system instruction telling it to act as a municipal triage engineer and return only JSON matching `{priority, department, reason}` (`responseMimeType: "application/json"`). The response shape is validated before trusting it — falls back to `priority: "Medium"` if parsing fails, so a bad AI response never blocks a submission. See `backend/src/lib/gemini.js`.
