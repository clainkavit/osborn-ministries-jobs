# Stage 13 — Acceptance Criteria & QA Scenarios

Written 2026-09-09, by Champion. Item 10 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. [stage-2-prd.md](stage-2-prd.md) section 57 has some acceptance criteria already (when is a profile complete, when does a professional appear in the directory, when can an opportunity publish); this document extends that into Given/When/Then scenarios covering the full P0 scope from [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md), built directly from [stage-6-user-journeys.md](stage-6-user-journeys.md) and [stage-7-state-machines.md](stage-7-state-machines.md). This is the developer's actual definition of done — not exhaustive test-case enumeration, but the scenarios that prove each P0 journey works.

## Registration & profile

**Scenario: successful registration**
Given a person is not registered, when they submit valid first name, last name, phone/email, and password, then an account is created and they proceed to profile onboarding.

**Scenario: duplicate registration blocked**
Given a phone/email already has an account, when someone tries to register with it again, then registration is refused with the copy from [stage-11-states-catalog.md](stage-11-states-catalog.md) ("An account already exists…") and no duplicate account is created.

**Scenario: onboarding resumes after interruption**
Given a member closed the app partway through the 8-step onboarding (Journey 1, step 3), when they return, then they resume at the step they left, not from Step 1, and previously entered data is retained.

**Scenario: profile reaches Profile Complete**
Given a member has filled every P0 field (personal info, profession, education, experience, skills, CV, availability — per Stage 5), when they select "Submit for verification," then the profile transitions Registered → Profile Complete (Stage 7) and both verification tracks enter Pending.

**Scenario: submission blocked on missing P0 field**
Given a member has not uploaded a CV (a P0 field), when they attempt to submit for verification, then submission is refused with an inline error naming the missing field (per Stage 11), and the profile stays in Registered.

## Verification

**Scenario: membership approved**
Given a member's Membership track is Pending, when a Church Admin approves it, then the track transitions to Confirmed (Stage 7), an audit log entry is written (who/what/when), and the member receives the notification defined in [stage-12-notification-copy.md](stage-12-notification-copy.md).

**Scenario: credentials need correction**
Given a member's Credentials track is Pending, when a Church Admin requests correction with a note, then the track transitions to Needs Correction, the note is attached and visible to the member (Journey 2), and the member is notified.

**Scenario: correction resubmission returns to Pending**
Given a member's track is Needs Correction, when the member edits the flagged section and resubmits, then that track returns to Pending (Stage 7) — not directly to Confirmed/Reviewed, it re-enters the queue.

**Scenario: directory visibility requires both tracks approved**
Given a member has Membership: Confirmed but Credentials: Pending, when an admin searches the directory, then this member does NOT appear in results (Stage 7's decided gate — both tracks required). This is the one scenario most worth a developer double-checking against Stage 7's flagged decision, since getting the boolean wrong here (OR instead of AND) silently breaks the trust model.

## Directory & search

**Scenario: search returns relevant results**
Given at least one verified member has profession "Civil Engineer," when an admin searches "Civil Engineer," then that member appears in results. *(Note: with taxonomy not yet built per Stage 5's P1 classification, this scenario is exact/substring text match only — a search for "Engineer" alone matching "Civil Engineer" is acceptable at MVP; a search for a true synonym like "Structural Engineer" matching "Civil Engineer" is NOT expected to work until Stage 10's taxonomy ships.)*

**Scenario: filters narrow correctly**
Given the directory has members with mixed availability, when an admin filters to "Available," then only Open (not Selective or Not Available) members from Stage 9's gate logic appear — matching Stage 9's stated behavior that Not Available members are excluded, not merely scored lower.

## Opportunities & matching

**Scenario: opportunity creation and publish**
Given an admin completes the 5-step creation flow (Journey 5) with all required fields, when they select Publish, then the opportunity transitions Draft → Published (Stage 7) and becomes immediately visible in member browse/search and in matching.

**Scenario: matching returns an explainable result**
Given an opportunity requires "HR Manager, 5+ years, Dar es Salaam," when an admin selects "Find matching professionals," then results are ranked by the [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md) formula, verification-gated and availability-filtered per that document, and each result shows the per-criterion breakdown (not just a percentage) per the decided explainability requirement.

**Scenario: an unverified member never appears in matches**
Given a member has not completed verification, when an admin runs "Find matches" against any opportunity, even one this member would otherwise qualify for, then this member does not appear — proves the verification gate applies to matching, not only to direct directory search.

## Applications

**Scenario: apply and track**
Given a verified member views an open opportunity, when they select Apply, then an Application is created in state Applied (Stage 7), they see the "Application submitted" confirmation (Stage 11), and the application appears in their My Applications list.

**Scenario: cannot apply twice**
Given a member has already applied to an opportunity, when they attempt to apply again, then the action is blocked with the copy from Stage 11 ("You've already applied…"), and no second Application record is created.

**Scenario: shortlist reveals contact info per Stage 8**
Given an admin shortlists a candidate, when the transition Applied/Reviewed → Shortlisted occurs, then (a) the member is notified per Stage 12, and (b) the admin's view of that candidate now shows phone/email — per [stage-8-connection-model.md](stage-8-connection-model.md)'s staged-visibility decision. Contact info must NOT be visible to the admin before this transition.

**Scenario: rejection shows no detailed reason**
Given an admin records an outcome as Rejected, when the member views their application status, then they see "You weren't selected for [opportunity]" (Stage 12) with no admin notes or detailed reason exposed — proves PRD section 10's stated privacy stance actually holds in the UI, not just in the copy doc.

## Cross-cutting / regression-worthy

**Scenario: audit trail exists for every verification decision**
Given any approve/reject/correction action by a Church Admin, when the action completes, then an audit log entry exists recording admin identity, action, target member, and timestamp (Stage 7, and PRD section 50 — confirmed P0 in Stage 5 despite the broader security spec being deferred).

**Scenario: badge copy matches the resolved wording everywhere**
Given a member has both tracks approved, when their profile is viewed on the member dashboard, member profile, admin directory, admin professional profile, or matching screen, then the badges read exactly "Membership confirmed" and "Credentials reviewed" in every location — not "Verified," not "Church Verified." This is a regression test specifically because that wording was deliberately fixed after drifting once already (see [memory/scope_conflict_brief_vs_stage1.md](memory/scope_conflict_brief_vs_stage1.md)) — worth keeping as a standing check precisely because it already went wrong once.

## What this document doesn't cover

Per-browser/per-device QA matrices, performance/load testing, and security penetration scenarios (Stage 4 items #20's browser/device lists, #23's security spec) are folded into the deferred technical-architecture bucket per [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md) — this document is functional/behavioral acceptance criteria only, provable against the product decisions already made, not infrastructure-dependent testing.
