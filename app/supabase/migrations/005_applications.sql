-- Migration 005 -- Applications (M7)
-- Source: context/stage-29-m7-implementation-specification.md, resolved by
-- Champion's 12 M7 decisions (2026-09-12).
--
-- Two new tables: applications, application_outcomes. No changes to any
-- M1-M6 table or existing migration.
--
-- Application status lifecycle (Decision 1, Decision 2):
--   APPLIED -> REVIEWED -> SHORTLISTED -> INTERVIEW -> SELECTED | REJECTED
--   APPLIED | REVIEWED | SHORTLISTED -> WITHDRAWN                (member)
--   [any open status] -> REJECTED                                (admin,
--     via closeRemainingApplications -- explicit action only, never
--     automatic -- Decision 9)
-- No other transition exists. SELECTED, REJECTED, WITHDRAWN are terminal.
-- INTERVIEW cannot go to WITHDRAWN (Decision 4). Transition LEGALITY is
-- guarded in the server action layer (isApplicationTransitionAllowed +ε a
-- guarded .eq('status', from) update), matching M5/M6's own division of
-- labor. RLS below is defense-in-depth, not the primary enforcement.
--
-- Decision 1 -- there is no CONNECTED status, no connection table, no
-- Connect endpoint. "Connect" is the Stage 8 contact-info-visibility side
-- effect of reaching SHORTLISTED, read at the query layer (see
-- lib/applications/queries.ts) -- nothing in this migration represents it
-- as a distinct entity.
--
-- Decision 7 -- application_outcomes is a SEPARATE, decoupled entity, never
-- required to reach SELECTED/REJECTED. Do not conflate the two.
--
-- Decision 6 -- interview_date/time/location become required together at
-- the SHORTLISTED -> INTERVIEW transition (enforced in the server action,
-- not by a NOT NULL here, since they are legitimately empty before that
-- transition -- same nullable-until-relevant pattern migration 004 used for
-- opportunity_requirements' fields).

create table public.applications (
  id                      uuid primary key default gen_random_uuid(),
  member_id               uuid not null references public.members(id) on delete cascade,
  opportunity_id          uuid not null references public.opportunities(id) on delete cascade,
  status                  text not null default 'APPLIED'
    check (status in ('APPLIED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW',
                       'SELECTED', 'REJECTED', 'WITHDRAWN')),
  applied_at              timestamptz not null default now(),
  status_updated_at       timestamptz not null default now(),
  interview_date          date,
  interview_time          time,
  interview_location      text,
  interview_instructions  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint applications_one_per_member_opportunity
    unique (member_id, opportunity_id)
);

create index applications_opportunity_idx on public.applications (opportunity_id);
create index applications_member_idx on public.applications (member_id);
create index applications_status_idx on public.applications (status);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- application_outcomes -- Decision 7: decoupled from applications.status.
-- One-to-one, admin-only, never required for SELECTED/REJECTED. notes is
-- admin-internal and never exposed to the member (Stage 15, Stage 13's
-- existing no-detail-on-rejection precedent).
create table public.application_outcomes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  outcome        text not null
    check (outcome in ('HIRED', 'CONTRACT_AWARDED', 'PROJECT_COMPLETED',
                        'SERVICE_DELIVERED', 'CONNECTED', 'NOT_SELECTED',
                        'CANCELLED', 'NO_OUTCOME')),
  recorded_by    uuid not null references public.members(id),
  recorded_at    timestamptz not null default now(),
  notes          text,

  constraint application_outcomes_one_per_application unique (application_id)
);

create index application_outcomes_application_idx on public.application_outcomes (application_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.applications enable row level security;
alter table public.application_outcomes enable row level security;

-- Members: create their own applications only. member_id is always
-- server-set from the caller's own session in the server action (never
-- accepted as client input -- same discipline as opportunities.created_by),
-- but the with check here still pins it at the RLS layer too.
create policy "Members create own applications"
  on public.applications for insert to authenticated
  with check (member_id = public.current_member_id());

-- Members: read their own applications only.
create policy "Members read own applications"
  on public.applications for select to authenticated
  using (member_id = public.current_member_id());

-- Members: self-serve Withdraw only (Decision 4). The using clause pins
-- which EXISTING rows a member may touch (their own, and only while still
-- in one of the three withdrawable statuses); the with check clause pins
-- what the row may become as a result (status = 'WITHDRAWN', nothing else
-- changed). This mirrors migration 003's "Admins update member
-- verification status" column/value-restricting pattern, applied here to a
-- member's own single allowed self-transition rather than an admin's.
create policy "Members withdraw own application"
  on public.applications for update to authenticated
  using (
    member_id = public.current_member_id()
    and status in ('APPLIED', 'REVIEWED', 'SHORTLISTED')
  )
  with check (
    member_id = public.current_member_id()
    and status = 'WITHDRAWN'
  );

-- Admins: full CRUD on any application. Transition legality (which status
-- may follow which) is guarded in the server action layer, not here --
-- same division of labor migration 004 already established for
-- opportunities.status.
create policy "Admins manage all applications"
  on public.applications for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

-- application_outcomes: admin-only, both directions. No member SELECT
-- policy -- outcome notes are admin-internal (Decision 7, Stage 15); the
-- member-visible SELECTED/REJECTED fact is read from applications.status
-- directly, never from this table.
create policy "Admins manage all application outcomes"
  on public.application_outcomes for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());
