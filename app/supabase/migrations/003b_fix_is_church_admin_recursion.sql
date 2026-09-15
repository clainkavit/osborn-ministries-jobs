-- Migration 003b -- fixes a real bug in 003_verification.sql: is_church_admin()
-- was declared without SECURITY DEFINER. Its own query reads public.members,
-- and public.members has a SELECT policy ("Admins read all members") whose
-- USING clause calls is_church_admin() -- so evaluating that inner select
-- re-triggers every SELECT policy on members, including that one, forever.
-- Postgres correctly aborts with "stack depth limit exceeded" (54001) on any
-- query touching a table that has an admin RLS policy (confirmed: this broke
-- ordinary education/experience/etc. inserts during onboarding, unrelated to
-- who was signed in -- a MEMBER onboarding is enough to trigger it because
-- is_church_admin() runs as part of the RLS check on public.members itself).
--
-- Fix: SECURITY DEFINER makes the function's internal select run as its
-- owner, bypassing RLS for that one read, breaking the cycle. search_path is
-- pinned (standard SECURITY DEFINER hardening).

create or replace function public.is_church_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where auth_user_id = auth.uid()
      and role in ('CHURCH_ADMIN', 'SUPER_ADMIN')
  )
$$;
