# Stage 21 — M1 Implementation Specification

Received 2026-09-10, the direct continuation of [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md)'s section 45 checklist, turned into an actual coding blueprint: project init commands, dependencies, Supabase client architecture, migration SQL, RLS policies, screens, file structure, and acceptance tests for M1 specifically. Kept close to as-received, with one correction — see the flagged section below — and heading levels adjusted to nest under this file's title.

**One schema conflict found and corrected before filing (Champion, 2026-09-10):** the received spec's `members.profile_status` column used five values that conflate profile-completeness with verification (`REGISTERED, PROFILE_COMPLETE, PENDING_VERIFICATION, VERIFIED, NEEDS_CORRECTION`). [stage-7-state-machines.md](stage-7-state-machines.md) and [stage-15-data-model.md](stage-15-data-model.md) already decided these are **three independent fields**, specifically so a member can be `membership_status = Confirmed` while `credentials_status = Pending` at the same time — a real, tested state (Stage 13's acceptance criteria include a scenario for exactly this). A single 5-value `profile_status` column cannot represent that combination. The migration SQL below is corrected to the three-column model; the received single-column version is not used. This is the only content change made to this document — everything else is filed as received.

---

## 1. M1 scope

**Goal:** at the end of M1, a person can register, log in, log out, reset their password, and reach the correct application area based on role. Member and admin shells exist; professional-network features come later.

**Build now:** Next.js application, TypeScript, Tailwind CSS, shadcn/ui, Supabase project connection, Supabase Auth, PostgreSQL foundation, `members` table, roles, protected routes, registration, login, logout, password reset, member dashboard shell, admin dashboard shell, responsive navigation, session handling, initial RLS policies, basic error/loading states, Git repository structure, environment configuration.

**Do NOT build yet:** professional profile, education, experience, skills, certifications, CV upload, verification, directory, opportunities, matching, applications, messaging. Those begin in [stage-18-development-milestones.md](stage-18-development-milestones.md)'s later milestones — M2 owns the complete member profile/onboarding experience.

---

## 2. Project initialization

```bash
npx create-next-app@latest church-professional-network
```

Select: TypeScript Yes, ESLint Yes, Tailwind CSS Yes, `src/` directory Yes, App Router Yes, Turbopack Yes, import alias `@/*`.

```
church-professional-network/
├── public/
├── src/
│   └── app/
├── .env.local
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 3. Core dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npx shadcn@latest init
```

Initial shadcn components: `button, input, label, card, alert, badge, dropdown-menu, separator, sheet, avatar, skeleton`. Don't install dozens of components before they're needed.

**Implementation notes 2026-09-10 (shadcn CLI + Tailwind v4):**
- `create-next-app@latest` now scaffolds **Tailwind v4** (CSS-config, no `tailwind.config.js`) and **Next.js 16**. The plain `shadcn@latest init` default preset (`base-nova`) generates a `src/lib/utils.ts` of `export { cn } from "cn"` and a Base UI button with no `asChild` — and doesn't install the packages those reference, so it's broken out of the box against this scaffold. Used `npx shadcn@latest init -b radix -t next -p nova -y -f` instead, which gives the Radix-based components the spec assumes (`asChild` via `Slot`, `cn` as a real installed package).
- That preset adds `@import "shadcn/tailwind.css";` to `globals.css`, which points at a package that isn't installed and breaks the build. Removed that one line; the rest of the generated `globals.css` (full token set, light/dark, `@theme inline` mapping) is standard and kept. Also aligned `--font-sans`/`--font-heading` to the `--font-geist-sans` variable the root layout actually sets.
- Next.js 16 prints a `middleware-to-proxy` deprecation notice (it prefers `proxy.ts`). Kept the file as `middleware.ts` to match section 17's naming; it still runs ("ƒ Proxy (Middleware)" in the build output confirms it).
- `npm` needs `legacy-peer-deps` for the test tooling (`@playwright/test`, `vitest`) against React 19 / Next 16 peer ranges — added `.npmrc` with `legacy-peer-deps=true`. `vitest@5` also needs `vite` installed explicitly, and its config must be `vitest.config.mts` (not `.ts`) so it loads as ESM.
- **Middleware ordering (section 17):** the public-path check must come *before* `createServerClient` is constructed, and the middleware degrades to "redirect protected routes to /login" when the Supabase env vars are still `REPLACE_ME`. Without this, `createServerClient` throws `Invalid supabaseUrl` on *every* request (public pages included) before `.env.local` is filled in, making the app un-browsable during setup. `src/lib/supabase/middleware.ts` as built handles both. Verified by smoke test: `/`, `/register`, `/login`, `/admin/login` return 200; every protected route 307-redirects to `/login` — all before any Supabase project exists.

