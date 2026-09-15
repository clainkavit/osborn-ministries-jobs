-- Migration 001 -- Initial schema (M1)
-- Source: stage-21-m1-implementation-spec.md section 7, using the CORRECTED
-- three-field verification model (not the single conflated profile_status
-- column from the received draft). See that file's opening note and
-- context/memory/m1_schema_verification_fields_corrected.md.
--
-- This migration establishes ONLY the identity foundation. The professional
-- profile (profession, education, experience, skills, certifications,
-- documents, availability) is M2, per stage-15-data-model.md.

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

  -- Three INDEPENDENT fields. A member can be membership_status = 'CONFIRMED'
  -- while credentials_status = 'PENDING' at the same time -- a single column
  -- could not represent that, and stage-13-acceptance-criteria.md tests
  -- exactly that combination.
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
  -- REVIEW_PENDING: set when a Reviewed member edits Experience (stage-7's
  -- 2026-09-10 reverification decision -- lighter than a full reset to
  -- PENDING). Not triggered anywhere in M1; the value is in the enum now so
  -- a later milestone doesn't need a breaking ALTER.

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stage 21 section 9 -- RLS foundation. Only the initial policies; admin
-- read access to the directory and the verification-gate visibility rule
-- arrive with M2-M4.
alter table public.members enable row level security;

create policy "Members can view their own profile"
  on public.members
  for select
  to authenticated
  using (auth.uid() = auth_user_id);

-- Needed for registration: a just-signed-up user creates their own members
-- row (Stage 21 section 10). The WITH CHECK ties the row to the caller's
-- own auth.uid() so a user can only ever insert a row for themselves, and
-- the role default of 'MEMBER' plus no UPDATE-of-role policy means they
-- cannot self-promote to an admin role here.
create policy "Members can create their own profile"
  on public.members
  for insert
  to authenticated
  with check (auth.uid() = auth_user_id);

create policy "Members can update their own profile"
  on public.members
  for update
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- keep updated_at honest
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_set_updated_at
  before update on public.members
  for each row
  execute function public.set_updated_at();
