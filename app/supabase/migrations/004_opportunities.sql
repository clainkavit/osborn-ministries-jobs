-- Migration 004 -- Opportunities (M5)
-- Source: context/stage-27-m5-implementation-checklist.md section 4.
--
-- Three new tables: opportunities, opportunity_requirements,
-- opportunity_required_skills. No changes to any M1-M4 table.
--
-- Status lifecycle (checklist section 6, Champion Decision 3):
--   DRAFT -> PUBLISHED
--   PUBLISHED -> CLOSED | CANCELLED | FILLED
--   FILLED -> CLOSED
--   CLOSED -> COMPLETED
-- No other transition exists. "PUBLISHED" is the only stored value for that
-- state -- "Active" is a display label computed at render time, never
-- written to this column (do not add an ACTIVE value).
--
-- created_by references public.members(id), NOT a separate Admin table --
-- matches the M1 precedent that admins are members rows with
-- role IN ('CHURCH_ADMIN','SUPER_ADMIN').
--
-- No church_id/branch_id anywhere -- no Church/Branch tables exist in this
-- schema (confirmed absent from every migration); do not introduce them here.
--
-- No location_required column (Champion Decision 5) -- opportunities.location
-- is sufficient for M5; no remote/hybrid/radius/relocation semantics.

create table public.opportunities (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  type                text not null check (type in ('EMPLOYMENT', 'CHURCH', 'SERVICE')),
  organization_name   text not null,
  location            text,
  description         text,
  status              text not null default 'DRAFT'
    check (status in ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'FILLED', 'COMPLETED')),
  headcount_required  integer check (headcount_required is null or headcount_required >= 1),
  created_by          uuid not null references public.members(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  published_at        timestamptz,
  closed_at           timestamptz
);

create index opportunities_status_idx on public.opportunities (status);

-- opportunity_requirements -- one row per opportunity in practice for M5,
-- but modeled as its own table (Champion Decision 2, the normalized Stage 15
-- shape), not collapsed onto opportunities. required_profession_id nullable
-- ("no specific profession" is valid publish content, checklist section 7).
create table public.opportunity_requirements (
  id                        uuid primary key default gen_random_uuid(),
  opportunity_id            uuid not null references public.opportunities(id) on delete cascade,
  required_profession_id    uuid references public.professions(id),
  min_experience_years      integer check (min_experience_years is null or min_experience_years >= 0),
  required_education_level  text
    check (required_education_level is null or required_education_level in
      ('NONE', 'SECONDARY_CERTIFICATE', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'DOCTORATE'))
);

-- opportunity_required_skills -- mirrors public.member_skills's join shape
-- exactly (composite PK, on delete cascade on both FKs, a created_at
-- column), verified directly against migration 002's live member_skills
-- definition.
create table public.opportunity_required_skills (
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  skill_id       uuid not null references public.skills(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (opportunity_id, skill_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.opportunities enable row level security;
alter table public.opportunity_requirements enable row level security;
alter table public.opportunity_required_skills enable row level security;

-- Admins: full CRUD on any opportunity row. No status-specific WITH CHECK
-- here (unlike M3's "Admins update member verification status" policy,
-- which restricts which columns an admin update may touch as defense-in-
-- depth against privilege escalation on a table members also write to).
-- opportunities has no such shared-write concern -- members never write to
-- it -- and an admin is the sole legitimate authority over every field on
-- this table, status included. Transition LEGALITY (can status go from
-- THIS value to THAT value) is guarded in the server action layer
-- (isOpportunityTransitionAllowed + a guarded .eq('status', from) update),
-- the same division of labor M3 already uses for members.<track>_status.
create policy "Admins manage all opportunities"
  on public.opportunities for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

-- Members: SELECT only, Published only. Server-enforced gate, mirrored here
-- so a direct table read can't bypass it -- same posture as M3/M4's
-- directory-visibility gate.
create policy "Members read published opportunities"
  on public.opportunities for select to authenticated
  using (status = 'PUBLISHED');

create policy "Admins manage all opportunity requirements"
  on public.opportunity_requirements for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

create policy "Members read requirements of published opportunities"
  on public.opportunity_requirements for select to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.status = 'PUBLISHED'
    )
  );

create policy "Admins manage all opportunity required skills"
  on public.opportunity_required_skills for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

create policy "Members read required skills of published opportunities"
  on public.opportunity_required_skills for select to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.status = 'PUBLISHED'
    )
  );

-- professions and skills need no new policy: both already have
-- "Anyone authenticated can read professions/skills" ... using (true) from
-- migration 002. A member reading a Published opportunity's
-- required_profession_id / skill names resolves those joins under the
-- existing open-read policy.
