# 03 - Governance, Roles & Workflow

This is the document that grounds Resolve LK in how Sri Lankan local government actually works, instead of a flat "citizen files a ticket, an admin closes it" model. Read this before touching `profiles`, any role check, or the status pipeline - it is the source of truth for *why* the roles are shaped the way they are.

## The real administrative hierarchy

Sri Lanka's sub-national government has three constitutional tiers: central, provincial, and local. Local government itself sits under **Schedule 9 of the Constitution**, which recognizes three types of local authority - **Municipal Councils** (urbanised areas), **Urban Councils** (semi-urban), and **Pradeshiya Sabhas** (rural). As of the most recent local government elections there are **29 Municipal Councils, 36 Urban Councils, and 276 Pradeshiya Sabhas** (341 local authorities total) spread across **9 provinces** - up from a historical baseline of 23/41/271, as several Urban Councils have since been upgraded. Resolve LK targets **Municipal Councils only** for v1; Urban Councils and Pradeshiya Sabhas are a documented future extension (see [`04-scope-and-boundaries.md`](04-scope-and-boundaries.md)) - the data model is deliberately generic enough (a `local_authority_type` distinction) to add them later without a redesign.

Sources: [Ministry of Provincial Councils and Local Government - Local Authorities](https://mpclg.gov.lk/web/index.php?option=com_content&view=article&id=38&Itemid=105&lang=en), [SNG-WOFI Sri Lanka country profile](https://www.sng-wofi.org/country_profiles/sri_lanka.html), [Municipal councils of Sri Lanka - Wikipedia](https://en.wikipedia.org/wiki/Municipal_councils_of_Sri_Lanka).

### Who actually runs a Municipal Council

Every Municipal Council has two heads, and the distinction matters for who should hold the app's council-level account:

- **The Mayor** - the elected political executive. Sets policy and priorities, but is not a civil servant and does not run daily administration.
- **The Municipal Commissioner** - the **chief administrative officer**, and the highest-ranking *non-elected* officer of the council. Appointed by the responsible Minister, almost always seconded from the **Sri Lanka Administrative Service**. The Commissioner heads the council's staff and administration, and - per the Colombo Municipal Council's own published structure - is where public complaint-handling functions sit today (most councils run this informally: a physical complaints register or ad-hoc phone calls into the Commissioner's office).

Source: [Municipal Commissioner (Sri Lanka) - Wikipedia](https://en.wikipedia.org/wiki/Municipal_Commissioner_(Sri_Lanka)), [Office of Municipal Commissioner - Colombo Municipal Council](https://www.colombo.mc.gov.lk/office-of-municipal-commissioner.php).

**Design decision: the app's one-officer-per-council account represents the Office of the Municipal Commissioner**, not the Mayor. This is deliberate - the Commissioner's office is the actual administrative body that would operate a system like this day to day; the Mayor's office is political. In practice a real deployment would let the Commissioner delegate day-to-day use to a designated deputy (e.g. an Assistant Commissioner or the Public Health Inspector who already owns sanitation complaints), but the app models **one authorized account per council** - matching what you asked for, and matching how a single point of accountability already works in these offices.

### What sits above a Municipal Council

There genuinely is a tier above Municipal Councils, and it is not the Mayor's or Commissioner's superior in a straight line - it's provincial:

- Each of the **9 Provincial Councils** has a **Ministry of Local Government** at the provincial level, responsible for implementation and oversight of every local authority (Municipal Council, Urban Council, Pradeshiya Sabha) within that province.
- The province-level administrative head for this function is commonly referred to as the **Commissioner of Local Government (Provincial)** - the oversight officer for all local authorities in a province, reporting through the provincial administration.
- Above the provinces, the **national Ministry responsible for Local Government** (its exact name changes with cabinet reshuffles - currently folded into the Ministry of Public Administration, Home Affairs, Provincial Councils and Local Government) sets policy and legislation nationally, but does not run day-to-day complaint handling.

Source: [Ministry of Provincial Councils and Local Government](https://mpclg.gov.lk/web/index.php?lang=en), [Ministry of Public Administration, Home Affairs, Provincial Councils and Local Government - Wikipedia](https://en.wikipedia.org/wiki/Ministry_of_Public_Administration,_Home_Affairs,_Provincial_Councils_and_Local_Government).

**Design decision: this is the position "above" Municipal Councils that the app models - a Provincial Officer, one per province, standing in for the Commissioner of Local Government (Provincial).** They are not another layer of the same job; their role in the app is oversight and escalation across every council in their province, not day-to-day issue triage (that stays with each council's own Municipal Officer).

## Roles in Resolve LK

| Role | Represents (real-world) | Scope | How the account is created |
|---|---|---|---|
| **Citizen** | Any resident | Reports issues, browses the public feed, views own history | Self-service via the report form (NIC-based, see below) - never an explicit signup |
| **Municipal Officer** | The Municipal Commissioner's office | One account per Municipal Council; triages and resolves that council's issues only | Created by that council's Provincial Officer |
| **Provincial Officer** | The Commissioner of Local Government (Provincial) | One account per province; oversees every council in that province, handles SLA escalations | Created by a System Administrator |
| **System Administrator** | A small internal platform-operations function (not a citizen-facing role; stands in for the national Ministry's implementation unit) | Creates provinces, creates Provincial Officer accounts, has no involvement in day-to-day issue handling | Seeded once at deployment, never self-registered |

No role is ever self-registered above Citizen - this mirrors the real appointment chain (Commissioner appointed by a Minister, not by applying online) and closes the "anyone signs up as an admin" hole the hackathon version already flagged as unsafe.

### Why not model every real department (PHI, engineering, water)?

A real Municipal Council splits work across several departments (Public Health Inspectors handle sanitation, the Engineering division handles roads/drains, and so on). Modeling one account per council - as asked - is a deliberate simplification: v1 gives the Commissioner's office a single triage queue, and that office is responsible for whatever internal delegation happens outside the app (a phone call, a WhatsApp group, a physical work order - same as today). **A department/assignee sub-role inside a council is a natural v2 extension** (the `civic_issues.assigned_to` column is reserved for it - see [`06-data-model.md`](06-data-model.md)) but is not built in v1, to keep the account model matching what was asked for.

## Category → responsible authority (jurisdiction)

Not every civic complaint is actually the Municipal Council's job, even though residents naturally report everything to whichever door is open. Getting this wrong either makes the council's backlog metrics meaningless (cluttered with things they can't act on) or makes the app useless for issues it should be able to route correctly. Resolve LK's AI triage step includes a **jurisdiction check**, not just a priority score:

| Category | Default authority | Notes |
|---|---|---|
| Garbage / Solid Waste | **Municipal Council** | Core council function - solid waste management is explicitly a municipal responsibility |
| Drainage | **Municipal Council** | Core council function |
| Local/municipal road (pothole, pavement on a street within council limits) | **Municipal Council** | Only unclassified municipal streets - not A/B/C/D class roads |
| National highway - Class A or B (trunk/main roads) | **Redirect → Road Development Authority (RDA)** | RDA maintains the ~12,300 km National Road Network - Class A and B roads, plus Class E expressways. Councils do not maintain these. Source: [RDA - National Highways (Class A, B & E Roads) gazetted list](https://rda.gov.lk/index.php?Itemid=123&id=24&lang=en&option=com_content&view=article). |
| Provincial road - Class C or D | **Redirect → Provincial Road Development Authority (PRDA)** | A tier easy to miss: C/D class roads sit between national highways and municipal streets, and are maintained by each province's own PRDA - **not** RDA, and **not** the Municipal Council either. A report against a numbered C/D road should not silently land in a council's queue. |
| Street lighting | **Municipal Council** (coordinates with CEB) | Councils typically own the poles/fixtures on municipal roads; the Ceylon Electricity Board owns the supply. Logged as in-jurisdiction with a CEB-coordination note rather than a hard redirect. |
| Water supply / sewerage | **Redirect → National Water Supply & Drainage Board (NWSDB)** | NWSDB operates most urban water/sewerage schemes. A council flagged in the `councils` table as operating its own scheme (`operates_own_water_scheme = true`) is routed in-jurisdiction instead - this is the exception, not the default. |
| Public safety - infrastructure hazard | **Municipal Council** | e.g. an unguarded excavation, a collapsed pavement |
| Public safety - crime/emergency | **Redirect → Sri Lanka Police** | Explicitly out of this app's remit; shown to the citizen as "please contact the Police (119)," still logged so the report isn't just dropped |
| Other | **Municipal Officer manual review** | No confident auto-route; queued for a human decision |

Sources: [Colombo Municipal Council - Engineering Services](https://www.colombo.mc.gov.lk/engineering-services.php), [Colombo Municipal Council - Garbage Collection](https://www.colombo.mc.gov.lk/garbage-collection.php), [National Water Supply and Drainage Board - Wikipedia](https://en.wikipedia.org/wiki/National_Water_Supply_and_Drainage_Board).

**A redirected issue is still recorded and still visible to the reporting citizen with the correct authority named** - Resolve LK stays a single front door for "something's wrong in my area" even when the fix isn't the council's to make. Redirected issues are excluded from a council's SLA-compliance metrics (see below), since holding a council accountable for NWSDB's pipe is meaningless.

### Road-authority reference list

Distinguishing "my street" (council), a numbered A/B highway (RDA), and a numbered C/D provincial road (PRDA) from free text alone is genuinely hard without a real GIS road-network dataset, which is out of reach for this build. As a practical middle ground, `lib/rdaRoads.js` holds a small **reference list of major named Class A/B national highways and Class E expressways** (e.g. A1 Colombo–Kandy Road, A2 Colombo–Galle–Matara Road, A9 Kandy–Jaffna Road, E01 Southern Expressway) - sourced from RDA's own gazetted National Highways list. The triage step checks a report's description/landmark against this list as a hint to Gemini, not a replacement for its judgment. **This is a heuristic, not a source of truth** - it will miss a national highway a citizen describes without naming it, and it has no equivalent list for C/D provincial roads at all (no public gazetted list was found in the same accessible form). Gemini's own judgment (guided by the prompt) is still what actually decides `redirect_authority`; the reference list only improves the odds it gets a *named* highway right.

### Location-based council suggestion (Haversine)

The report form already optionally captures device GPS coordinates. When present, `services/councilService.js#findNearestCouncil` computes the straight-line (Haversine) distance from that point to every seeded council's administrative reference point and returns the nearest one alongside the citizen's chosen council.

**This is a suggestion, never a hard override.** Two honest limitations, stated plainly rather than glossed over: (1) each council is represented by a single reference coordinate (its administrative centre), not a real jurisdiction boundary polygon - nearest-point matching can be wrong near a border between adjacent councils (e.g. Colombo, Kotte, and Dehiwala-Mount Lavinia sit close enough together that a point near their shared edge can be genuinely ambiguous); (2) GPS accuracy on a phone can itself be off by tens of metres. If the nearest council differs from the one the citizen picked, the API still accepts the submission as chosen and returns a `suggested_council` the frontend can offer as "Did you mean **X** Council?" - never a blocking validation error. A real jurisdiction-boundary dataset (ward/GN-division polygons) would remove the ambiguity entirely but is a real GIS-data acquisition effort, out of reach for this build - see [`04-scope-and-boundaries.md`](04-scope-and-boundaries.md).

## Status pipeline

Replacing the hackathon's flat `Pending → In Progress → Resolved` with a pipeline that has an audit trail and a citizen confirmation step, matching how a real service-request system (and residents' expectations of one) works:

```
Submitted → Acknowledged → In Progress → Resolved → Verified (closed)
                                              ↓
                                          Reopened → In Progress (loop)
```

- **Submitted** - the citizen's report lands. Starts the SLA acknowledgment clock.
- **Acknowledged** - the Municipal Officer has seen it and confirmed it's valid/actionable. Stops the acknowledgment clock, starts the resolution clock.
- **In Progress** - work is underway (as reported by the council; the app does not track field crews).
- **Resolved** - the Municipal Officer marks the fix done.
- **Verified** - the reporting citizen confirms the fix on their next "My Reports" visit, or it auto-verifies 14 days after `Resolved` with no dispute. This closes the loop instead of trusting the council's word alone.
- **Reopened** - the citizen disputes a `Resolved` status (issue wasn't actually fixed). Goes back to `In Progress`. A second reopen on the same issue auto-escalates to the Provincial Officer (see below) - a repeat failure is a signal, not routine.

Every transition is written to an `issue_status_history` row (who, when, from/to, optional note) - see [`06-data-model.md`](06-data-model.md). This is the "real workflow" audit trail the hackathon version had no room for.

## SLA targets and escalation

Priority (`Critical` / `High` / `Medium` / `Low`) comes from Gemini's triage, same mechanism as before, but now drives concrete service-level targets instead of just a visual flag:

| Priority | Example | Acknowledge within | Resolve within |
|---|---|---|---|
| Critical | Standing sewage/water - dengue-breeding risk; dangerous road hazard | 24 hours | 3 days |
| High | Large uncollected garbage dump; multiple streetlights out on one road | 48 hours | 7 days |
| Medium | Single pothole; single broken streetlight | 3 days | 14 days |
| Low | Cosmetic/minor (e.g. a leaning sign, faded road paint) | 5 days | 30 days |

`sla_ack_due_at` and `sla_resolve_due_at` are computed at submission time from this table (see [`06-data-model.md`](06-data-model.md)). **Escalation is automatic, not a citizen complaint mechanism:** a scheduled job flags any issue that breaches its acknowledgment or resolution target - `escalated = true`, visible on the owning council's Provincial Officer dashboard, grouped by council so backlog patterns (not just single issues) are visible. The Provincial Officer cannot directly change an issue's status (that authority stays with the Municipal Officer, matching real accountability), but can see the breach, contact the council, and - for issues stuck with two or more reopens - reassign the underlying category priority.

## Public transparency (replaces citizen "contribution points")

The hackathon version rewarded citizens with points for reporting. A professional civic-accountability tool inverts that: the accountability is the **council's**, made visible, not the citizen's, gamified. The public feed and each council's public page show:

- Total open / in-progress / resolved counts (rolling 90 days)
- **% resolved within SLA target**, by category
- **Average time to acknowledge** and **average time to resolve**, by category
- Current backlog age (oldest unacknowledged/unresolved issue)

This is deliberately comparable to how municipal-service transparency works elsewhere (e.g. the UK's FixMyStreet, US municipal 311 systems) - the public number *is* the accountability mechanism, replacing a private points counter nobody outside the citizen ever saw.

## Citizen identity: what stays frictionless, and what changed

**Reporting and browsing remain fully public and unverified - this does not change.** A citizen can submit a report with nothing but a valid-format NIC, no login, no OTP, no wait. This is a deliberate policy carried forward from the original design, not an oversight:

- The NIC field exists to give one person one identity (prevents trivial duplicate/spam reporting under different names) and to let a citizen later look up their own history - **not** to gate who is allowed to report.
- We validate NIC **format** only (old 9-digit+V/X or new 12-digit pattern) and **uniqueness in our own database**. We do **not** verify a NIC against the Department for Registration of Persons (DRP) - no public API for that exists, and even if it did, adding a verification gate to the report-submission step would reintroduce exactly the friction this design has always avoided. **Risk, stated plainly:** a citizen can submit under a fabricated but format-valid NIC. This is accepted, same as a paper complaint book is never identity-checked today - the mitigation is that reports are public and triaged by a human council officer, not that submission is gated.

**What changes is how a citizen accesses their own report history.** The hackathon version set every auto-provisioned account's password to the citizen's own NIC - flagged at the time as a real hole, since NIC numbers are semi-public in Sri Lanka (printed on many documents, known to family/neighbours). For a system handling real complaints to real government bodies, that's not acceptable. Resolve LK v1 replaces it with **NIC + one-time code (OTP)**:

1. Citizen types their NIC into "My Reports."
2. Backend looks up the profile, sends a 6-digit code to the contact method on file (email in v1; SMS is a documented v2 addition once an SMS gateway budget exists - see [`04-scope-and-boundaries.md`](04-scope-and-boundaries.md)).
3. Citizen enters the code (10-minute expiry, rate-limited attempts); backend verifies and mints a Supabase session.

No password exists for citizen accounts at all - not NIC, not anything else. See [`05-architecture.md`](05-architecture.md) and [`06-data-model.md`](06-data-model.md) for the mechanism.

## Visual design language - specification only, not implemented in this phase

This section is a **design brief for a future UI build**, not a build instruction for the current phase. Nothing below should be implemented yet; it exists so the eventual frontend work has an agreed, researched target instead of improvising a "generic web-app" look for a system that represents government offices.

Resolve LK should read as an **official Sri Lankan government service**, in the visual register of `gov.lk` sites and bodies like the Lanka Software Foundation's public-sector work (LSF has, since 2018, focused specifically on helping government deploy citizen-facing technology) - not as a startup product or a hackathon demo.

Grounding reference: **ICTA's "Guidelines for Developing Sri Lanka Government Websites" (v4.0)** is the actual standard Sri Lankan government sites are built against - a future implementation should pull the current version of this document and follow it directly rather than approximating it. In the meantime, the following conventions are consistent across live `gov.lk`/local-authority sites and should guide the eventual design:

- **Header:** national emblem (Sri Lanka Coat of Arms) top-left, aligned with the council/province/ministry name; a language switcher for **Sinhala / Tamil / English** - full trilingual support is a stated goal (see [`04-scope-and-boundaries.md`](04-scope-and-boundaries.md) for phasing), not optional polish, since English-only excludes a large share of real users of a civic service.
- **Colour:** restrained, formal - navy/deep-blue as the primary institutional colour, white space, a single accent colour reserved for status/priority signals (not decoration). Avoid gradients, playful illustration, or a "product landing page" feel.
- **Typography:** a clean, formal sans-serif for UI text (legible at small sizes, supports Sinhala/Tamil glyphs correctly), reserving any serif/display treatment for the masthead only.
- **Structure:** breadcrumb navigation, a persistent footer with the operating authority's name, contact details, a sitemap link, and a disclaimer/privacy-policy line - standard on every `gov.lk` page and currently absent from the hackathon build entirely.
- **Tone:** the public feed and council transparency pages should read like an official public register (think Gazette notices, not a social feed) - status badges, not emoji; dates in full, not relative ("2 hours ago" reads casual; "04 Sep 2026, 10:14" reads official).
- **Accessibility:** WCAG 2.1 AA as a baseline - government-facing tools have a higher accessibility bar than a typical product, and a meaningful share of real users will be on low-end Android devices and slow connections.
- **Component library: shadcn/ui**, not IBM Carbon Design System, for the eventual rebuild of both the citizen pages and the Municipal/Provincial Officer dashboards. shadcn is built directly on Tailwind + Radix primitives, so it extends the project's already-fixed Tailwind stack (see `CLAUDE.md`) instead of introducing a second, Sass-based design system alongside it, and it is unopinionated enough to be themed to the formal navy/white official palette above rather than fighting IBM's own blue brand identity. Carbon's built-in `DataTable` (sorting, batch actions, overflow menus) is genuinely stronger out of the box for the officer dashboards' dense filterable tables - the intended mitigation is pairing shadcn with **TanStack Table**, which covers the same need without a second styling system. Radix's accessibility primitives keep the WCAG 2.1 AA baseline achievable either way.

None of this changes the current frontend. It is recorded here so that when the UI is actually rebuilt for the redesigned system, the visual direction doesn't need to be re-derived or re-litigated.

Sources: [ICTA - Guidelines for Developing Sri Lanka Government Websites](https://www.icta.lk/icta-assets/uploads/2022/03/Guidelines-for-developing-Sri-Lanka-Government-Websites-4.0.pdf), [Lanka Software Foundation - Open Source for Public Good](https://opensource.lk/).
