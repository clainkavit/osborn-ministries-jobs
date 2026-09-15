# Stage 18 — Development Milestones

Written 2026-09-09, by Champion. Item 14 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. A vertical-slice breakdown of the P0 scope ([stage-5-mvp-freeze.md](stage-5-mvp-freeze.md)) into buildable, demoable milestones — each one should produce something that actually runs, not an internal layer nobody can see yet.

Not dated (no team, no stack, no velocity known yet — dating this would be inventing precision that doesn't exist). Ordered by dependency: each milestone assumes the ones before it are done, and names what it unlocks.

## M1 — Auth + skeleton

Registration, login, logout, password reset. Member and Admin login as distinct entry points (screens per [stage-17-screen-specs.md](stage-17-screen-specs.md)). The app shell (sidebar nav, topbar) from [stage-3-ux.md](stage-3-ux.md), empty of real content.
**Demoable as:** someone can create an account and log in. Nothing else works yet.

## M2 — Member profile

Full 8-step onboarding, profile editing, CV/document upload, availability toggle. Backed by [stage-15-data-model.md](stage-15-data-model.md)'s Member/Education/Experience/Skill/Certification/Document entities and [stage-16-api-shape.md](stage-16-api-shape.md)'s `/members/me/*` endpoints.
**Demoable as:** a member can build a complete profile end to end (Journey 1, steps 1-5). No verification, no matching yet — the profile just sits in Registered/Profile Complete.

## M3 — Verification

Verification Queue, Verification Review, the two independent tracks (Membership/Credentials) and their state machine ([stage-7-state-machines.md](stage-7-state-machines.md)), audit trail (VerificationHistory), member-facing correction flow (Journey 2).
**Demoable as:** an admin can review M2's test profiles and approve/reject them; a member sees their badges change and can respond to a correction request. **This is the first milestone where the trust model itself — the actual point of the product — becomes visible**, even before any opportunity exists.

## M4 — Directory

Professional directory (search/filter), admin professional profile view, the both-tracks-required visibility gate ([stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)'s directory-visibility scenario is the milestone's core acceptance test).
**Demoable as:** an admin can search and find M3's verified members. Still no opportunities — this proves the "know your people" half of the product independent of the "connect them to opportunities" half.

## M5 — Opportunities

Create Opportunity (5-step flow), the Opportunity state machine (Draft→Published→Closed/Cancelled/Filled), member-facing browse/detail screens.
**Demoable as:** an admin can publish an opportunity (ideally the actual founding case — 3 drivers, HR Manager, per [stage-14-seed-data.md](stage-14-seed-data.md)) and a member can view it. No matching or applying yet.

## M6 — Matching

[stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s weighted formula, the Find Matches screen with per-criterion breakdown, `GET /admin/opportunities/:id/matches`.
**Demoable as:** **the "aha moment" itself** — an admin publishes an opportunity, hits Find Matches, and sees a ranked, explainable list of M4's verified professionals. This is the single most important milestone to get right and to actually demo to the pastor/CEO once it's working, since it's the concrete proof the concept works, not just a working CRUD app.

## M7 — Applications

Apply flow (with the verification-gate and duplicate-application checks from [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)), My Applications, Application Management (admin), the full Application state machine, Shortlist and its Stage 8 contact-info-visibility side effect, outcome recording.
**Demoable as:** the complete loop — member applies, admin shortlists (contact info unlocks), records an outcome. This closes Journey 7 end to end.

## M8 — Notifications

In-app notifications for every trigger in [stage-12-notification-copy.md](stage-12-notification-copy.md), Notifications screen, read/unread state.
**Demoable as:** every prior milestone's actions (verified, shortlisted, selected, correction needed) now actually notify the member, instead of requiring them to check manually.

## M9 — Admin dashboard + polish pass

Admin Dashboard's KPIs and "needs attention" tiles, empty/loading/error states from [stage-11-states-catalog.md](stage-11-states-catalog.md) applied across every screen built in M1-M8 (many will have been stubbed with basic states during their own milestone; this is the pass that makes sure none were skipped), responsive behavior verified against [stage-17-screen-specs.md](stage-17-screen-specs.md)'s per-screen responsive notes.
**Demoable as:** the product feels finished, not just functional — this is the milestone that turns "it works" into "it's ready for real people."

## M10 — QA, seed data, launch prep

Run every scenario in [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md) against the built system. Load [stage-14-seed-data.md](stage-14-seed-data.md)'s development dataset for a final realistic-scale check (does the directory/matching still feel right at 200-300 profiles, not just the 5-10 used during M1-M9 development). Begin the real launch seeding process (Stage 14 section B) — Church Admins identifying the first 20-50 real professionals — in parallel with this milestone, not after it, since that outreach takes real time independent of engineering.
**Demoable as:** ready for the pilot (Stage 4 item #51's recommended 20-50 member pilot before opening to the whole congregation).

---

## What's deliberately not a milestone here

Technical architecture setup (repo structure, environments, CI/deploy pipeline, monitoring) isn't milestone 0 in this list, because it's part of the deferred technical-architecture decision, not this project's product-milestone sequence — whoever picks up the stack decision should slot an M0 in front of M1 covering exactly that, once the stack is chosen. This document assumes that groundwork exists by the time M1 starts, it doesn't plan it.

## Dependency notes worth flagging

- M6 (Matching) cannot be meaningfully demoed without M3 (Verification) and M4 (Directory) already producing real verified profiles — there's no shortcut to skip ahead to the "impressive" milestone.
- M7's Stage 8 contact-info-visibility behavior needs M3's verification gate and M6's matching both already correct, since it's layered on top of the same Member/Application data those milestones establish.
- Nothing above blocks starting the real launch-seeding conversation (Stage 14 section B — who does the outreach, is it Church Admins) well before M10; that's a people/process decision independent of engineering progress and can run in parallel from M3 onward once the trust model is visibly working.
