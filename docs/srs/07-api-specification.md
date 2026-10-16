# 07 - API Specification

Base path: `/api`. This documents the **target contract** for the redesigned system - see `PROGRESS.md` for what's actually implemented against this contract versus the prior hackathon-scoped API it replaces. A live, interactive version should be kept current at **`GET /api-docs`** (Swagger UI), source `backend/src/docs/openapi.js`, same as before.

## Auth

Three different things happen, matching the three account types in [`03-governance-and-roles.md`](03-governance-and-roles.md):

- **Citizens** never have a password. `POST /api/issues` auto-provisions or reuses a NIC-keyed profile with no credential set. To view their own history, a citizen goes through the two-step OTP handshake below.
- **Municipal Officers** and **Provincial Officers** log in normally against Supabase Auth (`supabase.auth.signInWithPassword`) with real, provisioned credentials - see the provisioning endpoints below. Neither role can self-register.
- **System Administrator** accounts are seeded manually at deployment; there is no `/auth/signup` route for any role.

**Middleware - `requireAuth`**: reads the bearer token, calls `supabase.auth.getUser(token)`; 401 if invalid/missing.
**Middleware - `attachProfile`**: fetches the caller's profile (`id, role, council_id, province_id`) once, attaches as `req.profile`.
**Middleware - `requireRole(...roles)`**: 403 if `req.profile.role` isn't in the allowed set.
**Middleware - `scopeToCouncil` / `scopeToProvince`**: applied on issue routes for officer roles; injects a `WHERE council_id = req.profile.council_id` (or the province's council list) into the underlying query - this is what makes cross-council/cross-province access structurally impossible, not just unchecked.

## Pagination (all listing endpoints)

Unchanged shape from the original design:

| Param | Default | Notes |
|---|---|---|
| `page` | `1` | 1-indexed |
| `pageSize` | `20` | clamped to a max of `100` |
| `category` | - | `Garbage`, `Road`, `Water`, `Lighting`, `Drainage`, `Sewerage`, `Public Safety`, `Other` |
| `status` | - | `Submitted`, `Acknowledged`, `In Progress`, `Resolved`, `Verified`, `Reopened` |
| `council_id` | - | filter by council (public feed and Provincial Officer views) |
| `search` | - | matches `description`/`landmark`, trigram-indexed |

Response envelope: `{ "issues": [...], "page": 1, "pageSize": 20, "total": 42 }`

## `POST /api/issues`

**PUBLIC - no auth header.** Creates a new civic issue. Functionally still a citizen "signup" with no password set - see [`02-solution-overview.md`](02-solution-overview.md).

- **Content-Type:** `multipart/form-data`
- **Fields:**
  | Field | Type | Required | Validation |
  |---|---|---|---|
  | `nic` | string | yes | Sri Lankan NIC format |
  | `contact_email` | string | yes* | valid email - *at least one of `contact_email`/`contact_phone` required, for OTP delivery |
  | `contact_phone` | string | no | collected for future SMS OTP; not used for delivery in v1 |
  | `full_name` | string | no | passed through if this NIC is new |
  | `council_id` | uuid | yes | must exist in `councils` |
  | `category` | string | yes | one of the fixed category list |
  | `ward` | string | yes | non-empty |
  | `landmark` | string | yes | non-empty |
  | `description` | string | yes | ≥ 20 characters |
  | `photo` | file | no | image mime type, ≤ 5MB |
  | `latitude` / `longitude` | number | no | device geolocation, optional |

- **Server steps:** validate → find-or-create citizen by `nic` (new: create an `auth.users` row with **no password**; existing: reuse it) → upload photo to R2 if present → call Gemini with category + description + council context → compute `sla_ack_due_at`/`sla_resolve_due_at` from the returned priority → insert the row (`status = 'Submitted'`) → insert the initial `issue_status_history` row → return the created row.
- **Success:** `201 Created`
  ```json
  {
    "id": "uuid",
    "council_id": "uuid",
    "category": "Garbage",
    "ward": "Colombo 06",
    "landmark": "Near Wellawatte market",
    "description": "...",
    "photo_url": "https://.../photo.jpg",
    "status": "Submitted",
    "ai_priority": "Critical",
    "ai_jurisdiction": "in_council",
    "ai_redirect_authority": null,
    "ai_department": "Public Health",
    "ai_reason": "...",
    "sla_ack_due_at": "2026-09-05T10:00:00Z",
    "sla_resolve_due_at": "2026-09-07T10:00:00Z",
    "created_at": "2026-09-04T10:00:00Z"
  }
  ```
- **Validation error:** `400 Bad Request` - `{ "error": "Validation failed.", "errors": { "description": "Description must be at least 20 characters so engineers have enough detail." } }`

## `GET /api/issues/public`

**PUBLIC.** The anonymous, browsable feed. Never includes `citizen_id`. Paginated, filterable by `council_id`/`category`/`status`.

## `GET /api/councils`

**PUBLIC.** Lists every council (id, name, district, province, `operatesOwnWaterScheme`). Backs the report form's council picker and the officer-provisioning forms.

## `GET /api/provinces`

**PUBLIC.** Lists every province (id, name).

## `GET /api/councils/nearest`

**PUBLIC.** Haversine-based nearest-council suggestion for a GPS point captured on the report form, see [`03-governance-and-roles.md`](03-governance-and-roles.md#location-based-council-suggestion-haversine) for why this is a suggestion, never a validation gate.

- **Query:** `latitude`, `longitude` (both required)
- **Success:** `200 OK` - `{ "nearest": { "id": "uuid", "name": "Colombo Municipal Council", "distanceKm": 1.4 } }` (or `{ "nearest": null }` if no council has coordinates on file)
- `POST /api/issues` also runs this internally when latitude/longitude are submitted, and returns a `suggested_council` field alongside the created issue if it differs from the council the citizen picked.

## `GET /api/councils/stats`

**PUBLIC.** The SLA-transparency numbers that replace the points system - see [`06-data-model.md`](06-data-model.md#public-sla-transparency-stats).

- **Query:** `council_id` (optional - omit for all councils), `category` (optional)
- **Success:** `200 OK`
  ```json
  { "council_id": "uuid", "category": "Road", "resolved_within_sla_pct": 87, "avg_resolution_hours": 41, "open_count": 6 }
  ```

## `POST /api/my-reports/otp/request`

**PUBLIC.** Step 1 of citizen access to their own history.

- **Body:** `{ "nic": "200112345678" }`
- **Server steps:** look up profile by `nic` to find `contact_email` → `supabasePublic.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })`. Supabase Auth generates, stores, and sends the code itself, see [`06-data-model.md`](06-data-model.md#citizen-otp-no-otp_codes-table-supabase-auth-handles-it-natively).
- **Success:** `200 OK` - `{ "message": "A verification code has been sent." }` (deliberately identical whether or not the NIC exists, to avoid leaking which NICs are registered)

## `POST /api/my-reports/otp/verify`

**PUBLIC.** Step 2 - exchanges a valid code for a session.

- **Body:** `{ "nic": "200112345678", "code": "482913" }`
- **Server steps:** look up profile by `nic` to find `contact_email` → `supabasePublic.auth.verifyOtp({ email, token: code, type: 'email' })`, which returns a real Supabase session directly if the code is valid.
- **Success:** `200 OK` - `{ "session": { "access_token": "...", "refresh_token": "..." } }`. Frontend adopts with `supabase.auth.setSession(session)`, then calls `GET /api/issues` for the citizen's own reports.
- **Invalid/expired code:** `400 Bad Request` - `{ "error": "That code is invalid or has expired. Request a new one." }`

## `GET /api/issues`

Requires a session. Paginated. Behavior depends on role:
- **citizen:** own issues only
- **municipal_officer:** their council's issues only (`council_id = req.profile.council_id`, enforced server-side + RLS)
- **provincial_officer:** every issue for every council in their province

## `GET /api/issues/:id`

Fetch one issue, scoped identically to `GET /api/issues` per role. `404` if outside the caller's scope (never `403` - doesn't confirm the issue exists).

## `PATCH /api/issues/:id/status`

Update an issue's status through the pipeline. **Municipal Officer only** for forward transitions; the reporting **citizen** may transition `Resolved → Verified` (confirm) or `Resolved → Reopened` (dispute) on their own issue.

- **Body:** `{ "status": "Acknowledged", "note": "optional" }`
- **Valid transitions enforced server-side:** `Submitted→Acknowledged→In Progress→Resolved→Verified`, plus `Resolved→Reopened→In Progress`. Any other transition is `400`.
- **Server steps:** verify caller is either the owning council's Municipal Officer (for officer-driven transitions) or the reporting citizen (for `Verified`/`Reopened`) → update `civic_issues.status` → insert an `issue_status_history` row → if transitioning into `Reopened`, increment `reopened_count`; if `reopened_count` reaches 2, set `escalated = true`.
- **Success:** `200 OK` - updated issue object
- **Not this officer's council / not this citizen's issue:** `404 Not Found`

## `GET /api/provincial/escalations`

**Provincial Officer only.** The escalation queue described in [`03-governance-and-roles.md`](03-governance-and-roles.md#sla-targets-and-escalation).

- **Query:** standard pagination + `council_id` (optional, to drill into one council)
- **Success:** `200 OK` - paginated envelope of issues where `escalated = true`, scoped to the caller's province, each including `council_name` and how far past due it is.

## `POST /api/provincial/municipal-officers`

**Provincial Officer only.** Provisions a Municipal Officer account for a council in the caller's own province.

- **Body:** `{ "council_id": "uuid", "email": "...", "full_name": "..." }`
- **Server steps:** verify `council_id` belongs to the caller's `province_id` → create an `auth.users` row with a system-generated temporary password (delivered out-of-band, e.g. shown once to the Provincial Officer to relay securely - not emailed in plaintext) → profile trigger sets `role = 'municipal_officer'`, `council_id`.
- **403** if the council isn't in the caller's province.

## `POST /api/admin/provincial-officers`

**System Administrator only.** Provisions a Provincial Officer account for one of the 9 provinces. Same credential-handling approach as above.

## Error shape (unchanged)

```json
{ "error": "human-readable message", "errors": { "field": "specific message" } }
```

Normalized by the single `errorHandler` middleware - no route formats its own error response.

## Implementation notes

- `lib/supabaseClient.js` exports `supabaseAdmin` (service role - all DB reads/writes, account provisioning) and `supabasePublic` (anon key - used only where a real end-user session needs to be exercised, e.g. verifying the OTP-issued session behaves exactly as the frontend would receive it).
- `services/triageService.js` now requests `{priority, jurisdiction, redirect_authority, department, reason}` from Gemini, validated against the jurisdiction table in [`03-governance-and-roles.md`](03-governance-and-roles.md) before trusting it - falls back to `priority: "Medium"`, `jurisdiction: "in_council"` if parsing fails, so a bad AI response never blocks a submission or wrongly redirects a real council issue.
- `services/slaService.js` holds the fixed priority→target-hours table and computes `sla_ack_due_at`/`sla_resolve_due_at` at insert time.
- `services/otpService.js` generates, hashes, and verifies OTP codes; never logs a plaintext code.
- `routes/*.routes.js` validates `:id`/`council_id`/`province_id` params as well-formed UUIDs via `router.param(...)` before they reach a query.
