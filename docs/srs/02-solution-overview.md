# 02 - Solution Overview

## What we're building

**Resolve LK** - a national civic-issue reporting and resolution platform built against Sri Lanka's actual local government hierarchy: **Citizen → Municipal Council (one Municipal Officer account per council) → Province (one Provincial Officer account per province, overseeing every council in it) → System Administrator** (a small internal function, not citizen-facing). The full rationale for this hierarchy is in [`03-governance-and-roles.md`](03-governance-and-roles.md) - read that first if the role names below seem unmotivated.

Reporting and browsing remain **fully public, with no login wall** - this does not change from the original design, and is a deliberate policy, not an oversight (see "What stays frictionless" below). A citizen only ever authenticates to see their *own* report history; municipal and provincial officers have real accounts.

### Browsing (fully public, no account needed)

The public feed is a live, public register of reported issues - category, council, ward, landmark, photo, status, and AI-assigned priority - plus, at the council level, **public SLA-transparency statistics**: % of issues resolved within target, average time to acknowledge/resolve, and current backlog age, by category. This is what replaces the hackathon version's citizen "contribution points" - the accountability is the council's, made visible, not the citizen's, gamified. See [`03-governance-and-roles.md`](03-governance-and-roles.md#public-transparency-replaces-citizen-contribution-points) for why.

### Reporting an issue (public form, still doubles as identity - not as a login)

A citizen fills in one form:

- **NIC (National Identity Card) number** - mandatory, format-validated (old 9-digit+V/X or new 12-digit), unique per citizen record. Establishes *one identity per person*, not *permission to report* - see below.
- **Contact (email and/or phone)** - used only to deliver a one-time code if the citizen later wants to view their history; never a password.
- **Category** - Garbage, Road, Water, Lighting, Drainage, Sewerage, Public Safety, or Other
- **Council** - resolved from the citizen's selected ward/zone, or chosen directly
- **Nearest landmark** - free text
- **Description** - free text, minimum 20 characters
- **Photo** - optional upload

On submit: the backend finds-or-creates a citizen record by NIC (first time → new profile; NIC already known → reuse it), runs the issue through AI triage (priority **and** jurisdiction - see below), computes SLA targets, and inserts the report. No password is ever created for a citizen - there isn't one to create.

### What stays frictionless, and what changed from the hackathon version

- **Submitting a report and browsing the feed require zero verification beyond NIC format** - no OTP, no login, no wait, exactly as before. This is a stated design decision, not a gap: gating report submission behind identity verification would recreate the exact friction ("visit the office, prove who you are") this platform exists to remove. The known trade-off - a fabricated but format-valid NIC can submit a report - is accepted, the same way a paper complaint register is never identity-checked today.
- **What changed:** the hackathon version set a citizen's account password to their own NIC, so "My Reports" could work with just a NIC typed in. That was flagged at the time as a real security hole, since NIC numbers are semi-public in Sri Lanka. v1 replaces it with **NIC + one-time code (OTP)**: a citizen types their NIC, receives a 6-digit code at the email/phone on file, and enters it to view their history. No citizen password exists anywhere in the system. Full flow in [`05-architecture.md`](05-architecture.md).

### AI auto-triage - priority *and* jurisdiction

When a citizen submits a report, the backend sends the category, description, and council to the Gemini API, which now returns two judgments instead of one:

```json
{
  "priority": "Critical",
  "jurisdiction": "in_council",
  "redirect_authority": null,
  "department": "Public Health",
  "reason": "Standing water and garbage near a residential zone is a dengue breeding risk requiring immediate clearance."
}
```

or, for an issue that isn't actually the council's job:

```json
{
  "priority": "Medium",
  "jurisdiction": "redirect",
  "redirect_authority": "NWSDB",
  "department": null,
  "reason": "Reported as a burst pipe on the main water line - this is operated by the National Water Supply and Drainage Board, not the Municipal Council."
}
```

The jurisdiction table AI triage is grounded against (which categories are genuinely council business vs. NWSDB/RDA/CEB/Police) is documented in [`03-governance-and-roles.md`](03-governance-and-roles.md#category--responsible-authority-jurisdiction) - this is a real distinction municipal councils have to make constantly, and getting it right is what keeps a council's SLA metrics meaningful instead of cluttered with complaints they can't act on. A redirected issue is still recorded and still shown to the citizen with the correct authority named - Resolve LK stays one front door even when the fix isn't the council's to make.

### Status workflow (real pipeline, not a flat three-state toggle)

`Submitted → Acknowledged → In Progress → Resolved → Verified`, with a `Reopened` path if a citizen disputes a `Resolved` status. Every transition is written to an audit trail (`issue_status_history`). Full detail and the SLA-target table (which sets the acknowledge/resolve deadlines per priority) are in [`03-governance-and-roles.md`](03-governance-and-roles.md#status-pipeline).

### Municipal Officer (the one real login per council)

Represents the Municipal Commissioner's office (see [`03-governance-and-roles.md`](03-governance-and-roles.md#who-actually-runs-a-municipal-council) for why). Logs in with a real email/password account, provisioned by their province's Provincial Officer - never self-registered. Sees every issue assigned to their council, filterable/searchable, and moves issues through the status pipeline. A council's Municipal Officer cannot see or act on another council's issues - enforced by `council_id` scoping at the database (RLS) and application layer.

### Provincial Officer (the position above Municipal Councils)

Represents the Commissioner of Local Government for that province. Provisioned by a System Administrator. Sees an aggregated, cross-council view for every council in their province: SLA-compliance stats per council, and an **escalation queue** - issues that breached their acknowledgment or resolution SLA, or were reopened more than once. The Provincial Officer cannot directly change an issue's status (accountability for the fix stays with the council that owns it) but can see backlog patterns and contact a council directly - the structured version of the "informal escalation through political channels" that's the *only* mechanism that exists today.

## Why this solution

- The hierarchy isn't invented for the app - it mirrors how Sri Lankan local government is actually structured (Municipal Council → Province → Ministry), so accountability in the app maps onto accountability that already exists on paper, instead of asking councils to adopt a foreign organizational model.
- Keeping reporting and browsing frictionless matches how residents actually behave - nobody should have to prove their identity before reporting a pothole - while fixing the one part of the original design (NIC-as-password) that was a genuine, previously-flagged security gap.
- Jurisdiction-aware triage is the difference between "a form and a feed" and something a real Municipal Commissioner's office would trust - it does the same judgment call an experienced officer makes on sight (is this even ours to fix?), at submission time, for every report.
- SLA-based transparency replaces gamification with actual civic accountability - the number that matters publicly is whether the council is meeting its own targets, not how many points a citizen collected.
- A provincial oversight layer closes the loop the current paper-based process has no equivalent for at all: today, a chronically unresponsive council has no structured signal reaching anyone above it.

## Expected impact

- Residents get a two-minute way to report an issue, immediately see it join a public, tracked, SLA-timed queue, and can confirm (or dispute) that a fix actually happened.
- Councils get a live, jurisdiction-clean, prioritized backlog instead of a paper file - and a public number that reflects genuinely good work when it happens.
- Provinces get the oversight signal that currently doesn't exist in any structured form - chronic backlog in a specific council becomes visible before it becomes a news story.
- Urgent public-health-adjacent issues (standing water, garbage near residential zones) are auto-flagged and SLA-timed instead of waiting for manual review or getting lost between a council and whichever external authority actually owns the fix.
