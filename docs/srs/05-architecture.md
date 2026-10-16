# 05 - System Architecture

## Stack summary

| Layer | Technology | Deployment |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Cloudflare Pages |
| Backend API | Node.js + Express | WSO2 Choreo (fallback: Render) |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) | Supabase-hosted |
| File storage | Cloudflare R2 (S3-compatible) | Cloudflare-hosted, public bucket |
| AI | Google Gemini API | Called server-side from Express |
| OTP delivery (v1) | Supabase Auth's own passwordless email OTP | No new vendor, no new table, Supabase generates, sends, and verifies the code, see [`06-data-model.md`](06-data-model.md#citizen-otp-no-otp_codes-table-supabase-auth-handles-it-natively). SMS is a Phase 2 item, [`04-scope-and-boundaries.md`](04-scope-and-boundaries.md). |

Stack is unchanged from the original design - this redesign is a workflow/role/data-model change, not a technology change (see `CLAUDE.md`).

## System context

```mermaid
flowchart LR
    Citizen((Citizen)) -->|browser, no login to report/browse| FE[React Frontend<br/>Cloudflare Pages]
    Citizen -->|NIC + OTP, for My Reports only| FE
    MO((Municipal Officer)) -->|browser, real login| FE
    PO((Provincial Officer)) -->|browser, real login| FE
    FE -->|"POST /api/issues (public)<br/>GET /api/issues/public (public)"| API[Express API<br/>Choreo]
    FE -->|"POST /api/my-reports/otp/request<br/>POST /api/my-reports/otp/verify"| API
    FE -->|"Officer: sign in<br/>(Supabase JS client)"| SBAuth[Supabase Auth]
    FE -->|"Reads with RLS<br/>(anon key + session JWT)"| SBDB[(Supabase Postgres)]
    API -->|"verify JWT (My Reports/officer routes)"| SBAuth
    API -->|"find-or-create citizen by NIC<br/>(admin API, no password set)"| SBAuth
    API -->|"INSERT / UPDATE / SELECT<br/>(service role key)"| SBDB
    API -->|"upload photo"| R2[(Cloudflare R2 bucket)]
    API -->|"category + description + council"| Gemini[Gemini API]
    Gemini -->|"priority, jurisdiction, redirect_authority, reason"| API
    API -->|"signInWithOtp / verifyOtp"| SBAuth
    Scheduler[Scheduled SLA-breach job] -->|"flag overdue issues"| SBDB
```

## Why this shape

