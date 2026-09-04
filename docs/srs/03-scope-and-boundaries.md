# 03 — Scope & Boundaries

Four hours is not enough time for scope creep. This document is the contract the whole team holds each other to — if it's not listed under "In Scope," it doesn't get built, no matter how good the idea sounds at minute 90.

## In scope

- **Supabase Auth**, two identity paths: auto-provisioned citizen accounts (via NIC, no visible signup) and manually seeded admin accounts, distinguished via a `profiles` table (see [`05-data-model.md`](05-data-model.md)).
- **Cloudflare R2** for photo storage — real uploads, not placeholders.
- **Express backend**, handling all writes to Supabase and the Gemini API call for AI triage.
- **AI auto-triage**: category + description → priority, department, reason, via the Gemini API.
- Public, no-login issue-submission form (NIC field doubles as identity, auto-provisioning an account).
- Public, no-login issue feed on the landing page.
- Lightweight "My Reports" page (citizen enters NIC to see their own history and points).
- Contribution points: +10 per report, +15 bonus when an admin marks it Resolved.
- Admin dashboard with real login, search, filter, and status update (`Pending → In Progress → Resolved`).
- Responsive layout for both roles.
- Seeded sample data so the app doesn't look empty in the demo.

## Explicitly out of scope

| Cut | Why | What we do instead |
|---|---|---|
| Real GPS / Google Maps integration | Maps API setup, key restrictions, and map UI are a time sink with low marginal value over a dropdown | A "Ward/Zone" dropdown + a free-text "Nearest Landmark" field |
| Native mobile app (React Native, etc.) | Separate toolchain, separate build/deploy pipeline — no time | A responsive web app (Vite + Tailwind) that works well on mobile browsers |
| A third "worker" app for field crews | A third full app is a whole extra frontend + auth flow | The admin is assumed to handle dispatch outside the app (e.g. a phone call); out of scope for this build |
| Admin self-registration | Letting anyone sign up as an admin is both a security hole and unnecessary scope | Admin accounts are seeded manually in Supabase by Bhanuka Samarasinghe before the demo |
| Presigned direct-to-R2 uploads from the browser | Requires CORS configuration on the R2 bucket and a two-step upload flow — real but avoidable complexity | The photo is uploaded to the Express backend as part of the same request that creates the issue; the backend forwards it to R2 |
| A traditional signup/login screen for citizens | Adds friction the theme doesn't need — nobody should have to register before reporting a pothole | The report form's NIC field doubles as identity; an account is auto-provisioned behind the scenes on first use (see [`02-solution-overview.md`](02-solution-overview.md)) |
| Verifying the NIC-derived password against a "real" auth flow (OTP, email verification, etc.) | Out of scope for a 4-hour build, and there's no email to verify in the first place | Password = NIC, known only to the citizen (and, as a stated trade-off, to anyone else who knows their NIC) — acceptable for this demo, flagged as a production hardening gap |
| SMS/email notifications on status change | A whole separate integration (Twilio/SES/etc.) | Citizens check status by logging in; can be a stated future improvement in the demo |
| Multi-language (Sinhala/Tamil) UI | Real i18n takes real time | English UI for the hackathon; note as a clear next step in the demo — it matters for real-world adoption, just not buildable in 4 hours |
| Verifying NIC against a government registry (DRP) | No public API exists for this; not buildable at all in 4 hours regardless of time budget | Validate NIC **format** (old/new pattern) and **uniqueness within our own database** only — state this limitation plainly if asked |
| Encrypting the NIC column at rest / masking it in the UI | Real hardening work, not needed to prove the concept | Stored as plain text for the hackathon; call this out as a known production gap in the Q&A — it shows awareness without costing build time |

## Definition of done

The build is "done" when all ten minimum software requirements from the assignment brief are met and demonstrably working on the **deployed** app, not just locally. See the checklist in [`PLAN.md`](../../PLAN.md) and the full mapping in [`08-requirements-traceability.md`](08-requirements-traceability.md).