**Bugs found and fixed by the section 30 acceptance suite (2026-09-10):**
- **Lucide icons across the server/client boundary.** `AppShell` (server component) passed the `MEMBER_NAV` / `ADMIN_NAV` arrays — whose items hold `LucideIcon` component references — as props into `SidebarNav` (client). Lucide icons are objects with a `render` method and aren't serializable, so the member/admin layout threw `Only plain objects can be passed to Client Components` on every render *after* a successful registration, leaving the browser stuck on `/register`. Fix: `SidebarNav` and `BottomNav` are `"use client"` and now import the nav arrays directly; `AppShell` passes only `variant: "member" | "admin"`. Rule for later milestones: never pass an icon component through props from a server component.
- **Client `router.push` + `router.refresh` after a cookie-setting Server Action.** The auth forms called the action, then `router.push(dest)` + `router.refresh()`. The refresh raced the freshly-set Supabase session cookie and the router cache, so navigation to the now-protected route silently didn't happen. Fix: `register`, `login`, and `logout` now call Next's `redirect()` from the server on success (the session cookie is set in the same request, so the server redirect lands authenticated). The actions return an `AuthActionResult` only on failure; the forms render that inline and otherwise do nothing after the `await`.

**Acceptance status:** `npm run test:e2e` (chromium) — **10 passed, 1 skipped**. The skip is the admin-dashboard test, which needs a `CHURCH_ADMIN` row (`M1_ADMIN_EMAIL` / `M1_ADMIN_PASSWORD`). Every other section-30 check passes against the live Supabase project. Also required: Supabase dashboard → Authentication → "Confirm email" **off** for dev (otherwise every signup hits the free-tier confirmation-email rate limit), and test emails must not use `@example.com` (Supabase rejects it as invalid) — the suite uses `@m1test.com`.

## 4. Supabase setup

```
Next.js → Supabase Auth
        → Supabase Database → PostgreSQL
```

Supabase Auth handles authentication; the app never stores passwords itself — matches [stage-19-technical-architecture.md](stage-19-technical-architecture.md) and [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md)'s decided approach exactly.

## 5. Environment variables

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The secret key stays server-side — never in a `NEXT_PUBLIC_*` variable, never in browser code. Matches Stage 19/20's "critical security rule" exactly.

## 6. Supabase client architecture

```
src/lib/supabase/
├── client.ts      — browser/client components
├── server.ts       — Server Components, Server Actions, Route Handlers
└── middleware.ts    — session state, route protection
```

Rule: browser → Supabase client only; server → Supabase server client; secret operations → server only.

## 7. Database migration #001 — CORRECTED

`supabase/migrations/001_initial_schema.sql`. The received version used a single `profile_status` enum conflating completeness and verification; corrected here to the three-field model per Stage 7/15:

```sql
create table public.members (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid not null unique
    references auth.users(id) on delete cascade,

  role text not null default 'MEMBER'
    check (role in ('MEMBER', 'CHURCH_ADMIN', 'SUPER_ADMIN')),

  first_name text not null,
  last_name text not null,

  phone text,
  email text,

  -- CORRECTED: three independent fields, per stage-7-state-machines.md
  -- and stage-15-data-model.md, not one combined column. A member can be
  -- membership_status = 'CONFIRMED' while credentials_status = 'PENDING'
  -- at the same time -- a single column cannot represent that.
  profile_status text not null default 'REGISTERED'
    check (profile_status in ('REGISTERED', 'PROFILE_COMPLETE')),

  membership_status text not null default 'NOT_SUBMITTED'
    check (
      membership_status in (
        'NOT_SUBMITTED', 'PENDING', 'CONFIRMED',
        'NEEDS_CORRECTION', 'SUSPENDED'
      )
    ),

  credentials_status text not null default 'NOT_SUBMITTED'
    check (
      credentials_status in (
        'NOT_SUBMITTED', 'PENDING', 'REVIEWED',
        'NEEDS_CORRECTION', 'REVIEW_PENDING'
      )
    ),
  -- REVIEW_PENDING added per stage-7's 2026-09-10 reverification decision:
  -- editing Experience marks credentials REVIEW_PENDING (lighter than a
  -- full reset to PENDING), so this state needs to exist from migration #001
  -- even though M1 itself never triggers it -- adding it later would be a
  -- breaking enum change instead of a value nobody uses yet.

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

This intentionally does not include the complete professional profile yet — M2 extends this with profession, education, experience, skills, certifications, documents, availability, per [stage-15-data-model.md](stage-15-data-model.md).

## 8. Why role belongs in the database

Not frontend-only state — authorization must be enforceable server-side. `MEMBER → /dashboard`; `CHURCH_ADMIN`/`SUPER_ADMIN → /admin/dashboard`; a `MEMBER` hitting `/admin/verification` is denied server-side, not just hidden in the UI.

## 9. RLS foundation

```sql
alter table public.members enable row level security;

