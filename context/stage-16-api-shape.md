# Stage 16 — API Shape

Written 2026-09-09, by Champion. Item 9 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Not a framework-specific API implementation (that's downstream of the deferred stack decision, per [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md)) — this is the *shape* of the contract between frontend and backend: what operations exist, grouped by the entities in [stage-15-data-model.md](stage-15-data-model.md) and the journeys in [stage-6-user-journeys.md](stage-6-user-journeys.md). Written as REST-style paths for concreteness, since that's the easiest shared vocabulary regardless of what actually implements it (REST, GraphQL, or RPC) — the operations list matters more than the exact verb/path convention.

## Auth

```
POST   /auth/register          Journey 1, step 2
POST   /auth/login
POST   /auth/logout
POST   /auth/password/reset-request
POST   /auth/password/reset
GET    /auth/session            check current session validity — needed for Stage 11's "session expired" handling
```

## Member profile (self-service)

```
GET    /members/me
PATCH  /members/me                          personal info, availability toggle (Journey 3)
POST   /members/me/education
PATCH  /members/me/education/:id
DELETE /members/me/education/:id
POST   /members/me/experience
PATCH  /members/me/experience/:id
DELETE /members/me/experience/:id
POST   /members/me/skills                    attach a Skill (Stage 15's MemberSkill join)
DELETE /members/me/skills/:skillId
POST   /members/me/certifications
PATCH  /members/me/certifications/:id
DELETE /members/me/certifications/:id
POST   /members/me/documents                  CV/certificate upload (Journey 1, step 3)
DELETE /members/me/documents/:id
POST   /members/me/submit-for-verification     Journey 1, step 4 — triggers both tracks → Pending (Stage 7)
```

## Professional directory (admin-facing read)

```
GET    /professionals                          list/search — query params: profession, skill,
                                                 location, min_experience, availability, verification
GET    /professionals/:id                       full profile, admin view (PRD section 24)
```

Deliberately a separate namespace from `/members` even though it's largely the same underlying data — `/members/me` is self-service, `/professionals` is the admin-facing, verification-gated, filtered view (per Stage 7's directory-visibility gate: this endpoint should only ever return members where both verification tracks are Confirmed/Reviewed, enforced server-side, not left to the frontend to filter).

## Verification

```
GET    /admin/verification-queue                filterable: All | Pending | Approved | Needs correction (PRD section 23)
POST   /admin/members/:id/verify-membership      body: { decision: Approved|NeedsCorrection, note? }
POST   /admin/members/:id/verify-credentials      body: { decision: Approved|NeedsCorrection, note? }
GET    /admin/members/:id/verification-history    (Stage 15's VerificationHistory, also the audit trail)
```

Kept as two separate endpoints (verify-membership, verify-credentials) rather than one generic `/verify`, since Stage 7 established the two tracks are independently approved — a single combined endpoint would make it easy to accidentally couple them.

## Opportunities

```
GET    /opportunities                            member-facing browse (Journey 1, step 10) — only Published
GET    /opportunities/:id
POST   /admin/opportunities                       create (Journey 5, steps 1-2) — starts as Draft
PATCH  /admin/opportunities/:id                    edit while Draft
POST   /admin/opportunities/:id/publish            Draft → Published (Stage 7)
POST   /admin/opportunities/:id/close              Published → Closed. Blocks new applications only —
                                                    per Stage 7's decided behavior, does NOT touch
                                                    existing applications automatically
POST   /admin/opportunities/:id/applications/close-remaining
                                                    admin's explicit bulk action (Stage 7) to reject
                                                    every still-open application on a closed opportunity —
                                                    separate from /close itself, since closing and
                                                    rejecting-in-bulk are two different admin decisions,
                                                    not one action
POST   /admin/opportunities/:id/cancel
GET    /admin/opportunities/:id/matches            Journey 5, step 4 — runs Stage 9's matching algorithm,
                                                    returns ranked results WITH the per-criterion
                                                    breakdown (Stage 9's explainability requirement is
                                                    a response-shape requirement, not just a UI choice —
                                                    the breakdown must come from the API, not be
                                                    reconstructed client-side)
```

## Applications

```
POST   /opportunities/:id/apply                   member-facing (Journey 1, step 10) — server must
                                                    reject if already applied (Stage 13's duplicate-
                                                    application scenario) and reject if member isn't
                                                    verified (Stage 11's verification-gate error)
GET    /members/me/applications                    My Applications (Journey 1, step 11)
GET    /admin/opportunities/:id/applications        per-opportunity list (Journey 7)
PATCH  /admin/applications/:id/status               body: { status: Reviewed|Shortlisted|Interview|
                                                      Selected|Rejected } — server enforces the Stage 7
                                                      state machine's legal transitions, not any status
                                                      to any status
POST   /admin/applications/:id/shortlist            convenience endpoint over the PATCH above — kept
                                                      separate because Stage 8's contact-info visibility
                                                      change is a meaningful side effect worth its own
                                                      explicit action, not buried in a generic status PATCH
GET    /admin/applications/:id                       full detail — contact info only included in the
                                                      response once status is Shortlisted or later
                                                      (Stage 8, Stage 13's shortlist scenario)
```

## Notifications

```
GET    /members/me/notifications
PATCH  /members/me/notifications/:id/read
```

## Reference/taxonomy data (Stage 10)

```
GET    /professions                                for the searchable onboarding field (Journey 1, step 3)
GET    /skills?profession=:professionId             suggested-skills-per-profession (Stage 10)
GET    /industries
```

Read-only, admin-managed elsewhere (not exposed as a public write endpoint in MVP — growing the taxonomy is an operational task, not a member-facing feature, per Stage 10's note that an unlisted profession should fall back to free text rather than blocking registration).

## What this document does not decide

Authentication mechanism (session cookies vs. tokens), pagination convention, error response shape, versioning — all implementation details that follow from the stack choice. This document establishes *what operations must exist and what each one's meaningful side effects are* (the gates, the state-transition rules, the response-shape requirements like Stage 9's explainability), which holds regardless of which framework ends up implementing them.
