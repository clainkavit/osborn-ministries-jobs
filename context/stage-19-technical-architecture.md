# Stage 19 — Technical Architecture

Written 2026-09-09. Reverses the earlier deferral: an external reviewer of [COMBINED-SPEC.md](../COMBINED-SPEC.md) argued the technology stack, database, auth, storage, and hosting approach can't reasonably wait until after launch, even at a deliberately pragmatic, non-over-engineered level — you can't code M1 without something to code it in. Champion agreed. This reverses that one piece of [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md) — **PDPA/employment-agency compliance, dispute-handling design, and detailed infrastructure hardening (backups, monitoring depth, CI maturity) stay deferred**, but the foundational stack choice does not.

## The stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + React + TypeScript | One codebase serves member and admin web UI on desktop and mobile — no separate native apps |
| UI | Tailwind CSS + shadcn/ui | Fast, consistent component system to build [stage-3-ux.md](stage-3-ux.md)'s design system on top of, rather than hand-building every button/modal |
| Forms | React Hook Form + Zod | The 8-step onboarding and 5-step opportunity creation flows ([stage-17-screen-specs.md](stage-17-screen-specs.md)) are genuinely complex forms — validation, autosave, repeatable records (multiple Education/Experience entries) |
| Backend | Next.js Server Actions / Route Handlers, TypeScript | Frontend and backend in one project for a small team; matches [stage-16-api-shape.md](stage-16-api-shape.md)'s operation list directly |
| Database | PostgreSQL via Supabase | [stage-15-data-model.md](stage-15-data-model.md)'s entities are highly relational (Member → Education/Experience/Skill/Certification, Opportunity → Requirements/Applications) — a relational database is the natural fit, not a document store |
| Authentication | Supabase Auth | Registration, login, logout, password reset, session management — covers Stage 17's Auth screens directly |
| File storage | Supabase Storage | CVs, certificates, profile photos (Stage 15's Document entity's storage_reference field, previously left abstract, now concrete: a Supabase Storage path) |
| Authorization | PostgreSQL Row Level Security + server-side checks | Enforced at the database level, not just hidden in the frontend — matters because this project handles real personal data (education, employment history, phone, email, documents) even though PDPA registration itself is still deferred; the technical safeguard doesn't need to wait on the paperwork |
| Search | PostgreSQL search | Sufficient at MVP scale (Stage 14's seed-data sizing: 200-300 dev records, low thousands at real scale) — no Elasticsearch/Typesense until usage actually demands it |
| Matching engine | Custom TypeScript module implementing [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s formula directly | Explainable by construction — the algorithm doc's per-criterion breakdown requirement is easiest to satisfy when the scoring logic is plain, readable code, not a black-box service |
| Notifications | Postgres table + in-app delivery | Matches the already-decided in-app-only scope ([project-brief.md](project-brief.md)) |
| Testing | Vitest (unit — matching logic, validation) + Playwright (browser — the full journeys from [stage-6-user-journeys.md](stage-6-user-journeys.md), cross-browser) | Matches this workspace's own standing convention (root CLAUDE.md: Vitest is the default test runner for any TS/JS project here) |
| Hosting | Vercel (app) + Supabase (data/auth/storage) | Predictable deploy from GitHub, minimal ops overhead for a small team |
| Source control | GitHub | |
| Monitoring | Sentry | Errors/performance, once real traffic exists |
| Analytics | PostHog (or similar) | Product usage — separate from the Impact analytics Stage 5 already marks P2; this is developer-facing usage data, not the pastor-facing impact dashboard |
| Domain | A subdomain of the ministry's own domain (e.g. `network.` or `professionals.` prefix) rather than a standalone domain | Reinforces this is a church initiative, not an unrelated product — ties back to [project-brief.md](project-brief.md)'s core point that the trust model, not the software, is the differentiator |

## The philosophy behind it

One codebase, one web application, one database, one auth system, responsive everywhere, security enforced at the database/server level, not just the frontend. No native iOS/Android apps (Stage 5 already marked a dedicated mobile app P2 — "the responsive web experience covers this," this stack makes that explicit rather than just asserted). No AI matching, no Elasticsearch, no microservices, no Kubernetes — all of it deliberately deferred as unnecessary complexity for this scale, consistent with Stage 5's non-goals and Stage 9's explicit "don't introduce complicated AI" stance.

## What this explicitly rules out, matching decisions already on record

- Separate native mobile apps — Stage 5, P2.
- AI-assisted matching — Stage 5, P2; Stage 9 already specified a plain weighted formula.
- A dedicated messaging system — Stage 5, P2; Stage 8's connection model already kept contact off-platform for MVP.
- WordPress, Firebase-as-primary-database, MongoDB, microservices, a separate Node backend from the frontend — none fit this project's relational data model or small-team scale.

## Architecture diagram

```
                       USERS
                         │
          ┌──────────────┴──────────────┐
       Desktop                        Mobile
   (Chrome/Edge/Safari)          (Safari/Chrome)
          │                             │
          └──────────────┬──────────────┘
                         │
                    HTTPS / Web
                         │
                 ┌───────▼───────┐
                 │    Next.js    │
                 │  TypeScript   │
                 │  Member UI    │
                 │  Admin UI     │
                 │  Server logic │
                 └───────┬───────┘
                         │
                ┌────────┼────────┐
                ▼        ▼        ▼
             Auth      DB       Storage
                │        │        │
                └────────┴────────┘
                      Supabase
                    (PostgreSQL)
```

Deploy path: GitHub → CI/tests → Vercel → production.

## What this still doesn't decide — genuinely deferred, not by oversight

Per the surviving parts of [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md): PDPA registration, employment-agency legal status, dispute/outcome-handling workflow design, and the *detailed* security/backup/monitoring specification (beyond "RLS + server-side checks + Sentry" named above as the baseline). Those wait until the system is confirmed running. The stack itself does not — that's the change this document makes.

## Next step, per the reviewer's own recommendation

A "Technical Architecture v1" document locking project structure (repo layout, folder conventions), the actual database schema translated from [stage-15-data-model.md](stage-15-data-model.md)'s logical model into real Postgres tables/columns/indexes, the authentication flow in Supabase Auth terms, environment setup (dev/staging/production), and how the member and admin applications share code — recommended before M1 coding starts.

**Received and filed:** [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md). Covers exactly this. M1 is ready to start.
