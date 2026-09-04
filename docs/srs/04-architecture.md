# 04 — System Architecture

## Stack summary

| Layer | Technology | Deployment |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Cloudflare Pages |
| Backend API | Node.js + Express | WSO2 Choreo (fallback: Render) |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) | Supabase-hosted |
| File storage | Cloudflare R2 (S3-compatible) | Cloudflare-hosted, public bucket |
| AI | Google Gemini API | Called server-side from Express |

## System context

Citizens never authenticate directly — reporting and browsing are public. Only "My Reports" (a citizen viewing their own history) and the admin dashboard involve a session.

```mermaid
flowchart LR
    Citizen((Citizen)) -->|browser, no login| FE[React Frontend<br/>Cloudflare Pages]
    Admin((Municipal Admin)) -->|browser, real login| FE
    FE -->|"POST /api/issues (public)<br/>GET /api/issues/public (public)"| API[Express API<br/>Choreo]
    FE -->|"POST /api/my-reports/login { nic }"| API
    FE -->|"Admin: sign in<br/>(Supabase JS client)"| SBAuth[Supabase Auth]
    FE -->|"Reads with RLS<br/>(anon key + session JWT)"| SBDB[(Supabase Postgres)]
    API -->|"verify JWT (My Reports/admin routes)"| SBAuth
    API -->|"find-or-create citizen by NIC<br/>(admin API)"| SBAuth
    API -->|"INSERT / UPDATE / SELECT<br/>(service role key)"| SBDB
    API -->|"upload photo"| R2[(Cloudflare R2 bucket)]
    API -->|"category + description"| Gemini[Gemini API]
    Gemini -->|"priority, department, reason"| API
```

## Why this shape

- **The frontend never writes to Supabase directly.** All inserts/updates go through Express, which uses the Supabase **service role key** — a secret that must never reach the browser. This is also where the R2 upload, the Gemini triage call, and citizen account provisioning happen, so a single `POST /api/issues` produces a fully-formed, AI-triaged row with no separate signup step.
- **Reporting and browsing require no session at all.** `POST /api/issues` and `GET /api/issues/public` are public routes — see [`06-api-specification.md`](06-api-specification.md). This is deliberate: nobody should have to log in to report a pothole or see what's already been reported.
- **A session only exists for "My Reports" and the admin dashboard.** A citizen gets one implicitly, by typing their NIC into `POST /api/my-reports/login`, which signs them in server-side (email + NIC-as-password) and hands back a real Supabase session for the frontend to adopt with `supabase.auth.setSession()`. An admin gets one the normal way, straight from Supabase Auth in the browser.
- **Role checking happens server-side**, in Express, by verifying the caller's Supabase JWT (`supabase.auth.getUser(token)`) and looking up their role in the `profiles` table — never trust a role claim sent from the client.

## Request flow: citizen submits an issue (also functions as signup)

```mermaid
sequenceDiagram
    participant C as Citizen (browser, no session)
    participant API as Express API
    participant Auth as Supabase Auth (admin API)
    participant R2 as Cloudflare R2
    participant AI as Gemini API
    participant DB as Supabase Postgres

    C->>API: POST /api/issues (multipart: nic, email, category, ward, landmark, description, photo)
    API->>API: validate fields (NIC format, email format, description length, ...)
    API->>DB: SELECT profiles WHERE nic = ?
    alt NIC not seen before
        API->>Auth: admin.createUser(email, password = nic, metadata {full_name, nic})
        Auth-->>DB: trigger inserts profiles row (role='citizen')
    end
    alt photo attached
        API->>R2: PUT object
        R2-->>API: public object URL
    end
    API->>AI: category + description
    AI-->>API: {priority, department, reason}
    API->>DB: INSERT INTO civic_issues (citizen_id, ..., ai_priority, ai_department, ai_reason)
    API->>DB: UPDATE profiles SET points = points + 10
    DB-->>API: inserted row
    API-->>C: 201 Created (issue + contributor_points)
```

## Request flow: citizen views "My Reports"

```mermaid
sequenceDiagram
    participant C as Citizen (browser, no session)
    participant API as Express API
    participant Auth as Supabase Auth
    participant DB as Supabase Postgres

    C->>API: POST /api/my-reports/login { nic }
    API->>DB: SELECT profiles WHERE nic = ?
    API->>Auth: admin.getUserById(profile.id) -> email
    API->>Auth: signInWithPassword(email, password = nic)
    Auth-->>API: session {access_token, refresh_token}
    API-->>C: 200 OK { session }
    C->>C: supabase.auth.setSession(session)
    C->>API: GET /api/issues (Authorization: Bearer <access_token>)
    API-->>C: this citizen's own issues + points
```

## Request flow: admin updates status

```mermaid
sequenceDiagram
    participant A as Admin (browser, real session)
    participant API as Express API
    participant DB as Supabase Postgres

    A->>API: PATCH /api/issues/:id/status { status } (JWT)
    API->>API: verify JWT, confirm role = admin
    API->>DB: UPDATE civic_issues SET status = ... WHERE id = ...
    alt status = 'Resolved'
        API->>DB: UPDATE profiles SET points = points + 15 (reporting citizen)
    end
    DB-->>API: updated row
    API-->>A: 200 OK
```

## Deployment topology

```mermaid
flowchart TB
    subgraph Cloudflare
        Pages[Cloudflare Pages<br/>frontend build]
        R2[(R2 bucket<br/>civic-issue-photos)]
    end
    subgraph Choreo
        Backend[Express API]
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
```

## Key decisions & rationale

| Decision | Rationale |
|---|---|
| Reporting (`POST /api/issues`) and browsing (`GET /api/issues/public`) are public routes | Matches how residents actually behave — nobody creates an account before checking if a pothole is already reported |
| The report form doubles as signup (NIC + email, no separate registration screen) | Removes friction; the backend auto-provisions an account on first NIC, reuses it after |
| Password for auto-provisioned accounts = the citizen's own NIC | Lets "My Reports" work with just a NIC typed in, no password ever shown — a deliberate, documented trade-off (see [`05-data-model.md`](05-data-model.md)) |
| Email is still collected (not synthesized) | Supabase Auth requires a real email as the account's login identity; NIC remains the durable identity key regardless |
| Photo upload proxied through Express, not a presigned URL from the browser | Avoids configuring CORS on the R2 bucket and a two-step upload flow — not worth the setup time in a 4-hour build |
| R2 bucket set to public read access | Photos are non-sensitive (public civic issues); a public URL avoids building signed-URL generation for viewing |
| All Supabase writes via service role key in the backend | Centralizes business logic (validation, AI triage, points) in one place, and keeps the write path secure regardless of frontend bugs |
| Role stored in a `profiles` table, not just Supabase Auth metadata | Supabase Auth doesn't natively separate "citizen" vs "admin" — RLS policies need a queryable role column |
| Admin accounts seeded manually, not self-registered | Removes an entire signup/approval flow that isn't needed for a hackathon demo, and avoids an obvious security hole |
| Contribution points tracked as a simple counter, updated in application code | A DB trigger/ledger table would be more "correct" but harder to explain live in the demo Q&A; a counter is enough to prove the concept |
