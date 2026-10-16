# 09 - Requirements Traceability

Maps the v1 definition of done ([`04-scope-and-boundaries.md`](04-scope-and-boundaries.md#definition-of-done-v1)) to what implements it and who owns it. Use this to confirm nothing is missing before calling v1 complete.

| # | Requirement | How Resolve LK meets it | Owner |
|---|---|---|---|
| 1 | Full role hierarchy enforced end-to-end | `profiles.role` + `council_id`/`province_id` scope, checked server-side (`requireRole`, `scopeToCouncil`/`scopeToProvince`) and backed by RLS - see [`05-architecture.md`](05-architecture.md), [`06-data-model.md`](06-data-model.md) | Hasitha Erandika, Bhanuka Samarasinghe |
| 2 | Municipal Officer cannot see another council's issues | RLS policy `municipal_officers_select_own_council` + application-layer scoping | Bhanuka Samarasinghe, Hasitha Erandika |
| 3 | Provincial Officer cannot directly alter issue status | No `PATCH /api/issues/:id/status` grant for `provincial_officer` role - read/escalation-queue access only | Hasitha Erandika |
| 4 | No officer role self-registers | Provisioning only via `POST /api/admin/provincial-officers` (System Admin) and `POST /api/provincial/municipal-officers` (Provincial Officer, own province only) | Hasitha Erandika |
| 5 | Citizens never have a password | `auth.users` created with no credential; access exclusively via NIC + OTP (`/api/my-reports/otp/*`) | Hasitha Erandika |
| 6 | Reporting and browsing remain fully public and unverified | `POST /api/issues` and `GET /api/issues/public` require no auth header; NIC validated by format only | Hasitha Erandika |
| 7 | AI triage returns both priority and jurisdiction | `services/triageService.js` requests `{priority, jurisdiction, redirect_authority, department, reason}`, validated against the table in [`03-governance-and-roles.md`](03-governance-and-roles.md) | Hasitha Erandika |
| 8 | Redirected (out-of-jurisdiction) issues excluded from a council's SLA metrics | `council_sla_stats` view filters `ai_jurisdiction = 'in_council'` | Bhanuka Samarasinghe |
| 9 | SLA targets computed and breaches surface to the Provincial Officer | `sla_ack_due_at`/`sla_resolve_due_at` computed at submission; scheduled job sets `escalated = true`; `GET /api/provincial/escalations` | Hasitha Erandika |
| 10 | Full status pipeline with audit trail | `Submitted → Acknowledged → In Progress → Resolved → Verified`, `Reopened` path, every transition written to `issue_status_history` | Hasitha Erandika, Bhanuka Samarasinghe |
| 11 | Citizen can confirm or dispute a `Resolved` issue | `PATCH /api/issues/:id/status` allows the reporting citizen to move `Resolved → Verified` or `Resolved → Reopened` | Hasitha Erandika, Seneja Thehansi |
| 12 | Public feed shows SLA-transparency stats, not points | `GET /api/councils/stats`, rendered on the public feed and each council's page | Seneja Thehansi |
| 13 | Council picker replaces free-text ward on the report form | Report form reads from `GET /api/councils` (or a similar public listing) instead of a static dropdown | Seneja Thehansi |
| 14 | Responsive layout across all three account types | Tailwind responsive layout, tested at mobile width for citizen, Municipal Officer, and Provincial Officer views | Seneja Thehansi, Jayashan Guruge |
| 15 | Seeded data demonstrates the real hierarchy | A working subset of real, named provinces/councils; issues spanning every status including one `Reopened` and one `escalated` row | Bhanuka Samarasinghe |

## Explicit non-requirements for v1 (do not block on these)

Anything listed under Phase 2 or "out of scope" in [`04-scope-and-boundaries.md`](04-scope-and-boundaries.md) - SMS OTP, Urban Council/Pradeshiya Sabha support, full Sinhala/Tamil UI, the government visual-design implementation, department sub-roles, map-based reporting, external-authority API integration, notification delivery, DRP registry verification, NIC encryption at rest. Each has a documented reason and a stated alternative in that file; none of them are silently dropped, but none of them gate v1 either.

## Pre-release gate

Before treating v1 as ready to demonstrate to an actual council or province: confirm every row above is genuinely working against a **deployed** environment, with real (not fabricated) province/council seed data, and that a Municipal Officer account and a Provincial Officer account have each been walked through their full flow at least once by someone other than the person who built it.
