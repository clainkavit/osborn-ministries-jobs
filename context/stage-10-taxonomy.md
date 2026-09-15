# Stage 10 — Profession, Skills & Industry Taxonomy

Written 2026-09-09, by Champion. Item 8 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Without this, free-text entry means "Software Developer," "Software Engineer," and "Developer" are unrelated strings to search and matching (the exact problem [stage-2-prd.md](stage-2-prd.md) section 14 and [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s profession_match note both flag).

Per [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md), a full taxonomy is P1, not P0 — free text ships at launch. This document exists so that when it's built, it isn't invented from scratch, and so the registration/onboarding screens (Stage 3) know roughly what list they're pointing a searchable field at, even before the full taxonomy is finalized.

## Structure: two-level, not deep

Profession and Industry each get a two-level hierarchy (category → specific profession), not the three-or-more-level trees some ATS systems use. A two-level list is easier for a member to self-select from during onboarding (Stage 3's "searchable profession field," Journey 1 step 3) and easier for an admin to reason about when filtering the directory — depth adds precision matching software doesn't currently need at this scale.

## Profession categories (seed list, not exhaustive)

Built from three sources: the PRD's own recurring examples (sections 1, 36), the founding use case (drivers, managers, HRs — Journey 1's origin), and Stage 6's seed-data candidates (engineers, teachers, accountants, HR professionals, business owners, designers, technicians).

| Category | Professions |
|---|---|
| **Engineering & Construction** | Civil Engineer, Mechanical Engineer, Electrical Engineer, Architect, Quantity Surveyor, Site Supervisor, Electrician, Plumber |
| **Business & Administration** | HR Manager, HR Officer, Office Administrator, Operations Manager, Project Manager |
| **Finance & Accounting** | Accountant, Auditor, Bookkeeper, Financial Analyst |
| **Technology** | Software Developer, IT Support, Network Technician, Data Analyst |
| **Education** | Teacher, Tutor, School Administrator |
| **Healthcare** | Nurse, Clinical Officer, Pharmacist, Lab Technician |
| **Transport & Logistics** | Driver, Logistics Coordinator, Fleet Manager |
| **Legal** | Advocate, Paralegal, Legal Secretary |
| **Trade & Technical** | Welder, Mechanic, Carpenter, Tailor |
| **Sales & Marketing** | Sales Representative, Marketing Officer, Customer Service |
| **Creative & Design** | Graphic Designer, Photographer, Videographer |

Each profession also carries **synonym tags** for search, so a free-text search for "HR" still surfaces "HR Manager" and "HR Officer," and "civil engineering" surfaces "Civil Engineer" — this is what actually solves the PRD section 14 problem, not the category structure alone.

This list is a starting point, expected to grow as real member profiles get created — it should not block onboarding (a member whose profession isn't listed yet should be able to submit free text that an admin can later fold into the taxonomy, not be blocked from registering).

## Skills — flat list, not categorized, with per-profession suggested sets

Unlike profession, skills don't need a category hierarchy — they're tags attached to a profile (Stage 3's "small tags" UI, already designed), and a member typically has skills spanning what their profession implies plus a few extras. Structure instead as:

- **A flat, growing list of known skills** (AutoCAD, Project Management, Structural Design, Recruitment, Bookkeeping, Customer Service, Class C Driving License, etc.) with the same synonym-tagging approach as professions.
- **A suggested-skills set per profession category**, shown first when a member picks their profession during onboarding (e.g. selecting "Civil Engineer" surfaces AutoCAD, Structural Design, Construction Management, Project Management as one-tap suggestions before free entry). This directly serves Stage 3's stepped onboarding (Step 5: Skills) without requiring the member to type from nothing.

## Industry — mirrors profession categories, not a separate list

PRD section 11 lists Industry as a distinct field from Profession ("Civil Engineer" / "Construction"). Rather than maintain two independent taxonomies, Industry should be **derived from the Profession category** by default (Civil Engineer → Construction; HR Manager → Business & Administration), with the option to override for members whose profession spans industries (e.g. an Accountant could be in Finance, or embedded in a Construction firm's finance department). This keeps the taxonomy from doubling in maintenance burden for a field the PRD itself treats as secondary to Profession in matching weight (Stage 9's weights don't score Industry at all — it's descriptive, not a matching input).

## Employment types and education levels — short, fixed lists, no hierarchy needed

Already effectively fixed by the PRD's own text, just consolidating here so they live somewhere:

- **Employment status** (PRD section 11): Employed, Self-employed, Business owner, Freelancer, Student, Unemployed, Retired, Other.
- **Education level** (for matching, PRD section 11/38): no formal education stated, Secondary/Certificate, Diploma, Bachelor's, Master's, Doctorate. Used by [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s education_match as an ordered scale (Bachelor's ≥ Diploma, etc.), so this list needs to stay ordered, not alphabetical, wherever it's implemented.
- **Opportunity types** (PRD section 26, Stage 5's P0 scope): Employment, Church Opportunity, Service. (Project and Business are P2 per Stage 5 — don't add them to this list's active options yet, even though PRD sections 40-41 describe them as future types.)

## What this document doesn't do

Doesn't produce a database-ready seed file (that's part of Stage 15/16's seed-data and schema work) or a UI mockup (Stage 3 already has the relevant screens' shape, e.g. the searchable profession field). This is the content decision — the actual category/profession/skill lists and the reasoning for the structure — that those downstream artifacts should be built from, so the taxonomy isn't invented a second time when someone gets to seed data or the onboarding screen's actual autocomplete list.
