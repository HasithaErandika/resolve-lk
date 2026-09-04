# 02 — Solution Overview

## What we're building

**Resolve LK** — a two-sided web application connecting citizens and municipal admins around civic issue reports.

### Citizen side

A citizen creates an account using their **National Identity Card (NIC) number** as a unique identifier — this ties reports to a real, verifiable person and stops one citizen from spamming the queue with duplicate accounts, matching the accountability a paper complaint at a council office already implies. Once registered, they log in and submit a report:

- **Category** — Garbage, Road, Water, or Lighting
- **Ward/Zone** — selected from a dropdown (e.g. Colombo 03, Kandy Central, Dehiwala)
- **Nearest landmark** — free text
- **Description** — free text, minimum 20 characters
- **Photo** — optional upload

On submit, the report is saved and the citizen can see its status change over time (`Pending → In Progress → Resolved`).

### Admin side

A municipal admin logs into a separate dashboard showing every submitted issue as a searchable, filterable table (or Kanban-style board). The admin can:

- Filter by category and search by keyword
- See the AI-assigned priority and suggested department for each issue
- Move an issue through `Pending → In Progress → Resolved`

### The AI feature — Auto-Triage

When a citizen submits a report, the backend sends the category and description to the Claude API, which acts as a triage assistant and returns a structured assessment:

```json
{
  "priority": "Critical",
  "department": "Public Health",
  "reason": "Standing water and garbage near a residential zone is a dengue breeding risk requiring immediate clearance."
}
```

This is stored alongside the report and surfaced on the admin dashboard — critical issues are visually flagged, so urgent public-health or safety risks don't sit in a queue behind routine ones.

## Why this solution

- It replaces an entirely offline, untracked process with a system that gives citizens visibility and gives councils a queue they can actually manage.
- The AI triage step is the genuine value-add beyond "a form and a table" — it approximates the judgment a municipal engineer would apply manually, at submission time, so nothing urgent waits for a human to notice it.
- It is deliberately scoped to be buildable, deployable, and demonstrable within 4 hours by a team of 4 — see [`03-scope-and-boundaries.md`](03-scope-and-boundaries.md) for what was cut and why.

## Expected impact

- Residents get a two-minute way to report an issue instead of a trip to a council office.
- Councils get a live, prioritized backlog instead of a paper file.
- Urgent public-health-adjacent issues (standing water, garbage near residential zones) get surfaced automatically instead of waiting for manual review.
