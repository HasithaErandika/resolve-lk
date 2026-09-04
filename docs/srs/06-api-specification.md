# 06 — API Specification

Owner: **Member 4 (Backend & AI Integration)**. Base path assumed: `/api`. All protected routes expect `Authorization: Bearer <supabase_jwt>`.

## Auth

There are no custom `/auth` routes — sign-up and login happen entirely on the frontend via the Supabase JS client (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`). The backend only ever *verifies* a token it's handed; it never issues one.

**Middleware — `requireAuth`**: reads the bearer token, calls `supabase.auth.getUser(token)`; 401 if invalid/missing.
**Middleware — `requireAdmin`**: runs after `requireAuth`; looks up `profiles.role` for the user; 403 if not `admin`.

## `POST /api/issues`

Create a new civic issue. Citizen-only (any authenticated user with role `citizen`, or simply any authenticated user — admins aren't expected to file reports but it's not worth blocking).

- **Auth:** required
- **Content-Type:** `multipart/form-data`
- **Fields:**
  | Field | Type | Required | Validation |
  |---|---|---|---|
  | `category` | string | yes | one of `Garbage`, `Road`, `Water`, `Lighting` |
  | `ward` | string | yes | non-empty |
  | `landmark` | string | yes | non-empty |
  | `description` | string | yes | ≥ 20 characters |
  | `photo` | file | no | image mime type, ≤ 5MB |

- **Server steps:** validate fields → if `photo` present, upload to R2, get public URL → call Claude API with `category` + `description` → insert row (with `citizen_id` = authenticated user's id) using the Supabase service role client → return the created row.
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
    "created_at": "2026-09-04T10:00:00Z"
  }
  ```
- **Validation error:** `400 Bad Request`
  ```json
  { "errors": { "description": "Description must be at least 20 characters so engineers have enough detail." } }
  ```

## `GET /api/issues`

List issues. Behavior depends on caller role:
- **citizen:** returns only their own issues
- **admin:** returns all issues

- **Auth:** required
- **Query params:** `category` (optional filter), `status` (optional filter), `search` (optional, matches against `description`/`landmark`)
- **Success:** `200 OK` — array of issue objects (same shape as above)

## `GET /api/issues/:id`

Fetch one issue. Citizens may only fetch their own; admins may fetch any.

- **Auth:** required
- **Success:** `200 OK` — single issue object
- **Not found / not permitted:** `404 Not Found`

## `PATCH /api/issues/:id/status`

Update an issue's status. Admin-only.

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

## Notes for Member 4

- Use `@supabase/supabase-js` twice: once with the **anon key** (only to call `auth.getUser(token)` for verification) and once with the **service role key** (for all DB writes/privileged reads). Keep them as two separate client instances, clearly named (`supabasePublic`, `supabaseAdmin`), so it's obvious which one is doing what.
- Use `multer` (memory storage) to receive the photo upload, then stream the buffer to R2 via `@aws-sdk/client-s3`'s `PutObjectCommand`, with endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` and `region: "auto"`.
- Keep the Claude prompt small and deterministic: system prompt instructing it to act as a municipal triage engineer and return only JSON matching `{priority, department, reason}`. Validate the shape of what comes back before trusting it — fall back to `priority: "Medium"` if parsing fails, so a bad AI response never blocks the submission.
