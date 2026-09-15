# Stage 5 — MVP Feature Freeze

Written 2026-09-09, by Champion working from [stage-2-prd.md](stage-2-prd.md)'s feature set. This is item 1 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s "genuinely new" list, done first because the user journeys (Stage 6) and everything after depend on knowing exactly what's being built.

The PRD already has an MVP feature list (sections 8-9) and a non-goals list (section 48). This document doesn't repeat those in prose, it turns them into one frozen table with every feature classified, so there's a single place to check "is X in scope" instead of re-deriving it from PRD prose each time.

## How to read this

**P0 — must exist.** The system isn't a usable v1 without it. If any P0 item is missing, the "aha moment" (an admin searches a profession, gets explainable verified matches, shortlists, member gets notified) doesn't work end to end.

**P1 — important, not launch-blocking.** Real value, can land in the weeks right after launch without the first version feeling broken without it.

**P2 — explicitly out of scope for now.** Not forgotten, just not being built. Revisit only if usage after launch actually demands it.

Reasoning is given only where the call isn't obvious from the PRD itself — most rows are a direct read of PRD sections 8-9 and 48, not a new decision.

---

## Member-facing

| Feature | Tier | Note |
|---|---|---|
| Registration (email/phone) | P0 | |
| Login / logout / password reset | P0 | |
| Profile: personal information | P0 | |
| Profile: profession, job title, industry, employment status | P0 | |
| Profile: education (multiple records) | P0 | |
| Profile: experience (multiple records) | P0 | |
| Profile: skills | P0 | Free-text at launch — see Stage 4 item 8 (taxonomy) below, deliberately not blocking on it |
| Profile: certifications | P1 | Real value but not required for the first useful profile; a member with education + experience + skills is already searchable |
| CV upload | P0 | The transcript's original ask was explicitly CV-shaped data; skipping this breaks the founding use case |
| Availability status (Open / Selective / Not available) | P0 | Directly gates matching results |
| Profile completion indicator | P1 | Nice-to-have nudge, not required for the system to function |
| Member dashboard (status, recommended opportunities) | P0 | |
| Browse/search opportunities | P0 | |
| Apply to an opportunity | P0 | |
| Application status tracking | P0 | Applied → Reviewed → Shortlisted → Interview → Selected, per PRD section 32-33 |
| In-app notifications | P0 | Decided: in-app only, no SMS/WhatsApp for v1 |
| Privacy/visibility settings page | P1 | PRD section 38's visibility rules can ship as fixed defaults at launch; a member-facing settings page to adjust them is a fast follow, not launch-blocking |
| Settings (account-level) | P1 | |

## Admin-facing

| Feature | Tier | Note |
|---|---|---|
| Admin login | P0 | |
| Admin dashboard (KPIs, needs-attention) | P0 | |
| Professional directory (search + filter) | P0 | The single most load-bearing screen in the whole product |
| Directory filters: profession, location, experience, availability, verification | P0 | |
| Directory filter: education level | P1 | PRD section 23 already flags this as "eventually" |
| Admin professional profile view | P0 | |
| Verification queue | P0 | Without this, "verified" badges have nothing behind them |
| Verification review (approve / request correction) | P0 | |
| Create opportunity | P0 | |
| Opportunity list / manage | P0 | |
| Find matches for an opportunity | P0 | The "aha moment" itself — see PRD section 52 |
| Match explanation (per-criterion breakdown, not just a %) | P0 | Decided already: explainability is not optional, PRD section 29 and Stage 3 section 10 |
| Shortlist candidates | P0 | |
| Application management per opportunity | P0 | |
| Kanban-style application pipeline view | P1 | Genuinely useful (Stage 3 section 10) but a sorted/filtered list accomplishes the same task at launch |
| Analytics: professional distribution | P1 | Reporting on top of data that already exists; doesn't block anyone doing their job |
| Analytics: impact dashboard (jobs obtained, connections made) | P2 | PRD section 33 itself frames this as "a major future feature" — there's no outcome data to show it until after launch anyway |
| Audit trail (who verified/changed what) | P0 | Not optional given this is personal data reviewed by multiple admins — PRD section 50 lists this under Security, and Stage 4 confirms it's a real requirement even though the *detailed* security spec is deferred |

## Cross-cutting

| Feature | Tier | Note |
|---|---|---|
| Verification model: membership + credential badges with resolved copy | P0 | Already decided and designed — [stage-3-ux.md](stage-3-ux.md) closing section |
| Controlled skills/profession taxonomy | P1 | Real gap (Stage 4 item 8), improves matching quality, but free-text search still functions without it at launch — don't let this block P0 work |
| Mobile-responsive member experience | P0 | PRD section 52: mobile-first is a stated principle, not optional |
| Empty states (no opportunities, no applications, no results) | P0 | Cheap to build, expensive to skip — a broken-feeling empty screen undermines trust in a v1 |

## Explicitly out — P2, per PRD section 48 and Stage 4 item 15 confirmation

Employer/organization self-service accounts and talent-request submission · Project management module (multi-professional project teams) · Business network / verified-business listings · Messaging beyond notifications · AI-assisted or recommendation-based matching · Payments · Public/indexable profiles · Social feed · Marketplace transactions · A dedicated mobile app (the responsive web experience covers this)

No new reasoning needed here — this list matches PRD section 48 exactly. Restated so this document is a complete standalone reference rather than requiring a second lookup.

---

## What P0 actually adds up to

Reading straight down the P0 rows: a member can register, build a real profile (personal info, profession, education, experience, skills, CV, availability), get verified by a Church Admin against the two badges, and see matching opportunities. An admin can search the directory, create an opportunity, get an explainable match list, shortlist, and track applications through to an outcome, with an audit trail behind every verification decision. Nothing in that loop depends on a P1 or P2 item.

That loop is exactly the PRD's own "MVP definition of done" (section 60) and "aha moment" (source checklist item 52, and PRD section 52's admin-dashboard framing) — this freeze doesn't redefine what MVP means, it just makes the feature list behind that definition explicit and checkable.

## What this unblocks

[stage-6-user-journeys.md](stage-6-user-journeys.md) is built directly from the P0 row list above — every journey maps to a P0 feature, and no journey is written for a P1/P2 feature. If a future feature request doesn't appear as a P0 row here, treat that as a signal to check this table before building it, not a reason to assume it's in scope.