- **The frontend never writes to Supabase directly.** All inserts/updates go through Express, which uses the Supabase **service role key**. This is also where R2 upload, Gemini triage (priority + jurisdiction), OTP generation/verification, and citizen/officer account provisioning happen.
- **Reporting and browsing require no session at all** - unchanged from the original design and a deliberate policy, not a gap. `POST /api/issues` and `GET /api/issues/public` are public routes. See [`03-governance-and-roles.md`](03-governance-and-roles.md#citizen-identity-what-stays-frictionless-and-what-changed).
- **Citizens never have a password.** "My Reports" access is a two-step OTP handshake (`request` → `verify`), not a sign-in with stored credentials. This closes the original design's NIC-as-password gap entirely, rather than hardening it.
- **Role checking happens server-side**, in Express, by verifying the caller's Supabase JWT and looking up role **and scope** (`council_id` for a Municipal Officer, `province_id` for a Provincial Officer) in the `profiles` table - never trust a role or scope claim sent from the client. A Municipal Officer's queries are always additionally filtered by their own `council_id`; a Provincial Officer's by their own `province_id`'s councils. See [`06-data-model.md`](06-data-model.md) for the RLS policies that back this up at the database layer too.
- **AI triage returns two judgments, not one** - priority and jurisdiction - and the jurisdiction result changes how the issue is queued (see below), not just how it's displayed.
- **SLA breach detection runs as a scheduled job**, not on every read - computing `sla_ack_due_at`/`sla_resolve_due_at` at submission time (a pure function of priority) means breach detection is just "is `now() > due_at` and status hasn't advanced," cheap to run on a timer (e.g. hourly) and cheap to query from the Provincial Officer dashboard afterward.

## Request flow: citizen submits an issue

```mermaid
sequenceDiagram
    participant C as Citizen (browser, no session)
    participant API as Express API
    participant Auth as Supabase Auth (admin API)
    participant R2 as Cloudflare R2
    participant AI as Gemini API
    participant DB as Supabase Postgres

    C->>API: POST /api/issues (multipart: nic, contact, category, council_id, ward, landmark, description, photo)
    API->>API: validate fields (NIC format, contact format, description length, ...)
    API->>DB: SELECT profiles WHERE nic = ?
    alt NIC not seen before
        API->>Auth: admin.createUser(no password, metadata {full_name, nic, contact})
        Auth-->>DB: trigger inserts profiles row (role='citizen')
    end
    alt photo attached
        API->>R2: PUT object
        R2-->>API: public object URL
    end
    API->>AI: category + description + council context
    AI-->>API: {priority, jurisdiction, redirect_authority, department, reason}
    API->>API: compute sla_ack_due_at / sla_resolve_due_at from priority
    API->>DB: INSERT INTO civic_issues (citizen_id, council_id, ..., status='Submitted', ai_*, sla_*)
    API->>DB: INSERT INTO issue_status_history (issue_id, to_status='Submitted', changed_by=null)
    DB-->>API: inserted row
    API-->>C: 201 Created (issue, including jurisdiction result)
```

## Request flow: citizen views "My Reports" (NIC + OTP)

```mermaid
sequenceDiagram
    participant C as Citizen (browser, no session)
    participant API as Express API
    participant DB as Supabase Postgres
    participant Auth as Supabase Auth (signInWithOtp / verifyOtp)

    C->>API: POST /api/my-reports/otp/request { nic }
    API->>DB: SELECT profiles WHERE nic = ? (find contact_email)
    API->>Auth: supabasePublic.auth.signInWithOtp({ email, shouldCreateUser: false })
    Auth-->>C: (Supabase sends the 6-digit code by email directly)
    API-->>C: 200 OK (same response whether or not the NIC exists)
    C->>API: POST /api/my-reports/otp/verify { nic, code }
    API->>DB: SELECT profiles WHERE nic = ? (find contact_email)
    API->>Auth: supabasePublic.auth.verifyOtp({ email, token: code, type: 'email' })
    Auth-->>API: session {access_token, refresh_token}
    API-->>C: 200 OK { session }
    C->>C: supabase.auth.setSession(session)
    C->>API: GET /api/issues (Authorization: Bearer <access_token>)
    API-->>C: this citizen's own issues (status, SLA state, no points)
```

Implementation note: this rides entirely on Supabase Auth's own passwordless email OTP, not a custom `otp_codes` table, see [`06-data-model.md`](06-data-model.md#citizen-otp-no-otp_codes-table-supabase-auth-handles-it-natively) for why.

## Request flow: Municipal Officer updates status

```mermaid
sequenceDiagram
    participant MO as Municipal Officer (real session)
    participant API as Express API
    participant DB as Supabase Postgres

    MO->>API: PATCH /api/issues/:id/status { status, note } (JWT)
    API->>API: verify JWT, confirm role = municipal_officer
    API->>DB: SELECT civic_issues WHERE id = ? AND council_id = caller.council_id
    alt issue not in this officer's council
        API-->>MO: 404 Not Found
    else valid transition
        API->>DB: UPDATE civic_issues SET status = ..., updated_at = now()
        API->>DB: INSERT INTO issue_status_history (issue_id, from_status, to_status, changed_by, note)
        DB-->>API: updated row
        API-->>MO: 200 OK
    end
```

## Request flow: SLA breach escalation (scheduled)

```mermaid
sequenceDiagram
    participant Job as Scheduled job (hourly)
    participant DB as Supabase Postgres

    Job->>DB: SELECT issues WHERE status NOT IN ('Resolved','Verified') AND (sla_ack_due_at < now() OR sla_resolve_due_at < now()) AND escalated = false
    DB-->>Job: overdue issues
    Job->>DB: UPDATE civic_issues SET escalated = true, escalated_at = now() WHERE id IN (...)
```

The Provincial Officer dashboard reads `WHERE escalated = true AND council_id IN (their province's councils)` - no separate notification pipeline required for v1 (see [`04-scope-and-boundaries.md`](04-scope-and-boundaries.md) for notification delivery as a Phase 2 item).

## Deployment topology

```mermaid
flowchart TB
    subgraph Cloudflare
        Pages[Cloudflare Pages<br/>frontend build]
        R2[(R2 bucket<br/>civic-issue-photos)]
    end
    subgraph Choreo
        Backend[Express API]
        Sched[Scheduled SLA-breach job]
    end
    subgraph Supabase
        Auth[Supabase Auth]
        Postgres[(Postgres DB)]
    end
    Browser((User Browser)) --> Pages
    Pages --> Backend
    Pages --> Auth
    Pages --> Postgres
    Backend --> R2
    Backend --> Postgres
    Backend --> Auth
    Backend -->|HTTPS| GeminiAPI[Gemini API]
    Backend -->|signInWithOtp / verifyOtp| Auth
    Sched --> Postgres
```

## Key decisions & rationale

| Decision | Rationale |
|---|---|
| Reporting and browsing remain public, no-session routes | Deliberate policy carried forward, not a gap - see [`03-governance-and-roles.md`](03-governance-and-roles.md#citizen-identity-what-stays-frictionless-and-what-changed) |
| Citizens never have a password (OTP-only) | Closes the original NIC-as-password security hole completely, rather than hardening it |
| Role + scope (`council_id`/`province_id`) checked server-side, backed by RLS | Never trust a client-sent role or scope claim; a Municipal Officer's own `council_id` bounds every query they can make |
| Officer accounts provisioned top-down (System Admin → Provincial Officer → Municipal Officer), never self-registered | Mirrors the real appointment chain (a Commissioner is appointed, not self-signed-up) and removes an entire attack surface |
| AI triage returns jurisdiction alongside priority | A council's SLA metrics are only meaningful if issues that aren't theirs to fix don't count against them |
| SLA due-dates computed once, at submission, from a fixed priority→target table | Makes breach detection a cheap, deterministic query instead of recomputing "how urgent is this" on every read |
| Photo upload proxied through Express, not a presigned URL | Avoids CORS configuration and a two-step upload flow - not worth the complexity at expected volume |
| R2 bucket public read access | Photos are non-sensitive (public civic issues) |
| Contribution points removed entirely | Replaced by public SLA-transparency stats - see [`03-governance-and-roles.md`](03-governance-and-roles.md#public-transparency-replaces-citizen-contribution-points) |
