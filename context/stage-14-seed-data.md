# Stage 14 — Seed / Demo Data Plan

Written 2026-09-09, by Champion. Item 11 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Dashboards, search, and matching all look and behave differently with 5 records vs. 500 — this document specifies what realistic seed data should look like, both for development/QA and for the actual launch cold-start problem.

Two distinct needs, kept separate since they serve different purposes:

## A. Development/QA seed data — fictional, larger scale

For building and testing against, matching the scale already implied in [stage-3-ux.md](stage-3-ux.md)'s mockup numbers (2,450 members, 1,980 verified, 420 available, 27 opportunities) and used in the published UI artifact.

- **~200-300 fictional member profiles** (not the full 2,450 shown in mockups — that number is illustrative of a mature system, not a QA dataset; 200-300 is enough to exercise pagination, search relevance, and matching without needing a synthetic-data generator). Distributed across [stage-10-taxonomy.md](stage-10-taxonomy.md)'s profession categories, roughly weighted toward the categories a Tanzanian urban congregation would plausibly have more of (Business & Administration, Transport & Logistics, Trade & Technical, Education) over rarer ones (Legal, Healthcare specialists), so the seed data doesn't accidentally imply an unrealistic professional mix.
- **Mixed verification states** — some Confirmed/Reviewed, some Pending, some Needs Correction — so the verification queue (Journey 4) and directory-visibility gate (Stage 7, Stage 13's scenario) can actually be tested against non-trivial data, not an all-verified or all-pending set that hides bugs in the gate logic.
- **Mixed availability** (Open / Selective / Not available) in realistic proportions — not everyone Open, so Stage 9's availability filter has something to filter.
- **A handful of active opportunities**, including at least one that mirrors the founding use case exactly: **3 driver roles, 1 HR Manager role**, matching the original transcript's ask (Journey 1's origin, project-brief.md), so the seed data can demonstrate the actual scenario that started this project, not only generic examples.
- **Applications in every state** of the Application machine (Stage 7) — Applied, Reviewed, Shortlisted, Interview, Selected, Rejected, Withdrawn — so Stage 13's scenarios have real records to run against.

**Reuse, don't reinvent, the names already in use.** The published UI artifact and Stage 3's mockups already established a small fictional cast (John Michael/Mwangi — Civil Engineer; Sarah Kessy/K. — HR Manager; David Mwakalindile — Accountant; Grace Rweyemamu — Driver; ABC Logistics Ltd; Baraka Construction; Kilimo Fresh Distributors). Development seed data should extend this cast rather than invent a disconnected one, so screenshots, this project's documents, and the actual dev environment all show a recognizably consistent world.

## B. Launch seed data — real, not fictional

This is the actual cold-start problem, distinct from QA data and not something this document can populate on its own, since it requires real people's consent and real information.

- **First real profiles should be seeded by Church Admins directly**, not through open self-registration, for the first batch — Stage 6's Journey 1 assumes a member self-registers, but a completely empty directory at public launch undermines the "aha moment" (an admin searches and gets real, explainable results). Recommend: Church Admins identify and directly enter or assist ~20-50 known professionals across a spread of professions before any public "create your profile" announcement, mirroring Stage 4 item #51's own recommended pilot size.
- **The founding opportunity should be the first live one.** The businessman's original ask (drivers, managers, HRs) is the product's actual origin story — if those roles are still open when the system launches, they should be the first real Opportunity created, not a placeholder. If they've already been filled by hand (as separately confirmed in an earlier conversation), the first live opportunity should still be something concrete and real, not a demo placeholder, so the first thing anyone sees in the live system is genuine, not staged.
- **Who does this seeding is not yet named.** Church Admins are confirmed as who verifies and who runs the platform generally (memory: compliance_deferred_to_post_launch.md), but whether the same people do this initial 20-50-profile outreach, or whether it's a separate short-term task, isn't decided. Flag for Champion or the ministry to assign once build is closer to done.

## What this document does not do

Does not generate an actual seed script or fixture file — that's implementation work tied to whatever stack/database is eventually chosen (deferred per the compliance/architecture decision). This document is the content and sizing plan a seed script should be built from, so that work doesn't start from a blank page once the stack is picked.
