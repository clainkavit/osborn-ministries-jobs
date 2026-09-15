# Stage 4 — Pre-Development Blueprint

Received 2026-09-09, from another source ("other inputs from somewhere else" — not the same drafting session as Stages 1-3, and not verified against this project's specific decisions before arriving). A 54-item checklist of what stands between the PRD/UX work done so far and writing production code, framed as: Vision → Product Definition → PRD → UX → UI → **Functional Specification → Technical Architecture → Data Model → Security → Development → QA → Launch**, with the claim that this project is currently at UI/UX and the middle is unfinished.

**This file does the sorting the source document didn't do for this project specifically:** many of its 54 items are already answered by [stage-2-prd.md](stage-2-prd.md), [project-brief.md](project-brief.md), or Champion's 2026-09-09 decisions (see [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md)). Restating those as open would contradict decisions already made. What follows is organized in three tiers: **already answered** (pointer only, not restated), **genuinely new gaps** (kept in full, this is the real content of this stage), and **deferred by earlier decision** (pointer only).

**Update, 2026-09-10:** two items below were current when this stage was written and are now stale. **#13 Technology stack is no longer deferred** — see [stage-19-technical-architecture.md](stage-19-technical-architecture.md), decided following an external spec review. **#25 Church/branch architecture is no longer open** — decided ministry-only (branches within Pastor Tony Osborn Ministries, not a multi-church SaaS platform), see the PRD's closing section. Left the original text below unchanged rather than edited in place, since this document is a historical sorting pass, not a living spec — [stage-2-prd.md](stage-2-prd.md) and [stage-19-technical-architecture.md](stage-19-technical-architecture.md) are where the current answers live.

---

## Already answered elsewhere — not restated as open here

| Item from the source checklist | Where it's actually answered |
|---|---|
| #2 Permissions matrix | [stage-2-prd.md](stage-2-prd.md) sections 37-38 (narrative form; a literal matrix table is one of the new gaps below) |
| #6 Verification mechanism (who verifies) | Church Admins — see brief open question 3, PRD sections 19-21. Criteria (on what basis) is still open, not new — see the Still Open list below |
| #7 Privacy/visibility table | PRD section 38, nearly identical to the source's version |
| #13 Technology stack | Explicitly deferred by decision — "bring this up later, when the system is running" |
| #21 Notification architecture | Answered — in-app only, "the app sends the notification," no SMS/WhatsApp for v1 |
| #25 Church/branch architecture | PRD section 39 already has this; whether it's deliberate vs. scope creep is an existing open item, not new |
| #26 MVP scope: church-controlled vs. employer portal | PRD section 6.3 already resolves this the same way the source document independently recommends: church-controlled for MVP, employer accounts future-facing |
| #34 Legal/privacy requirements | Folded into the compliance deferral — post-launch, not pre-build |
| #38 Who operates the platform | Church Admins — already answered |
| #53 What not to build | PRD section 48's MVP non-goals list, nearly identical to the source's version |

---

## Deferred by earlier decision — not re-opened here

Per [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md), these wait until the system is confirmed running:

- #13 Technology stack, #46 Infrastructure (environments, migrations, monitoring), #47 Backup and recovery, #48 Deployment process — all technical-architecture items, deferred together.
- #23 Security specification, #24 Audit logging — real requirements (and PRD sections 49-50 already list baseline expectations), but the *detailed* spec work waits with the rest of technical architecture.
- #34 Legal/privacy documents (Terms of Service, Privacy Policy, consent, deletion) — folded into the PDPA/employment-agency deferral.

---

## Genuinely new — not covered by any existing document

This is the real content of Stage 4. Kept close to the source's own framing, trimmed of items already covered above.

### 1. MVP feature freeze (P0 / P1 / P2)

The PRD has an MVP feature list (section 8-9) and a non-goals list (section 48), but not a single frozen table classifying every feature as P0 (must exist), P1 (soon after launch), or P2 (explicitly excluded). Worth producing before development starts — it's the one artifact every other estimate (sprints, timeline) depends on.

### 2. Complete user journeys, mapped step by step

The PRD and UX doc describe journeys in prose (PRD section 58, UX section 15). Not yet done as explicit step-by-step flows for: new member, existing member, admin verification, opportunity creation, professional search, matching, shortlisting, application, rejection, correction, successful connection. Worth doing before screen-level functional specs, since the flow determines what each screen needs.

### 3. Screen-by-screen functional specification

Stage 3 describes screens narratively (layout, content, tone). Not yet defined per screen: exact inputs, exact actions, exact permissions per role, exact states (unverified / pending / verified / needs correction / incomplete / no CV / no experience), and responsive behavior at each breakpoint. This turns "Professional Profile screen" into something a developer can build without guessing.

### 4. State machines for core entities

**Member:** Registered → Profile Incomplete → Profile Complete → Verification Pending → Verified → Active, with alternate states (Needs Correction, Suspended, Rejected, Inactive).

**Opportunity:** Draft → Published → Accepting Applications → Closed → Selection → Completed, with alternates (Cancelled, Expired, Filled). Needs an explicit rule for what happens to open applications when an opportunity closes.

**Application:** Applied → Reviewed → Shortlisted → Interview → Selected, with Rejected as an alternate. Each transition needs its actual behavior defined (does "Reviewed" notify the member? What does an Interview record — date, time, location, instructions? Does "Rejected" show a reason or just "Not selected"?).

None of these exist as formal state machines yet, only as informal progressions in prose.

### 5. How "connect" actually works

Genuinely undefined anywhere so far. When an admin clicks "Contact" or "Shortlist" on a candidate, what actually happens? Four options on the table:
- **A.** Reveal the member's phone number directly.
- **B.** Notify the member: "A church administrator is interested in connecting with you."
- **C.** Create a formal connection request the member accepts/declines.
- **D.** Admin contacts the member through an in-platform channel.

The source recommends a **controlled connection** (B or C) over directly exposing contact info (A), consistent with the PRD's existing privacy stance (section 38: phone/email are "Controlled" for employers, not automatically shared) and the "discoverability without unnecessary exposure" principle. Worth a decision, since it's currently just implied by adjacent privacy rules, not stated outright.

### 6. Matching algorithm — actual weights, not just relative importance

PRD section 29 ranks factors (Profession Very High, Skills High, Experience High, Availability High, Location Medium, Education Medium, Verification Very High) but never turns that into a formula. A concrete starting point, not yet decided:

```
Profession       30%
Skills           20%
Experience       15%
Availability     15%
Verification     10%
Location          5%
Education         5%
```

Whatever the actual weights end up being, the system should still explain the result per-candidate (already established in PRD section 29 and Stage 3 section 10's "match explanation" principle) — this item is about the number, not the explainability requirement, which is already decided.

### 7. Database schema / ERD

The PRD names entities (section 44) and the primary relationship chain (section 45), but not actual field-level schema or foreign-key relationships. This is real technical-architecture work — arguably it belongs inside the deferred stack decision rather than as a separate pre-build gate, since a schema is hard to finalize before the stack (relational vs. document store) is chosen. Flagging it here rather than filing it under the deferral, since Champion should decide explicitly which bucket it's in.

### 8. Controlled taxonomy for professions, skills, industries

Real gap: free-text profession/skill entry means "Software Developer," "Software Engineer," "Developer," and "Full Stack Dev" are seen as unrelated by search and matching. The source recommends a controlled taxonomy (e.g. Engineering → Civil / Mechanical / Electrical / Software) over free text, matching PRD section 14's own aside about "Human Resources" vs. "HR." No taxonomy exists yet. This affects both the registration UI (Stage 3's searchable profession field) and matching quality, so it's worth deciding before those are built out further, not after.

### 9. API specification

Not started. Needs a defined contract (REST or otherwise) between frontend and backend — auth, member profile, professional directory, opportunities, applications, admin verification actions. Depends on the stack decision, so it's downstream of the deferred technical-architecture work, but the *shape* of the API (what operations exist) can reasonably be drafted from the PRD's feature list independent of which framework implements it.

### 10. Acceptance criteria / QA scenarios, written as tests

PRD section 57 has some acceptance criteria (when is a profile complete, when does a professional appear in the directory, when can an opportunity publish). Not yet extended to Given/When/Then style scenarios covering registration, verification, matching, application flow, and QA categories (functional, cross-browser, cross-device, security, performance). This is what turns the spec into a developer's actual definition of done.

### 11. Seed/demo data

Needs realistic fake data (the mockup artifacts already show a taste of this — Sarah Kessy, John Michael, ABC Logistics, etc.) at real scale, since dashboards, search, and matching all look and behave differently with 5 records vs. 500. Worth producing before or alongside development, not after.

### 12. Loading, empty, and error states, enumerated completely

Stage 3 covers empty states for opportunities/applications/professionals (section 12) and this new source adds more (failed login, expired session, failed upload, CV too large, invalid file type, network failure, opportunity expired, duplicate application, suspended account). Worth consolidating into one list so nothing gets built without a defined failure mode.

### 13. Email and in-app notification copy, written out

PRD section 34 lists notification *events*. Neither PRD nor UX has actual final copy for each (welcome email, verification approved, verification needs correction, new matching opportunity, shortlisted, interview scheduled, application outcome). Since notifications are in-app only per the earlier decision, this is now about in-app copy specifically, not email templates — the source's email-template framing (item #42) is partly moot given that decision.

### 14. Development milestones / sprint breakdown

Not started. A vertical-slice breakdown (auth → profile → verification → directory → opportunities → matching → applications → admin → QA) makes the build controllable and estimable, once the above items give it something concrete to slice.

### 15. Operational workflow validation with actual church leadership

The source's "every morning, admin opens Verification Queue" scenario is a reasonable guess, but it hasn't been checked against how Church Admins would actually work day to day. Worth a short conversation once admins are named, likely alongside resolving verification criteria (still open, see below).

---

## Still open, unchanged — not new, just re-surfaced by this document

- **Verification criteria** (on what basis Church Admins approve membership/credentials). Confirmed in memory as the one item not covered by the compliance deferral — this document's #6 independently arrives at the same gap ("we haven't yet decided how membership gets confirmed mechanically — membership number? branch? admin confirmation?").
- **Church/branch architecture intent** — is multi-branch deliberate.
- **Content/seed plan for launch** — overlaps with item 11 above (seed data), but the *product* question (does the businessman's original three-role ask become the first live opportunities) is still Champion's call, not a data-generation task.

---

## What to do with this

Not a decision document — a map of what's left. The 15 genuinely-new items above are real gaps regardless of who raised them; the earlier tiers exist so this file doesn't relitigate settled ground. When Champion is ready to move past Stage 3, working through the "genuinely new" list — likely starting with the MVP freeze (item 1) and user journeys (item 2), since several other items depend on those — is the concrete next step, not the deferred technical-architecture items.
