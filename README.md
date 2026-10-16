# Resolve LK

**A civic-issue reporting and resolution platform built for real Sri Lankan Municipal Councils.**

Originated as a 4-hour supervised hackathon build for SE3090 - Software Engineering Frameworks, Assignment 2 (Mini Hackathon), SLIIT, September 2026 - and has since been redesigned against Sri Lanka's actual local government hierarchy (Municipal Council → Province → Ministry), rather than a flat "citizen reports, one admin resolves" hackathon model. See [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md) for the research behind that hierarchy.

---

## 1. The Problem

Sri Lanka has 341 local authorities across 9 provinces, each responsible for everyday civic issues - garbage collection, road maintenance, drainage, street lighting. Reporting one today means physically visiting a council office, filing a written complaint with no reference number, and hoping it reaches the right person - and there is no unified digital system, at any level, for tracking what's pending, what's in progress, or what's resolved. Nothing above a council sees this either: a chronically unresponsive council has no structured signal reaching the provincial oversight layer responsible for it.

See [`docs/srs/01-problem-statement.md`](docs/srs/01-problem-statement.md) for the full write-up.

## 2. The Solution

**Resolve LK** models the real chain of accountability - Citizen → Municipal Council → Province - instead of a flat citizen/admin split:

- **Anyone** can browse the public feed of reported issues, including each council's public SLA-compliance stats - no account needed.
- **Citizens** report an issue (NIC, contact, category, council, landmark, description, optional photo) directly from the landing page - no login wall, no verification gate, exactly as frictionless as before. A lightweight "My Reports" page (NIC + a one-time code sent by email - never a password) shows their own history and lets them confirm or dispute a resolution.
- **Municipal Officers** - one real login per council, representing the Municipal Commissioner's office - triage and resolve that council's issues only.
- **Provincial Officers** - one real login per province, representing the Commissioner of Local Government - oversee every council in their province and see an escalation queue of issues that breached their SLA target.
- An **AI auto-triage feature** reads each report and returns both a priority (`Low`/`Medium`/`High`/`Critical`) **and** a jurisdiction check - flagging when an issue actually belongs to NWSDB, RDA, CEB, or the Police instead of the council.

Full detail: [`docs/srs/02-solution-overview.md`](docs/srs/02-solution-overview.md)
Scope boundaries (v1 vs. documented future phases): [`docs/srs/04-scope-and-boundaries.md`](docs/srs/04-scope-and-boundaries.md)

## 3. Main Features

1. Landing page explaining the problem, with a public, no-login feed of reported issues and public SLA-transparency stats per council.
2. Public report form - no login wall, no identity verification. NIC (unique, durable identity) + contact info; first-time NIC auto-creates an account with **no password**.
3. Photo upload to Cloudflare R2.
4. NIC + one-time-code "My Reports" access - never a password field for citizens.
5. Municipal Officer dashboard (real login, council-scoped): searchable, filterable table/board of that council's issues.
6. Provincial Officer dashboard (real login, province-scoped): cross-council SLA comparison and an escalation queue.
7. Real status workflow (`Submitted → Acknowledged → In Progress → Resolved → Verified`, with `Reopened`) and a full audit trail.
8. AI auto-triage: priority + jurisdiction + department + reason, generated per submission via the Gemini API.
9. Responsive layout - usable on both desktop and mobile, across all three account types.
10. Role- and scope-based access via Supabase Auth + Row Level Security (council/province boundaries enforced at the database layer).

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Frontend hosting | Cloudflare Pages |
| Backend API | Node.js + Express |
| Backend hosting | WSO2 Choreo *(fallback: Render, if Choreo setup blocks the build)* |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) |
| File storage | Cloudflare R2 (S3-compatible object storage) |
| AI | Google Gemini API (auto-triage of civic reports) |

Governance & role hierarchy (read this first): [`docs/srs/03-governance-and-roles.md`](docs/srs/03-governance-and-roles.md)
Architecture detail: [`docs/srs/05-architecture.md`](docs/srs/05-architecture.md)
Data model & RLS policies: [`docs/srs/06-data-model.md`](docs/srs/06-data-model.md)
API spec: [`docs/srs/07-api-specification.md`](docs/srs/07-api-specification.md)

## 5. AI Tools Used

> Fill in during/after the build. One line per tool, per the assignment's declaration requirement.

- **[Tool name]** - used for _______. Output reviewed/modified by _______.
- **[Tool name]** - used for _______. Output reviewed/modified by _______.

Full prompt log (mandatory submission artifact): [`docs/ai-prompt-log.md`](docs/ai-prompt-log.md)

## 6. Team & Contributions

| Member | Student ID | Area | Contribution summary |
|---|---|---|---|
| Seneja Thehansi | [ID] | Citizen Experience (landing, public feed, report form, NIC+OTP My Reports) | _______ |
| Jayashan Guruge | [ID] | Municipal + Provincial Officer Dashboards | _______ |
| Bhanuka Samarasinghe | [ID] | Data & Storage Architecture (schema, RLS, R2) | _______ |
| Hasitha Erandika | [ID] | Backend, AI Triage & SLA Engine | _______ |

Full role breakdown: [`docs/srs/08-team-allocation.md`](docs/srs/08-team-allocation.md)

## 7. Installation & Local Execution

```bash
# Frontend
cd frontend
cp .env.example .env.local   # fill in Supabase URL/anon key + API base URL
npm install
npm run dev

# Backend
cd backend
cp .env.example .env         # fill in Supabase keys, R2 keys, Gemini API key
npm install
npm run dev
```

Environment variables required are documented in [`CLAUDE.md`](CLAUDE.md#environment-variables).

## 8. Links (fill in before submission)

- **Git repository:** _______
- **Deployed application (frontend):** _______
- **Deployed API (backend):** _______
- **2-minute demonstration video:** _______

## 9. AI Usage Declaration

This team used AI tools during the hackathon as permitted under the SE3090 Assignment 2 CLEAR framework. See Section 5 above and the full log at [`docs/ai-prompt-log.md`](docs/ai-prompt-log.md). Every team member can explain any part of the submitted code on request.

## 10. Project Documentation Index

- [`PLAN.md`](PLAN.md) - execution plan (original 4-hour hackathon session + the redesign roadmap)
- [`PROGRESS.md`](PROGRESS.md) - live per-member task tracker (currently tracks the prior hackathon-scoped build - see the note at its top)
- [`CLAUDE.md`](CLAUDE.md) - project context for AI-assisted development
- [`docs/srs/`](docs/srs/) - problem statement, solution overview, governance & roles, scope, architecture, data model, API spec, team allocation, requirements traceability
- [`docs/ai-prompt-log.md`](docs/ai-prompt-log.md) - AI prompt log template
