# 02 — Solution Overview

## What we're building

**Resolve LK** — a public civic-issue feed and reporting tool. Deliberately **no login wall** for the core citizen actions: browsing what's been reported, and reporting something new. A login only ever appears for (a) a citizen who wants to see their *own* report history, and (b) municipal admins.

### Browsing (fully public, no account needed)

The landing page shows a live, public feed of reported issues — like a public noticeboard: category, ward, landmark, photo, status, and the AI-assigned priority. Anyone can see what's been reported and what's being done about it, without signing up for anything.

### Reporting an issue (public form — this IS the signup)

There is no separate "create an account" step. A citizen fills in one form, directly from the landing page:

- **NIC (National Identity Card) number** — mandatory. This is the one field that establishes identity.
- **Category** — Garbage, Road, Water, or Lighting
- **Ward/Zone** — dropdown (e.g. Colombo 03, Kandy Central, Dehiwala)
- **Nearest landmark** — free text
- **Description** — free text, minimum 20 characters
- **Photo** — optional upload

On submit, the backend checks whether an account already exists for that NIC:

- **First time this NIC has been seen** → an account is auto-provisioned behind the scenes (email `<nic>@resolvelk.local`, password = the NIC itself — the citizen never sees or sets a password).
- **NIC already known** → the existing account is reused.

Either way, the report is saved against that citizen's identity, and they earn **contribution points** for reporting (see below). The whole interaction feels like posting a listing — fill in the form, submit, done — not like registering for a service.

### Seeing your own reports ("My Reports" — optional, lightweight)

A citizen who wants to see their report history (what they've filed, what's resolved, their points) types in their NIC on a "My Reports" page. Under the hood, the frontend signs them in via Supabase Auth using that same NIC-as-password convention — the citizen never sees a traditional login form, just one field. This is opt-in and never required to report or browse.

### Contribution points (gamification)

Every profile carries a running `points` total:

- **+10** for submitting a report
- **+15** bonus when an admin marks that report `Resolved`

This rewards citizens who report real, actionable issues (a report that never gets resolved earns no bonus), and gives "My Reports" a reason to come back to.

### Admin side (the one real login in the app)

Municipal admins have actual accounts (seeded manually — see [`05-data-model.md`](05-data-model.md)) and log in through a normal email/password form, completely separate from the citizen NIC flow. They land on a dashboard listing every submitted issue, searchable and filterable, and can move an issue through `Pending → In Progress → Resolved`.

### The AI feature — Auto-Triage

When a citizen submits a report, the backend sends the category and description to the Gemini API, which acts as a triage assistant and returns a structured assessment:

```json
{
  "priority": "Critical",
  "department": "Public Health",
  "reason": "Standing water and garbage near a residential zone is a dengue breeding risk requiring immediate clearance."
}
```

This is stored alongside the report and surfaced on both the public feed and the admin dashboard — critical issues are visually flagged, so urgent public-health or safety risks don't sit in a queue behind routine ones.

## Why this solution

- Removing the login wall for reporting and browsing matches how residents actually behave — nobody creates an account before checking if a pothole is already reported.
- Folding signup into the report form (via NIC) keeps identity and accountability — every report is still tied to a real person — without ever showing a registration screen.
- The AI triage step is the genuine value-add beyond "a form and a feed" — it approximates the judgment a municipal engineer would apply manually, at submission time.
- The points system gives citizens a reason to report accurately and to come back, without requiring any engagement infrastructure beyond a counter on their profile.
- It is deliberately scoped to be buildable, deployable, and demonstrable within 4 hours by a team of 4 — see [`03-scope-and-boundaries.md`](03-scope-and-boundaries.md) for what was cut and why, including the known trade-off of using NIC-as-password.

## Expected impact

- Residents get a two-minute way to report an issue — no account creation, no password to remember — and can immediately see it's part of a public, tracked queue.
- Councils get a live, prioritized backlog instead of a paper file.
- Urgent public-health-adjacent issues (standing water, garbage near residential zones) get surfaced automatically instead of waiting for manual review.
- The points system creates a light feedback loop that rewards citizens whose reports actually get fixed.
