# Stage 20 — Technical Architecture v1

Received 2026-09-10, following [stage-19-technical-architecture.md](stage-19-technical-architecture.md)'s own closing section naming exactly this as the next artifact: repo structure, physical database schema, Supabase Auth flow, environments, migrations, testing strategy, deployment. This is that document. Kept close to as-received, with only heading levels adjusted to nest under this file's title and its numbering continued from Stage 19's "Section" framing translated into this document's own 1-45 numbering, left as originally written.

**Consistency check against prior decisions (Champion, 2026-09-10):** this document's Section 23 (opportunity closing) matches [stage-7-state-machines.md](stage-7-state-machines.md)'s decided behavior exactly (block new applications, leave existing ones untouched, admin explicitly chooses what happens next) — no conflict. Its Section 42 independently re-derives the same three items already tracked as genuinely open (verification criteria, reverification-on-edit, opportunity-closing) — two of those three are actually already decided as of Stage 7/8 (reverification and opportunity-closing), this document's Section 42 predates seeing that resolution and should be read as historical framing, not as reopening them. Verification criteria remains the one real open item.

---

## 1. Architecture decision

The platform is built as a **responsive full-stack web application**. Members access it through a browser on Windows, macOS, Linux, Android, iPhone/iPad, ChromeOS. No native Android or iOS application for MVP (matches [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md)'s P2 classification of a dedicated mobile app).

```
                    INTERNET
                       │
                       ▼
              ┌─────────────────┐
              │   Web Browser   │
              │ Desktop / Phone │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Next.js      │
              │ React + TS      │
              │ Member UI       │
              │ Admin UI        │
              │ Server Logic    │
              │ API Routes      │
              └────────┬────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      ┌─────────────┐     ┌─────────────┐
      │  Supabase   │     │   Storage   │
      │ PostgreSQL  │     │ CVs/Docs    │
      │ Auth / RLS  │     │             │
      └─────────────┘     └─────────────┘
```

This fits the product model because the spec already separates member self-service from the admin-facing directory and requires server-side verification gates ([stage-7-state-machines.md](stage-7-state-machines.md)).

## 2-3. Frontend and backend

**Frontend:** Next.js + React + TypeScript, App Router. UI: Tailwind CSS, shadcn/ui, Lucide icons. Forms: React Hook Form + Zod — the platform has many multi-field, multi-record forms (registration, profile, education, experience, certifications, opportunity creation, verification, applications), and Zod gives one place to define validation rules shared between client and server.

**Backend:** no separate Node/Express backend for MVP. The Next.js application contains the server layer (UI, Server Components, Server Actions, Route Handlers, business logic), responsible for authorization, profile operations, verification, opportunity creation, matching, application status changes, notifications, controlled contact-info exposure, and admin operations. Sensitive operations never depend solely on frontend checks.

## 4. Database

PostgreSQL through Supabase. The logical model ([stage-15-data-model.md](stage-15-data-model.md)) is strongly relational — Church → Branch → Member → (Education/Experience/Skills/Certifications/Documents/Verification/Applications/Notifications), Opportunity → Requirements (Profession/Skills) — so this is the correct database choice, not a document store.

## 5. Authentication

Supabase Auth handles account creation, login, logout, password reset, session management, tokens — JWT-based, integrates directly with PostgreSQL RLS. Authentication model: Supabase Auth User (1:1) → `public.members`, carrying church_id, branch_id, role. **The application database never stores passwords itself** — Supabase Auth owns credentials, `members` owns profile/application data.

## 6. User roles

MVP: `MEMBER`, `CHURCH_ADMIN`, `SUPER_ADMIN`. Future: `ORGANIZATION`, `EMPLOYER` (P2, per Stage 5).

**Member** can: manage own profile/education/experience/skills/certifications, upload documents, manage availability, view/apply to opportunities, view own applications, receive notifications.

**Church Admin** can: view the verified professional directory, review/verify membership and credentials, create opportunities, search/match/shortlist professionals, manage applications, view controlled contact information (once unlocked per [stage-8-connection-model.md](stage-8-connection-model.md)).

**Super Admin** additionally: manage churches, branches, administrators, taxonomy, system configuration, platform-wide analytics.

## 7. Authorization architecture — two layers

**Layer 1 — Application authorization.** Next.js server code determines who the user is, their role, and whether the attempted action is allowed (e.g. a MEMBER cannot reach `/admin/verification`).

**Layer 2 — PostgreSQL RLS.** Database-level authorization, active even if someone bypasses the normal UI. Especially important given the personal data this system holds: phone numbers, email addresses, CVs, qualifications, employment history, private documents.

## 8. Critical security rule

The browser must **never** receive the Supabase service-role/secret key — it bypasses RLS. The public/publishable key is frontend-safe under proper RLS policies. Service-role credentials are backend-only.

```
Browser:        Publishable key ✓ | Service-role key ✕ NEVER
Next.js Server: Secret/service credentials ✓
```

## 9-17. Physical database schema

Translating [stage-15-data-model.md](stage-15-data-model.md)'s logical entities into actual PostgreSQL tables:

**Core:** `churches` (id, name, slug, status, timestamps), `branches` (id, church_id, name, location, status, timestamps), `members` (id, auth_user_id, church_id, branch_id, first_name, last_name, photo_url, date_of_birth, gender, phone, email, location, primary_profession_id, industry_id, employment_status, profile_status, membership_status, credentials_status, availability, timestamps).

**Professional data:** `professions` (id, name, industry_id, active, created_at), `industries` (id, name, active), `skills` (id, name, profession_id, active), `member_skills` (member_id, skill_id, created_at), `education` (id, member_id, institution, qualification, field_of_study, start_year, end_year, is_current, timestamps), `experience` (id, member_id, organization, position, location, start_date, end_date, is_current, description, timestamps), `certifications` (id, member_id, name, issuing_organization, issue_date, expiry_date, credential_number, timestamps).

**Documents:** `documents` (id, member_id, document_type [CV | CERTIFICATE | OTHER], file_name, storage_path, mime_type, file_size, visibility, created_at). Actual files live in Supabase Storage; Postgres stores metadata and the storage path. Private documents must never sit in a public bucket.

**Verification:** `verification_history` (id, member_id, track [MEMBERSHIP | CREDENTIALS], decision [PENDING | CONFIRMED | NEEDS_CORRECTION | REJECTED], note, reviewed_by, created_at). The two tracks stay independent — the spec requires separate verification endpoints because membership and credentials are independent decisions ([stage-16-api-shape.md](stage-16-api-shape.md)'s two verify-* endpoints).

**Verification gate — server-side, not a frontend filter:** a member is discoverable in the professional directory only when Membership = CONFIRMED AND Credentials = REVIEWED/CONFIRMED (matches [stage-7-state-machines.md](stage-7-state-machines.md)'s Discoverability rule exactly).

```
Profile Complete → Submit for Verification
    ├── Membership Verification
    └── Credentials Verification
              ↓
        BOTH APPROVED
              ↓
       PROFESSIONAL POOL
```

**Opportunities:** `opportunities` (id, church_id, branch_id, title, type, organization_name, location, description, headcount, minimum_experience, required_education, required_profession_id, status, created_by, published_at, closed_at, timestamps). MVP types: EMPLOYMENT, CHURCH, SERVICE (Project/Business remain future, per Stage 5).

**Opportunity requirements:** `opportunity_skills` (opportunity_id, skill_id, required) — keeps the schema ready for a future project-management system without building it now.

**Applications:** `applications` (id, member_id, opportunity_id, status [APPLIED | REVIEWED | SHORTLISTED | INTERVIEW | SELECTED | REJECTED | WITHDRAWN], applied_at, updated_at). `application_outcomes` (id, application_id, outcome [HIRED | CONTRACT_AWARDED | PROJECT_COMPLETED | SERVICE_DELIVERED | CONNECTED | NOT_SELECTED | CANCELLED], notes, created_at).

**Notifications:** `notifications` (id, member_id, type, body_text, related_entity_type, related_entity_id, read_at, created_at). MVP types: PROFILE_VERIFIED, OPPORTUNITY_MATCH, APPLICATION_SHORTLISTED, INTERVIEW_SELECTED, CORRECTION_REQUESTED.

## 18-20. Matching engine

Application logic, not AI — a deterministic TypeScript matching service. **Gate before scoring:** membership verified? credentials verified? availability != Not Available? Any failed gate excludes the candidate entirely (matches [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s decision that verification is a gate, not a scored factor).

**Formula** (identical to Stage 9): Profession 30%, Skills 20%, Experience 20%, Availability 15%, Location 10%, Education 5%.

**API must return both `match_score` and `match_breakdown`** — never let the frontend recalculate independently. The API owns the calculation so admin UI, a future employer portal, analytics, and any future recommendation system all agree on one number. This matches [stage-17-screen-specs.md](stage-17-screen-specs.md)'s explicit requirement that the per-criterion breakdown is a response-shape requirement, not just a UI choice.

```json
{
  "score": 94,
  "breakdown": {
    "profession": 100, "skills": 90, "experience": 100,
    "availability": 100, "location": 80, "education": 100
  }
}
```

## 21-22. API architecture and rules

Implements [stage-16-api-shape.md](stage-16-api-shape.md)'s contract via Next.js Route Handlers. Every protected operation follows: authenticate → identify user → check role → validate input → check business rule → database operation → typed response. Example given for `POST /admin/members/:id/verify-credentials`: authenticated? Church Admin/Super Admin? member exists? credentials verification currently actionable? validate decision → write verification history → update credentials_status → create notification → return updated state.

## 23. Contact / connection security

Phone and email are not visible to every admin just because a profile exists. **Directory search → view professional → Shortlist → contact information becomes available.** `GET /professionals/:id` returns `phone: null, email: null` until the relevant application reaches the required stage. Enforced server-side. **Matches [stage-8-connection-model.md](stage-8-connection-model.md)'s decided staged-visibility model exactly** — restated here as an API-level implementation detail, not a new decision.

## 24-25. Repository and route structure

```
church-professional-network/
├── app/
│   ├── (public)/  (auth)/  (member)/
│   ├── admin/
│   └── api/
├── components/
│   ├── ui/ forms/ profile/ opportunities/ matching/ admin/
├── lib/
│   ├── auth/ authorization/ db/ matching/ notifications/ storage/ validation/ utils/
├── types/
├── supabase/
│   ├── migrations/ seed/ tests/
├── tests/
│   ├── unit/ e2e/
├── public/
├── middleware.ts
├── package.json
└── README.md
```

Route structure: `/login`, `/register`, `/dashboard`, `/profile` (`/edit`, `/verification`), `/opportunities` (`/[id]`, `/[id]/apply`), `/applications`, `/notifications`, `/admin` (`/dashboard`, `/members`, `/professionals`, `/verification`, `/opportunities`, `/opportunities/new`, `/opportunities/[id]`, `/opportunities/[id]/matches`, `/applications`, `/settings`) — a direct implementation of [stage-17-screen-specs.md](stage-17-screen-specs.md)'s screen inventory.

## 26. Server / client boundary

Server Components by default; Client Components only where interaction requires them. Server: directory queries, verification queue, opportunity details, dashboard data, matching results. Client: profile forms, filters, dropdowns, multi-step onboarding, upload controls, interactive modals, notifications menu. Keeps sensitive data processing primarily server-side.

## 27. Storage architecture

Supabase Storage bucket `member-documents`, structured `member-documents/{member_id}/cv/`, `/certificates/`, `/other/`. Future buckets: `profile-images`, `organization-documents`, `project-documents`. All document access private and authorization-controlled.

## 28. Search

PostgreSQL only for MVP — no Elasticsearch/OpenSearch. Searchable: name, profession, industry, skills, location, experience, availability, verification (matches [stage-16-api-shape.md](stage-16-api-shape.md)'s directory filters). Can be extracted into a dedicated search service later without changing the frontend contract, if the network grows large enough to need it.

## 29. Taxonomy

Seed categories: Engineering, Healthcare, Education, Finance, Technology, Business, Legal, Construction, Transport, Creative, Administration, Hospitality, Agriculture, Other — broader than but compatible with [stage-10-taxonomy.md](stage-10-taxonomy.md)'s more detailed profession-level breakdown; reconcile the two lists when building the actual seed data (Stage 14). An unlisted profession must not block registration — an "Other / specify" path should exist, matching Stage 10's own free-text-fallback principle.

## 30-32. Environments, variables, migrations

Three environments: Development (local), Staging (QA, testing, pastor/leadership demos, acceptance testing), Production (real members, real data). Each gets its own Supabase project, database, storage, auth config, environment variables. Production data must never be used casually for development.

Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`, `SENTRY_DSN`. Secrets never in Git; `.env.local` gitignored.

Migrations: every schema change is a numbered migration file (`001_initial_schema.sql`, `002_member_profile.sql`, `003_verification.sql`, `004_opportunities.sql`, `005_applications.sql`, `006_notifications.sql`). No undocumented production-only database changes.

## 33-34. Testing strategy

**Unit (Vitest):** matching algorithm, score calculations, validation, state transitions, permission helpers, utility functions — `matching.test.ts`, `verification.test.ts`, `permissions.test.ts`.

**End-to-end (Playwright):** Register → build profile → submit verification; Admin review → approve; Admin create opportunity → find matches → shortlist; Member receive notification → view opportunity → apply; Admin review application → shortlist. These map directly to [stage-18-development-milestones.md](stage-18-development-milestones.md)'s vertical slices.

**RLS testing** — explicit test cases required, not assumed: Member A can read own profile, cannot modify Member B; Member A can read own applications, cannot read Admin data; Church Admin can access the authorized directory; an unverified member cannot appear in the directory; a non-admin cannot access the verification queue.

## 35-36. Monitoring and metrics

Sentry for frontend/server/API errors. PostHog (or similar) for product analytics (onboarding completion, profile completion, opportunity views, applications, activation, drop-off) — kept distinct from the actual **impact metrics** ([stage-2-prd.md](stage-2-prd.md) section 47, Stage 5's P2 impact dashboard): registered members / profile completion / verification completion vs. verified professionals / matches / shortlists / connections / jobs obtained / projects completed / services delivered / businesses connected / opportunities fulfilled. Analytics must never substitute for the real impact numbers.

## 37-38. Deployment and Git strategy

`GitHub → Pull Request (tests, typecheck, lint, build) → Vercel → Next.js application → Supabase Production`. Every PR passes `lint`, `typecheck`, `test`, `build` before merge — matches this workspace's own standing TS/JS convention (root CLAUDE.md). Branches: `main`, `develop`, `feature/*`. Workflow: `feature/* → PR → develop → Staging → main → Production`.

## 39-41. Future growth and non-goals

The MVP data model deliberately excludes Project, ProjectRole, Organization/Employer, and Messaging entities — correct, per Stage 5/15. Extend later rather than prematurely build now. Explicitly not building for MVP: native iOS/Android apps, employer portal, AI matching, chat/messaging, marketplace, payments, project management, business directory, social feed, public profiles, Elasticsearch, microservices, Kubernetes, complex recommendation engine, SMS/push infrastructure — all consistent with Stage 5's non-goals list.

**Architecture principles for the engineering team:** the server is authoritative (never trust frontend state for permissions/verification/matching/status/contact visibility); every sensitive table gets RLS; business logic (matching, verification, state transitions) is centralized, not duplicated per screen; a match must be explainable; privacy is the default (no phone/email/documents exposed unless the workflow permits); mobile-first for members, desktop-optimized for admins; build vertical slices, not invisible infrastructure for weeks.

## 42. Remaining business decisions — as this document originally listed them

Three items named here as still open when this document was drafted. **Two are now resolved** (see the consistency note at the top of this file): reverification-on-edit and opportunity-closing were decided in [stage-7-state-machines.md](stage-7-state-machines.md) following the same external review that produced this document. Kept below as originally written, since this document's own reasoning matches the decisions independently, which is useful confirmation.

**A. Verification criteria — still genuinely open, no change.** Church Admin is confirmed as *who* verifies; leadership still needs to define what evidence is sufficient. Example structure offered: Membership (member number? branch confirmation? admin confirmation? membership database lookup?), Profession (CV? certificate? license? employer history? admin review?). The database architecture doesn't need to wait for this — it can store the evidence and decision history regardless of what the eventual rule turns out to be.

**B. Editing verified information — resolved in Stage 7**, matches this document's own recommendation almost exactly (low-risk fields no reverification; profession/qualification/major experience/certification require re-review).

**C. Closing opportunities — resolved in Stage 7**, matches this document's own recommendation exactly (block new applications, existing applications remain visible, admin explicitly chooses to continue or close remaining ones).

## 43-44. Final architecture and build order

```
                         USERS
            ┌──────────────┴──────────────┐
         MEMBER                         ADMIN
            └──────────────┬──────────────┘
                    NEXT.JS APPLICATION
          ┌────────────────┼────────────────┐
       Member UI        Admin UI       Server Logic
          └────────────────┼────────────────┘
                       SUPABASE
          ┌────────────────┼────────────────┐
      PostgreSQL          Auth           Storage
          │
   ┌──────┼───────────────────────────┐
Members  Verification             Opportunities
          └──────────┐
                 TRUST GATE
                      │
                MATCHING ENGINE
                      │
                 APPLICATIONS
                      │
                 CONNECTION
                      │
                    IMPACT
```

Build order follows [stage-18-development-milestones.md](stage-18-development-milestones.md)'s M1-M10 exactly, no new sequence invented. **M6 (Matching) remains the most important milestone** — the product's "aha moment," per both that document and this one independently agreeing.

## 45. Immediate next step

M1 should produce: Next.js project scaffolding, TypeScript, Tailwind, shadcn/ui, a Supabase project, PostgreSQL connection, Supabase Auth, the initial migration, RLS foundation, Member and Admin roles, login/registration/logout/password reset, protected routes, member and admin app shells, a GitHub repository, local dev environment, staging environment.

First working demo: Register → Login → Member Dashboard, and separately Admin Login → Admin Dashboard. Once reliable, proceed directly to M2 (the 8-step professional profile).

**Received and filed:** [stage-21-m1-implementation-spec.md](stage-21-m1-implementation-spec.md) — the actual M1 coding blueprint (init commands, dependencies, migration SQL, RLS policies, screens, file structure, acceptance tests). One correction made there: the `members` table's verification fields use the three-column split this document's own section 12 already specifies, not the single conflated column the received spec initially used.
