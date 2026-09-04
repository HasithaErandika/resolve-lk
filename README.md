# Resolve LK

**A digital civic-issue reporting and resolution pipeline for Sri Lankan local councils.**

Built in a 4-hour supervised hackathon session for SE3090 — Software Engineering Frameworks, Assignment 2 (Mini Hackathon), SLIIT, September 2026.

---

## 1. The Problem

Citizens across Sri Lanka encounter everyday civic issues — illegal garbage dumping, broken streetlights, hazardous potholes, burst water pipes, and blocked drains that become dengue-breeding sites — but have no reliable way to report them. The current process means physically visiting a Pradeshiya Sabha / Municipal Council office, writing a letter, and hoping it reaches the right person. There is no tracking, no transparency, and local councils have no digital record of what's pending, what's in progress, or what's resolved.

See [`docs/srs/01-problem-statement.md`](docs/srs/01-problem-statement.md) for the full write-up.

## 2. The Solution

**Resolve LK** is a public civic-issue feed and reporting tool — no login wall for the core citizen actions:

- **Anyone** can browse the public feed of reported issues — no account needed.
- **Citizens** report an issue (NIC, email, category, ward/zone, landmark, description, optional photo) directly from the landing page — the form itself doubles as signup: a first-time NIC auto-creates an account behind the scenes, no separate registration screen. Citizens earn contribution points for reports, with a bonus when one gets resolved. A lightweight "My Reports" page (just type your NIC) shows their own history.
- **Municipal Admins** log in for real to a dashboard that lists every reported issue, searchable and filterable, and can move issues through `Pending → In Progress → Resolved`.
- An **AI auto-triage feature** reads each report's category and description and assigns a priority (`Low` / `Medium` / `Critical`) plus a suggested department, so urgent public-health or safety issues surface first.

Full detail: [`docs/srs/02-solution-overview.md`](docs/srs/02-solution-overview.md)
Scope boundaries (what we deliberately did NOT build, and why): [`docs/srs/03-scope-and-boundaries.md`](docs/srs/03-scope-and-boundaries.md)

## 3. Main Features

1. Landing page explaining the problem, with a public, no-login feed of reported issues.
2. Public report form — no login wall. NIC (unique identity) + email double as signup; first-time NIC auto-creates an account.
3. Photo upload to Cloudflare R2.
4. Contribution points: +10 per report, +15 bonus when an admin marks it Resolved.
5. Lightweight "My Reports" page — a citizen types just their NIC to see their own history and points.
6. Admin dashboard (real login): searchable, filterable table/board of all issues.
7. Status workflow (`Pending → In Progress → Resolved`) with audit timestamp.
8. AI auto-triage: priority + department + reason, generated per submission via the Gemini API.
9. Responsive layout — usable on both desktop and mobile.
10. Role-based access via Supabase Auth + Row Level Security.

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

Architecture detail: [`docs/srs/04-architecture.md`](docs/srs/04-architecture.md)
Data model & RLS policies: [`docs/srs/05-data-model.md`](docs/srs/05-data-model.md)
API spec: [`docs/srs/06-api-specification.md`](docs/srs/06-api-specification.md)

## 5. AI Tools Used

> Fill in during/after the build. One line per tool, per the assignment's declaration requirement.

- **[Tool name]** — used for _______. Output reviewed/modified by _______.
- **[Tool name]** — used for _______. Output reviewed/modified by _______.

Full prompt log (mandatory submission artifact): [`docs/ai-prompt-log.md`](docs/ai-prompt-log.md)

## 6. Team & Contributions

| Member | Student ID | Area | Contribution summary |
|---|---|---|---|
| Seneja Thehansi | [ID] | Citizen Experience (landing, public feed, report form, My Reports) | _______ |
| Jayashan Guruge | [ID] | Admin Dashboard | _______ |
| Bhanuka Samarasinghe | [ID] | Supabase & Storage Architect | _______ |
| Hasitha Erandika | [ID] | Backend & AI Integration | _______ |

Full role breakdown and schedule: [`docs/srs/07-team-allocation.md`](docs/srs/07-team-allocation.md)

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

- [`PLAN.md`](PLAN.md) — 4-hour execution plan, checklist, submission checklist
- [`PROGRESS.md`](PROGRESS.md) — live per-member task tracker
- [`CLAUDE.md`](CLAUDE.md) — project context for AI-assisted development
- [`docs/srs/`](docs/srs/) — problem statement, solution, scope, architecture, data model, API spec, team allocation, requirements traceability
- [`docs/ai-prompt-log.md`](docs/ai-prompt-log.md) — AI prompt log template
