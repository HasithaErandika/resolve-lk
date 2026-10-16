# 01 - Problem Statement

## The problem

Sri Lanka has 341 local authorities - 29 Municipal Councils, 36 Urban Councils, 276 Pradeshiya Sabhas, across 9 provinces - each legally responsible for everyday civic issues in the areas they serve: garbage collection, road maintenance, drainage, street lighting, and public sanitation. Despite that, the way a resident actually gets one of these issues fixed has barely changed in decades:

1. A resident notices a problem - illegal garbage dumping, a burst pipe, a pothole, a blocked drain pooling stagnant water, a dead streetlight.
2. To report it, they must physically visit the council office during working hours, or track down the right officer's phone number - itself often not published anywhere a citizen can find.
3. They file a written complaint into a physical register, or make a verbal report with no reference number, no receipt, and no way to check status later.
4. The council has no centralized digital record of what's been reported, to whom it was assigned, or whether it was actually fixed. Different types of issues (garbage vs. water vs. roads) may not even be the council's responsibility at all - but there's no way for a resident to know that in advance, so it gets reported to the council anyway and often just sits.
5. Nothing above the council sees any of this. If a specific council has a chronic backlog - under-resourced, understaffed, simply not responding - there is no structured signal that reaches the **provincial oversight layer** (the Commissioner of Local Government for that province) until it becomes a political or media story. Escalation, where it happens at all, is informal and personal, not systemic.

This is not a hypothetical gap. There is currently **no unified national or provincial digital complaint-tracking system for civic infrastructure issues** in Sri Lankan local government - in sharp contrast to sectors like utility billing, which are digitized, and to comparable civic-reporting tools that exist in other jurisdictions (e.g. the UK's FixMyStreet, or municipal 311 apps common across US cities).

## Who is affected

- **Residents**, particularly in dense urban and semi-urban wards, who have no low-friction way to report a problem and no visibility into whether it's being addressed. Residents without the time or ability to visit a council office in person during working hours - shift workers, the elderly, people with mobility limitations - are disproportionately excluded from a system that requires a physical visit.
- **Municipal Commissioners' offices and council staff**, who have no shared system to track incoming issues, confirm what's actually their jurisdiction versus another authority's (NWSDB for water, RDA for national roads, CEB for the electricity supply feeding streetlights), assign work, or measure their own backlog. Everything lives in paper registers or informal notes, which also means a council genuinely doing good work has no way to demonstrate it.
- **Provincial Commissioners of Local Government**, who are nominally responsible for oversight of every council in their province but have no structured, comparable data across councils - no way to see which councils are keeping up and which are falling behind, short of an ad-hoc audit or a complaint escalated informally through political channels.
- **The wider community**, who bear the public-health and safety cost of slow response: stagnant water and dengue risk, road accidents from unrepaired hazards, uncollected waste attracting pests and disease. This cost falls hardest on lower-income wards, where residents are both more exposed to these hazards (denser housing, less private infrastructure to compensate) and least likely to have the informal connections that get a complaint fast-tracked through personal contact with an officer.

## Why this matters now

Urban and semi-urban population density in Sri Lanka continues to strain municipal services that were never digitized. Dengue outbreaks are a recurring seasonal public-health issue directly linked to slow response on drainage and waste complaints - a delay measured in council backlog days is, in aggregate, a measurable public-health variable, not just an inconvenience. Sri Lanka's 2022 gazette upgrades (five Urban Councils promoted to Municipal Council status, more local authorities added since) show the sector is actively growing in administrative complexity, which makes the absence of any shared digital infrastructure across councils a widening gap, not a stable one.

Separately, the *administrative* shape of this problem is well understood and stable - Sri Lanka's local government hierarchy (Ministry → Province → Council) has been consistent for decades - which means a system built against that real hierarchy, rather than a single flat "citizens report, one admin resolves" model, can actually fit how accountability is meant to flow, instead of requiring councils to change how they're organized to use it.

## Evidence this is a real, current, local problem

- Recurring dengue case surges reported each rainy season, frequently linked in public health advisories to blocked drains and uncollected waste - a pattern that repeats because the underlying reporting/response gap is structural, not a one-off failure.
- Local news coverage of unresolved pothole, drainage, and streetlight complaints recurs across multiple municipal areas, often citing residents who say they reported the issue "months ago" with no reference number or way to verify that claim either way.
- No public API or unified portal exists for tracking civic-infrastructure complaints against any Sri Lankan local authority - confirmed by the absence of one in ICTA's own government-digitization guidance and in the Ministry of Provincial Councils and Local Government's published services.
- Sri Lanka's local government structure itself (341 authorities, 9 provinces, one Ministry) is exactly the kind of multi-tier, high-fragmentation system that benefits most from a shared platform - a resident in any of the 29 Municipal Councils faces the same reporting gap, but no council-by-council rebuild of a paper register is realistically going to happen on its own.

*(Team: add a specific ward/council/recent local news example before any external presentation - a named, current instance scores far higher on relevance than a general statement.)*
