-- M10 demo/QA opportunities -- Champion's approved approach (2026-09-13):
-- pure SQL, since opportunities.created_by references public.members(id)
-- (not auth.users directly) and the one real, already-registered
-- CHURCH_ADMIN account already satisfies that reference. No new auth user,
-- no service-role, no schema change.
--
-- NOT idempotent by design -- there is no natural unique key on
-- opportunities to ON CONFLICT against (unlike taxonomy.sql's professions/
-- skills, which have a UNIQUE name). This script is intended as a single
-- deliberate run against a freshly-cleaned development database (after
-- 00_cleanup_dev_fixtures.sql), not a repeatable step. Re-running it will
-- create duplicate opportunities.
--
-- Prerequisite: exactly one members row with role IN ('CHURCH_ADMIN',
-- 'SUPER_ADMIN') must exist (the real admin account, preserved by
-- 00_cleanup_dev_fixtures.sql). Every created_by below resolves it via a
-- subquery, not a hardcoded id.
--
-- Includes Stage 14 Section A's founding case verbatim: 3 driver roles +
-- 1 HR Manager role. The additional opportunities give the 50-member
-- roster (scripts/seed/roster.ts) enough spread to demonstrate strong,
-- moderate, and weak matches, and at least one profession/location
-- mismatch, without inventing new opportunity types or statuses.

do $$
declare
  v_admin_id uuid;
  v_opp_id uuid;
begin
  select id into v_admin_id
  from public.members
  where role in ('CHURCH_ADMIN', 'SUPER_ADMIN')
  limit 1;

  if v_admin_id is null then
    raise exception 'No CHURCH_ADMIN/SUPER_ADMIN member found -- run this only after the real admin account exists.';
  end if;

  -- ---------------------------------------------------------------------
  -- Founding case: 3 driver roles (Stage 14 Section A, project-brief.md's
  -- original ask).
  -- ---------------------------------------------------------------------
  insert into public.opportunities
    (title, type, organization_name, location, description, status, headcount_required, created_by, published_at)
  values
    ('Driver', 'EMPLOYMENT', 'ABC Logistics Ltd', 'Mwanza',
     'Experienced driver needed for local and regional delivery routes. Valid Class C license required.',
     'PUBLISHED', 3, v_admin_id, now())
  returning id into v_opp_id;

  insert into public.opportunity_requirements (opportunity_id, required_profession_id, min_experience_years, required_education_level)
  select v_opp_id, id, 2, null from public.professions where name = 'Driver';

  insert into public.opportunity_required_skills (opportunity_id, skill_id)
  select v_opp_id, id from public.skills where name in ('Class C Driving License', 'Defensive Driving');

  -- ---------------------------------------------------------------------
  -- Founding case: 1 HR Manager role.
  -- ---------------------------------------------------------------------
  insert into public.opportunities
    (title, type, organization_name, location, description, status, headcount_required, created_by, published_at)
  values
    ('HR Manager', 'EMPLOYMENT', 'ABC Logistics Ltd', 'Mwanza',
     'HR Manager to lead recruitment, onboarding, and employee relations for a growing logistics operation.',
     'PUBLISHED', 1, v_admin_id, now())
  returning id into v_opp_id;

  insert into public.opportunity_requirements (opportunity_id, required_profession_id, min_experience_years, required_education_level)
  select v_opp_id, id, 5, 'BACHELORS' from public.professions where name = 'HR Manager';

  insert into public.opportunity_required_skills (opportunity_id, skill_id)
  select v_opp_id, id from public.skills where name in ('Recruitment', 'Leadership');

  -- ---------------------------------------------------------------------
  -- Additional opportunities -- give the roster range to demonstrate
  -- strong/moderate/weak matches and at least one clear mismatch.
  -- ---------------------------------------------------------------------

  -- Strong-match target for the Trade & Technical / Construction cohort.
  insert into public.opportunities
    (title, type, organization_name, location, description, status, headcount_required, created_by, published_at)
  values
    ('Site Electrician', 'EMPLOYMENT', 'Baraka Construction', 'Mbeya',
     'Electrician for an active construction site. Wiring and circuit testing experience required.',
     'PUBLISHED', 2, v_admin_id, now())
  returning id into v_opp_id;

  insert into public.opportunity_requirements (opportunity_id, required_profession_id, min_experience_years, required_education_level)
  select v_opp_id, id, 3, null from public.professions where name = 'Electrician';

  insert into public.opportunity_required_skills (opportunity_id, skill_id)
  select v_opp_id, id from public.skills where name in ('Communication');

  -- Teacher role, Tanga -- matches multiple Education-category members.
  insert into public.opportunities
    (title, type, organization_name, location, description, status, headcount_required, created_by, published_at)
  values
    ('Secondary School Teacher', 'CHURCH', 'Kilimanjaro Christian Academy', 'Tanga',
     'Full-time teaching position at a church-affiliated secondary school.',
     'PUBLISHED', 2, v_admin_id, now())
  returning id into v_opp_id;

  insert into public.opportunity_requirements (opportunity_id, required_profession_id, min_experience_years, required_education_level)
  select v_opp_id, id, 2, 'BACHELORS' from public.professions where name = 'Teacher';

  -- Accountant role, Mwanza -- moderate matches (David Mwakalindile is a
  -- strong match; Onesmo Mrisho, at 1 year experience and NEEDS_CORRECTION,
  -- is deliberately excluded by the eligibility gate).
  insert into public.opportunities
    (title, type, organization_name, location, description, status, headcount_required, created_by, published_at)
  values
    ('Accountant', 'EMPLOYMENT', 'Kilimo Fresh Distributors', 'Mwanza',
     'Accountant to manage day-to-day bookkeeping, tax compliance, and financial reporting.',
     'PUBLISHED', 1, v_admin_id, now())
  returning id into v_opp_id;

  insert into public.opportunity_requirements (opportunity_id, required_profession_id, min_experience_years, required_education_level)
  select v_opp_id, id, 5, 'BACHELORS' from public.professions where name = 'Accountant';

  insert into public.opportunity_required_skills (opportunity_id, skill_id)
  select v_opp_id, id from public.skills where name in ('Bookkeeping', 'Financial Reporting');

  -- Software Developer role, Dar es Salaam -- a clear profession/location
  -- mismatch against most of the roster (only 1-2 Technology-category,
  -- Dar-based members would score well), useful for demonstrating a
  -- narrow/weak match set.
  insert into public.opportunities
    (title, type, organization_name, location, description, status, headcount_required, created_by, published_at)
  values
    ('Junior Software Developer', 'EMPLOYMENT', 'Osborn Digital Services', 'Dar es Salaam',
     'Entry-to-mid level developer role supporting internal tools.',
     'PUBLISHED', 1, v_admin_id, now())
  returning id into v_opp_id;

  insert into public.opportunity_requirements (opportunity_id, required_profession_id, min_experience_years, required_education_level)
  select v_opp_id, id, 2, 'BACHELORS' from public.professions where name = 'Software Developer';

  insert into public.opportunity_required_skills (opportunity_id, skill_id)
  select v_opp_id, id from public.skills where name in ('JavaScript', 'SQL');

  -- One Draft opportunity (never published) -- exercises the "Draft never
  -- visible to a member" rule with realistic content, not a throwaway.
  insert into public.opportunities
    (title, type, organization_name, location, description, status, headcount_required, created_by)
  values
    ('Logistics Coordinator (Planned)', 'EMPLOYMENT', 'ABC Logistics Ltd', 'Dodoma',
     'Draft posting -- pending internal sign-off before publishing.',
     'DRAFT', 1, v_admin_id);

end $$;
