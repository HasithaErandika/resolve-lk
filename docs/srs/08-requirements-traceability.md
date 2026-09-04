# 08 — Requirements Traceability

Maps the assignment's 10 minimum software requirements (§1.3) and the marking rubric (§3) to what we're building and who owns it. Use this during Polish to confirm nothing is missing before the Ship phase.

## Minimum software requirements (§1.3)

| # | Requirement | How Resolve LK meets it | Owner |
|---|---|---|---|
| 1 | Clear landing page / main UI | Landing page introducing Resolve LK, with the public feed and report form on it | Seneja Thehansi |
| 2 | Sri Lankan problem explained in-app | Problem summary section on the landing page (from [`01-problem-statement.md`](01-problem-statement.md)) | Seneja Thehansi |
| 3 | ≥ 2 functional features | (a) Issue reporting with AI triage, (b) Admin dashboard search/filter/status update | Seneja Thehansi, Jayashan Guruge, Hasitha Erandika |
| 4 | ≥ 1 form accepting user input | The report form (NIC + email + issue details — doubles as signup, no separate screen) | Seneja Thehansi |
| 5 | Input validation, friendly errors | Client + server validation on the report form (NIC format, email format, category, ward, landmark, description ≥ 20 chars) | Seneja Thehansi, Hasitha Erandika |
| 6 | Display / search / filter / update / process information | Admin dashboard: search, category/status filter, status update workflow | Jayashan Guruge |
| 7 | Responsive desktop + mobile | Tailwind responsive layout, tested at mobile width | Seneja Thehansi, Jayashan Guruge |
| 8 | Basic navigation between sections | Landing (public feed + report form) → My Reports (NIC) / Admin login → Admin dashboard, with a shared nav bar | Seneja Thehansi, Jayashan Guruge |
| 9 | Sample data relevant to the problem | Seeded `civic_issues` rows (see [`05-data-model.md`](05-data-model.md)) | Bhanuka Samarasinghe |
| 10 | Clear demonstration of value to Sri Lankan users | Problem framing + live triage demo in the video | All (video) |

## Marking rubric (§3.1) — where marks come from

| Criterion | Marks | Where it's earned |
|---|---|---|
| Relevance of the Sri Lankan problem | 10 | [`01-problem-statement.md`](01-problem-statement.md) + in-app problem section, with specific local detail |
| Practicality & creativity of the solution | 15 | Scoped, working civic-report + AI-triage pipeline; see [`02-solution-overview.md`](02-solution-overview.md) |
| Minimum functional requirements | 20 | Table above — all 10 must work on the deployed app |
| Quality & usability of the prototype | 15 | Clean responsive UI, graceful validation errors |
| Effective use of technology & AI tools | 10 | Justified stack choices (this doc set), Gemini triage explained by every member, AI Prompt Log kept honestly |
| Git repository & documentation | 10 | Meaningful commits from all 4 members, this docs/srs set, complete README |
| Successful deployment | 10 | Frontend on Cloudflare Pages, backend on Choreo, both verified in incognito |
| Quality of the 2-minute demonstration | 5 | Follow the demo checklist in [`PLAN.md`](../../PLAN.md) |
| Contribution from all registered members | 5 | Even commit history, README contribution table, everyone can explain their part live |

## Pre-submission gate

Before recording the demo video, confirm every row in the first table above is genuinely working **on the deployed URL**, not just in local dev — a feature that only works on `localhost` doesn't count for "Successful deployment" or "Minimum functional requirements."
