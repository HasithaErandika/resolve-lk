# 08 - Team Allocation

4 members, 4 ownership areas - carried forward from the original hackathon build, now scoped to the redesigned system rather than a 4-hour session. This is a division of primary ownership, not a wall between people; the role hierarchy in [`03-governance-and-roles.md`](03-governance-and-roles.md) adds real surface area to every area below.

| Area | Owner | Now additionally covers |
|---|---|---|
| Citizen Experience | Seneja Thehansi | NIC + OTP "My Reports" flow (replaces the old NIC-only login), public SLA-transparency stats display |
| Officer Dashboards (Municipal + Provincial) | Jayashan Guruge | Two scoped dashboards instead of one flat admin view; the Provincial Officer's cross-council escalation queue and officer-provisioning UI |
| Data & Storage Architecture | Bhanuka Samarasinghe | The full schema redesign: `provinces`, `councils`, extended `profiles` role/scope model, `issue_status_history`, RLS for council/province scoping |
| Backend & AI Integration | Hasitha Erandika | Jurisdiction-aware AI triage, the SLA engine + scheduled escalation job, OTP request/verify endpoints, officer-provisioning endpoints |

## Seneja Thehansi - Citizen Experience

Citizens still never see a dashboard or a password field. The form is still the only thing they interact with directly, plus the OTP handshake.

- Landing page, including the in-app problem explanation (now grounded in [`01-problem-statement.md`](01-problem-statement.md)'s real hierarchy/jurisdiction framing, not a generic "report anything" pitch).
- Public issue feed - pulls from `GET /api/issues/public`, now including a council's public SLA-transparency numbers (`GET /api/councils/stats`) instead of a points display.
- Report form: NIC (format-validated) + contact email/phone + category + **council picker** (new - replaces a flat ward text field) + landmark + description + optional photo.
- **"My Reports" rebuilt around OTP**: NIC input → `POST /api/my-reports/otp/request` → a code-entry screen → `POST /api/my-reports/otp/verify` → adopt the returned session with `supabase.auth.setSession()`. No password field, ever - see [`03-governance-and-roles.md`](03-governance-and-roles.md#citizen-identity-what-stays-frictionless-and-what-changed) for why this replaced the old NIC-as-password flow.
- On a `Resolved` issue in "My Reports," surface the confirm/dispute action (`PATCH /api/issues/:id/status` → `Verified` or `Reopened`) - this is the citizen half of the new status pipeline, and didn't exist in the hackathon version at all.

## Jayashan Guruge - Officer Dashboards

Two real logins now instead of one flat "admin" - see [`03-governance-and-roles.md`](03-governance-and-roles.md) for what each represents.

- **Municipal Officer dashboard**: table/board of that council's issues only (`GET /api/issues`, scoped server-side), search + category/status filter, status-update control walking the real pipeline (`Submitted → Acknowledged → In Progress → Resolved`), jurisdiction-redirected issues shown in a clearly separate, non-actionable section rather than mixed into the working queue.
- **Provincial Officer dashboard**: cross-council comparison view (SLA-compliance % per council, per category), the escalation queue (`GET /api/provincial/escalations`), and the Municipal-Officer-provisioning form (`POST /api/provincial/municipal-officers`) - this is new: officer accounts are provisioned through the app now, not a manual SQL flip.
- Surface AI priority **and jurisdiction** clearly - a redirected issue should visually read as "not this council's job," not just a lower-priority version of a real one.

## Bhanuka Samarasinghe - Data & Storage Architecture

The schema itself carries most of the redesign's real complexity.

- Design and run the migrations for `provinces`, `councils`, the extended `profiles` (role/council_id/province_id, the `role_scope_matches` constraint), `civic_issues` (council_id, jurisdiction fields, SLA timestamps, `reopened_count`, `escalated`), `issue_status_history` - see [`06-data-model.md`](06-data-model.md) for full DDL. Citizen OTP rides on Supabase Auth's own passwordless email flow, no new table needed.
- Write and verify RLS policies for council-scoped and province-scoped access - this is where "a Municipal Officer literally cannot query another council's rows" gets enforced at the database layer, not just trusted to application code.
- Seed realistic data: a working subset of real, named provinces/councils, sample citizens, and issues spanning every status in the pipeline including at least one `Reopened` and one `escalated` row.
- Create and configure the Cloudflare R2 bucket - unchanged from the original setup.

## Hasitha Erandika - Backend & AI Integration

- Extend `services/triageService.js` so Gemini returns jurisdiction (`in_council` / `redirect` + authority) alongside priority, validated against the table in [`03-governance-and-roles.md`](03-governance-and-roles.md) before being trusted.
- Build `services/slaService.js` (priority → due-date computation) and the scheduled escalation job.
- Build the OTP flow end to end: `services/otpService.js` (generate/hash/verify), `POST /api/my-reports/otp/request` and `/verify`.
- Build the officer-provisioning endpoints (`POST /api/provincial/municipal-officers`, `POST /api/admin/provincial-officers`), including the province/council scope checks that make cross-scope provisioning impossible.
- Extend `requireAuth`/`attachProfile` into the fuller `requireRole` + `scopeToCouncil`/`scopeToProvince` middleware described in [`05-architecture.md`](05-architecture.md).
- Full status-pipeline transition validation (`Submitted → ... → Verified`, plus `Reopened`), replacing the old flat three-state `PATCH`.
- Deploy backend to Choreo (fallback: Render) - unchanged.

## Contribution & documentation practice (unchanged)

- Every member commits to the repo under their own account.
- Every significant AI-generated chunk of code is logged in `docs/ai-prompt-log.md` as it happens.
- Every team member should be able to explain the real-world reasoning behind any role/scope check they touched, not just what the code does - the "why" lives in [`03-governance-and-roles.md`](03-governance-and-roles.md).
