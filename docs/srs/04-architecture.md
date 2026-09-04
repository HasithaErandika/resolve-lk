# 04 — System Architecture

## Stack summary

| Layer | Technology | Deployment |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Cloudflare Pages |
| Backend API | Node.js + Express | WSO2 Choreo (fallback: Render) |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) | Supabase-hosted |
| File storage | Cloudflare R2 (S3-compatible) | Cloudflare-hosted, public bucket |
| AI | Anthropic Claude API | Called server-side from Express |

## System context

```mermaid
flowchart LR
    Citizen((Citizen)) -->|browser| FE[React Frontend<br/>Cloudflare Pages]
    Admin((Municipal Admin)) -->|browser| FE
    FE -->|"Auth: sign up / log in<br/>(Supabase JS client)"| SBAuth[Supabase Auth]
    FE -->|"Reads: SELECT with RLS<br/>(anon key + user JWT)"| SBDB[(Supabase Postgres)]
    FE -->|"Writes: POST /api/issues<br/>PATCH /api/issues/:id/status<br/>(with user JWT)"| API[Express API<br/>Choreo]
    API -->|"verify JWT, check role"| SBAuth
    API -->|"INSERT / UPDATE<br/>(service role key)"| SBDB
    API -->|"upload photo"| R2[(Cloudflare R2 bucket)]
    API -->|"category + description"| Claude[Claude API]
    Claude -->|"priority, department, reason"| API
```

## Why this shape

- **The frontend never writes to Supabase directly.** All inserts/updates go through Express, which uses the Supabase **service role key** — a secret that must never reach the browser. This is also where the R2 upload and the Claude triage call happen, so a single `POST /api/issues` produces a fully-formed, AI-triaged row.
- **The frontend can read directly from Supabase** using the anon key and the logged-in user's JWT, relying on Row Level Security to scope what each role can see (citizens see their own issues; admins see all). This is optional — the admin dashboard may instead call `GET /api/issues` on the backend for a single consistent data path. Pick one per feature and stay consistent; don't mix both for the same screen.
- **Role checking happens server-side**, in Express, by verifying the caller's Supabase JWT (`supabase.auth.getUser(token)`) and looking up their role in the `profiles` table — never trust a role claim sent from the client.

## Request flow: citizen submits an issue

```mermaid
sequenceDiagram
    participant C as Citizen (browser)
    participant API as Express API
    participant R2 as Cloudflare R2
    participant AI as Claude API
    participant DB as Supabase Postgres

    C->>API: POST /api/issues (multipart: category, ward, landmark, description, photo, JWT)
    API->>API: verify JWT, validate fields
    alt photo attached
        API->>R2: PUT object
        R2-->>API: public object URL
    end
    API->>AI: category + description
    AI-->>API: {priority, department, reason}
    API->>DB: INSERT INTO civic_issues (..., photo_url, ai_priority, ai_department, ai_reason)
    DB-->>API: inserted row
    API-->>C: 201 Created (issue summary)
```

## Request flow: admin updates status

```mermaid
sequenceDiagram
    participant A as Admin (browser)
    participant API as Express API
    participant DB as Supabase Postgres

    A->>API: PATCH /api/issues/:id/status { status } (JWT)
    API->>API: verify JWT, confirm role = admin
    API->>DB: UPDATE civic_issues SET status = ... WHERE id = ...
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
    Backend -->|HTTPS| ClaudeAPI[Claude API]
```

## Key decisions & rationale

| Decision | Rationale |
|---|---|
| Photo upload proxied through Express, not a presigned URL from the browser | Avoids configuring CORS on the R2 bucket and a two-step upload flow — not worth the setup time in a 4-hour build |
| R2 bucket set to public read access | Photos are non-sensitive (public civic issues); a public URL avoids building signed-URL generation for viewing |
| All Supabase writes via service role key in the backend | Centralizes business logic (validation, AI triage) in one place, and keeps the write path secure regardless of frontend bugs |
| Role stored in a `profiles` table, not just Supabase Auth metadata | Supabase Auth doesn't natively separate "citizen" vs "admin" — RLS policies need a queryable role column |
| Admin accounts seeded manually, not self-registered | Removes an entire signup/approval flow that isn't needed for a hackathon demo, and avoids an obvious security hole |
