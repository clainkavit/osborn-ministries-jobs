# Church Professional & Opportunity Network

Web application for Pastor Tony Osborn Ministries. A verified pool of
congregation members' professional profiles, matched to opportunities.

Full specification: `../context/` (Stages 1–21) and `../COMBINED-SPEC.md`.
This app is built strictly from that spec; deviations are noted in the
relevant stage document.

## Status

**M1 — Authentication + Application Skeleton.** Registration, login, logout,
password reset, role-based routing, member and admin shells. Professional
profile, verification, directory, opportunities, matching, and applications
are later milestones (see `../context/stage-18-development-milestones.md`).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) ·
Supabase (Postgres + Auth) · Vitest · Playwright. Details:
`../context/stage-19-technical-architecture.md` and
`../context/stage-20-technical-architecture-v1.md`.

## Setup

1. **Create a Supabase project** (dev). From its dashboard, Project Settings →
   API, copy the Project URL, the `anon`/public key, and the `service_role`
   key.
2. **Fill `.env.local`** (copy from `.env.example`). The `service_role` key
   goes in `SUPABASE_SECRET_KEY` — server-only, never `NEXT_PUBLIC_*`.
3. **Apply the migration.** In the Supabase dashboard SQL editor, run
   `supabase/migrations/001_initial_schema.sql`. (Or wire up the Supabase CLI
   and `supabase db push`.)
4. `npm install`
5. `npm run dev` → http://localhost:3000

## Scripts

| Script | What |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests (permissions, validation) |
| `npm run test:e2e` | Playwright M1 acceptance tests — **the final authority on whether M1 is done** (`../context/stage-21-m1-implementation-spec.md` section 30). Requires a connected Supabase project. |

## M1 acceptance

`tests/e2e/m1-acceptance.spec.ts` is the checklist from Stage 21 section 30,
as runnable tests. It is skipped until `.env.local` points at a real Supabase
project. For the admin-path tests, set `M1_ADMIN_EMAIL` / `M1_ADMIN_PASSWORD`
to a `members` row whose `role` is `CHURCH_ADMIN` (sign that user up through
the app, then `UPDATE members SET role='CHURCH_ADMIN' WHERE email='…'`).