create policy "Members can view their own profile"
on public.members for select to authenticated
using (auth.uid() = auth_user_id);

create policy "Members can update their own profile"
on public.members for update to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);
```

Initial foundation only — more sophisticated policies (admin read access to the directory, the verification-gate visibility rule) arrive with M2-M4, per [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md) section 34's RLS test-case list.

**Implementation deviation noted 2026-09-10:** the two policies above (SELECT + UPDATE) are insufficient for section 10's registration flow, which requires a just-signed-up user to INSERT their own `members` row — and RLS denies by default. The built migration (`app/supabase/migrations/001_initial_schema.sql`) adds a third policy:

```sql
create policy "Members can create their own profile"
  on public.members for insert to authenticated
  with check (auth.uid() = auth_user_id);
```

Scoped so a user can only ever insert a row keyed to their own `auth.uid()`, cannot set another user's `auth_user_id`, and cannot self-promote (role column defaults to `MEMBER`; no policy grants UPDATE of `role`). This is the minimal addition required for M1's acceptance tests (section 30, "Member record is created") to pass — not a scope expansion. The migration also adds a standard `updated_at` trigger, which section 7's SQL implies (`updated_at ... default now()`) but doesn't spell out.

## 10-11. Registration

Screen fields: First name, Last name, Email or phone, Password, Confirm password — intentionally minimal, matching [stage-17-screen-specs.md](stage-17-screen-specs.md)'s Registration spec exactly ("don't ask for their entire CV during registration"). Flow: Registration → Supabase Auth account → `members` record → `/onboarding` (M2's territory, not built in M1).

Zod validation: required first/last name, required email/phone, password minimum requirements, confirm-password match. Inline errors, e.g. "Please enter your first name," "Password must contain at least 8 characters," "Passwords do not match." Submitting state: "Creating account…" — matches [stage-11-states-catalog.md](stage-11-states-catalog.md)'s loading-state conventions.

## 12-14. Login

Two entry points, same underlying auth: `/login` (member) and `/admin/login` (admin), differing in intended role/destination.

**Member login** → session → role → `/dashboard`.
**Admin login** → session → role check → `CHURCH_ADMIN`/`SUPER_ADMIN` → `/admin/dashboard`. A member attempting `/admin/*` gets a role check → not authorized → redirect to `/dashboard`. **Server-enforced, not just hidden navigation** — matches Stage 17/20's authorization principle exactly.

## 15. Session architecture

`Browser → Authentication → Supabase session → Server reads session → members lookup → role`. No separate custom auth session maintained in the application database — Supabase Auth is the single source of truth for identity.

## 16-17. Route protection and middleware

Protected: `/dashboard/*, /profile/*, /opportunities/*, /applications/*, /notifications/*, /settings/*`. Admin: `/admin/*`. Public: `/, /login, /register, /admin/login, /forgot-password, /reset-password`.

Middleware logic: public route → continue; else authenticated? no → login; yes → is `/admin`? yes → admin role? no → unauthorized, yes → continue; not `/admin` → continue.

## 18-20. Application shell and navigation

Desktop: persistent sidebar (logo, notifications, user menu top; nav items; sign out at bottom). Mobile: bottom navigation (Home/Profile/Jobs/Alerts) — matches [stage-3-ux.md](stage-3-ux.md)'s desktop sidebar / mobile bottom-nav pattern exactly.

Member nav (M1 shell, most routes show "Coming in the next stage" but the structure exists now): Dashboard, My Profile, Opportunities, Applications, Notifications, Settings.

Admin nav: Dashboard, Members, Professionals, Verification, Opportunities, Applications, Analytics, Settings.

## 21-22. Dashboards — honest, not fake

**Member dashboard M1:** "Welcome, [First Name]. Complete your professional profile so the church can better understand your skills and experience. [Complete profile]" — Profile: Registered. Verification: Not submitted yet. Opportunities: Coming soon.

**Admin dashboard M1:** "Welcome to the Professional Network. The platform is ready for administration." Members: 0. Verified Professionals: 0. Active Opportunities: 0. Applications: 0.

Real zero-states, not invented numbers — matches [stage-17-screen-specs.md](stage-17-screen-specs.md)'s note that a freshly-launched instance should show real small numbers, not look broken. M9 replaces these with real metrics once there's real data.

## 23-24. Loading and error states

Skeletons (shadcn), not a global spinner, on every authenticated page. Auth errors in plain language: "Incorrect email or password." / "This account already exists. Try signing in instead." / "We couldn't create your account. Please try again." / "Your session has expired. Please sign in again." — matches [stage-11-states-catalog.md](stage-11-states-catalog.md)'s Authentication section almost verbatim.

## 25. Password reset

`Forgot password → Enter email → Send reset link → Email → Reset password → Login`. Screens: request ("Send reset link"), confirmation ("If an account exists for this address, we've sent instructions..." — deliberately non-committal, doesn't confirm whether the email exists, standard security practice), new password ("Update password").

## 26. File structure after M1

```
src/
├── app/
│   ├── (public)/       page.tsx, login/, register/, forgot-password/, reset-password/
│   ├── (member)/        layout.tsx, dashboard/
│   ├── admin/            login/, (protected)/ layout.tsx, dashboard/
│   └── api/
├── components/
│   ├── ui/ auth/ layout/ navigation/
├── lib/
│   ├── supabase/ auth/ authorization/ validation/
├── types/
└── middleware.ts
```

Matches [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md) section 24's repo structure, scoped down to what M1 actually needs.

## 27. Auth service

```
src/lib/auth/
├── actions.ts       register(), login(), logout(), requestPasswordReset(), resetPassword()
├── queries.ts        getCurrentUser(), getCurrentMember(), getCurrentRole()
├── permissions.ts    isMember(), isChurchAdmin(), isSuperAdmin(), isAdmin()
└── redirects.ts      where should this authenticated user go?
```

## 28. Type system

```
src/types/
├── auth.ts  member.ts  roles.ts  database.ts
```

```ts
export type UserRole = "MEMBER" | "CHURCH_ADMIN" | "SUPER_ADMIN";
```

Centralized, not scattered string literals through dozens of files. **Extend this pattern** to the corrected `profile_status`/`membership_status`/`credentials_status` enums from section 7 above when `member.ts` is written, so those three fields get the same typed treatment as role.

## 29. API boundary

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/password/reset-request
POST /api/auth/password/reset
GET  /api/auth/session
```

Matches [stage-16-api-shape.md](stage-16-api-shape.md)'s Auth section exactly.

## 30. M1 acceptance tests

**Registration:** new member can register; duplicate email rejected; weak password rejected; mismatched confirmation rejected; member record created; new user gets `MEMBER` role; user reaches dashboard.

**Login:** valid credentials work; invalid credentials fail; member reaches member dashboard; admin reaches admin dashboard; member cannot access admin routes.

**Logout:** ends session; protected page inaccessible afterward.

**Password reset:** request works; reset link works; new password can be set; new password allows login.

**Security:** RLS enabled; a member cannot read another member's record; a member cannot modify another member's record; admin routes protected server-side; secret keys never reach the browser.

**Responsive:** test at 360px, 390px, 768px, 1024px, 1440px, across Chrome/Safari/Firefox/Edge — extends [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)'s functional scenarios with concrete viewport/browser targets that document didn't specify.

## 31-32. M1 demo and definition of done

**Member demo:** Open platform → Create account → Login → Member Dashboard → Sign out.
**Admin demo:** Admin Login → Admin Dashboard → Members → Professionals → Verification → Opportunities (later pages can be empty shells — the architecture and access control working is what matters).

**Definition of done:** a real user can create an account, authenticate securely, maintain a session, reach the correct role-based application shell, and be prevented from accessing areas they're not authorized for.

At that point: **M2 — Professional Profile** (Registration → 8-step onboarding → Profile Complete → Submit for Verification), per [stage-18-development-milestones.md](stage-18-development-milestones.md)'s existing sequence — M2 builds the complete profile, M3 introduces verification.

---

## What this document changes for the rest of the spec

Only the migration SQL in section 7 above. No other stage document needs updating as a result of this one — the three-field model it now uses was already the decided design in Stage 7/15, this document just needed to be brought in line with it before anyone runs the migration.
