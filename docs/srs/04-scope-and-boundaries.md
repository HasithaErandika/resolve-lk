# 04 - Scope & Boundaries

This redesign moves Resolve LK from a 4-hour hackathon prototype toward a system built to actually serve real Municipal Councils. That's a much bigger surface than one sitting can build - this document is the contract for what v1 actually delivers versus what's documented as a real, deliberate future phase. Nothing below gets built just because it sounds right; it's listed under a phase and stays there.

## Phase 1 (v1) - in scope

- **Full role hierarchy**: Citizen, Municipal Officer (one per council), Provincial Officer (one per province), System Administrator - see [`03-governance-and-roles.md`](03-governance-and-roles.md). No self-registration above Citizen.
- **Nationwide data model**: `provinces` (9) and `councils` (Municipal Councils) as first-class tables, so the system is structurally correct for the real number of authorities from day one - even if seed data only populates a working subset for demonstration.
- **NIC + OTP citizen access**: reporting stays fully public and unverified (NIC format only); "My Reports" access is a one-time code, not a password. No citizen password exists anywhere in the system. OTP delivery via **email** in v1 (fits the existing Supabase-based stack with no new vendor); **SMS delivery is Phase 2** - it requires a paid local SMS gateway contract, which is a procurement decision outside a software build's scope, not a technical blocker.
- **AI auto-triage with jurisdiction detection**: priority (Critical/High/Medium/Low) **and** whether the issue is actually the council's responsibility, with a redirect authority named (NWSDB, RDA, CEB, Police) when it isn't. Jurisdiction table in [`03-governance-and-roles.md`](03-governance-and-roles.md#category--responsible-authority-jurisdiction).
- **SLA engine**: acknowledge/resolve targets computed per issue from its priority at submission time; a scheduled job flags breaches for the Provincial Officer's escalation queue.
- **Real status pipeline**: `Submitted → Acknowledged → In Progress → Resolved → Verified`, with `Reopened`, and a full audit trail (`issue_status_history`) of every transition.
- **Public SLA-transparency stats**: per-council, per-category resolution-rate and timing stats on the public feed, replacing the points/gamification system.
- **Municipal Officer dashboard**: council-scoped issue queue, search/filter, status updates, jurisdiction-flagged issues visible separately from the actionable queue.
- **Provincial Officer dashboard**: cross-council view within their province, SLA-compliance comparison, escalation queue, ability to provision Municipal Officer accounts for councils in their province.
- **System Administrator function**: provisions provinces and Provincial Officer accounts. Minimal UI (or direct database operation) - this is an internal, rarely-used function, not a product surface.
- **Cloudflare R2** for photo storage - unchanged from the original design.
- **Responsive layout** for all three account types.
- **Seeded, realistic sample data**: a working subset of real, named provinces/councils (not all 341/29/9, but enough - e.g. one full province with its councils - to demonstrate the hierarchy is real and functioning, not fabricated placeholder rows).

## Phase 2 - documented, not built yet

| Item | Why it's Phase 2, not Phase 1 | What v1 does instead |
|---|---|---|
| SMS OTP delivery | Requires a paid SMS gateway (Twilio, or a local aggregator) - a procurement/cost decision, not a build blocker | Email OTP only in v1 |
| Urban Council & Pradeshiya Sabha support | Same governance shape (one officer, provincial oversight) but a second and third `local_authority_type`, more seed data, and UI copy that needs to generalize beyond "Municipal Council" language throughout | Municipal Councils only; the schema's `local_authority_type` field is reserved for this, so it's an additive change later, not a rewrite |
| Sinhala / Tamil UI (full trilingual support) | Real i18n work - translated copy, RTL-safe layout is not needed but font/glyph support and content review are real effort | English UI in v1; explicitly flagged as a real gap, not a "nice to have," since English-only excludes a large share of actual users of a civic service |
| Government visual design system implementation | A full design-system build (see [`03-governance-and-roles.md`](03-governance-and-roles.md#visual-design-language--specification-only-not-implemented-in-this-phase)) needs dedicated design time against ICTA's actual current guidelines | The **specification is written now** (governance doc, linked above) so the direction is agreed; the current frontend is not restyled against it in this phase |
| Department/assignee sub-roles within a council | Real councils split work across PHI/Engineering/etc. - a legitimate v2 need once a single council-level queue is proven | One shared queue per council; `civic_issues.assigned_to` column reserved but unused |
| Real GPS / map-based reporting | Maps API integration, accurate geocoding to the correct council boundary, and map UI are substantial, separable work | A council/ward dropdown + free-text landmark, with optional device-geolocation lat/long already captured for future use |
| Direct integration with external authorities (NWSDB/RDA/CEB ticketing) | No public API exists for any of these bodies; would require a bilateral agreement per authority | A redirected issue names the correct authority and is logged for the citizen's own record; it is not transmitted anywhere automatically |
| SMS/email notifications on every status change | A real notification pipeline (delivery guarantees, opt-out, rate limits) is its own project | Citizens check status by returning to "My Reports"; the OTP-delivery channel built in v1 is the natural extension point |
| Verifying NIC against the DRP government registry | No public API exists for this - not buildable regardless of phase | NIC format + in-database uniqueness only, stated as a permanent (not just Phase-1) limitation - see [`03-governance-and-roles.md`](03-governance-and-roles.md#citizen-identity-what-stays-frictionless-and-what-changed) |
| Encrypting the NIC column at rest | Real hardening work | Plain text in v1; flagged as a known production-hardening gap, same as the original hackathon version, but now explicitly carried forward rather than silently dropped |

## Explicitly out of scope (any phase)

| Cut | Why |
|---|---|
| Native mobile app (React Native, etc.) | A responsive web app serves the same users without a second toolchain/deploy pipeline |
| A separate "field crew" worker app | Councils are assumed to dispatch work internally (a call, a work order) outside the app, same as today |
| Verifying citizen identity as a precondition for reporting | Would recreate the exact friction this platform exists to remove - see [`02-solution-overview.md`](02-solution-overview.md#what-stays-frictionless-and-what-changed-from-the-hackathon-version) |
| Presigned direct-to-R2 uploads from the browser | Requires CORS configuration and a two-step upload flow; the backend-proxied upload is simpler and secure enough at expected volume |

## Definition of done (v1)

v1 is "done" when: the full role hierarchy is enforced end-to-end (a Municipal Officer cannot see another council's issues; a Provincial Officer cannot directly alter issue status); AI triage returns both priority and jurisdiction; SLA targets are computed and breaches surface on the Provincial Officer's escalation queue; the status pipeline (including `Verified`/`Reopened`) and its audit trail work end-to-end; NIC+OTP is the only citizen access path (no password anywhere for citizens); and the public feed shows real SLA-transparency stats instead of points. See [`09-requirements-traceability.md`](09-requirements-traceability.md) for the full checklist.
