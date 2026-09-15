-- Migration 006 -- Notifications extension (M8)
-- Source: context/stage-30-m8-implementation-specification.md, resolved by
-- Champion's 21 M8 decisions (2026-09-12).
--
-- Extends the existing notifications table (created early, in migration
-- 003, for M3's own 3-event subset) with M7's application events. No new
-- table, no new columns, no new indexes -- the existing schema already
-- correctly models every M8 event (single member recipient, fixed resolved
-- copy, one deep-link URL).
--
-- Decision 5 -- APPLICATION_OPPORTUNITY_CLOSED fires ONLY from
-- closeRemainingApplications, only for applications it actually
-- transitions to REJECTED in that call. It is never created by
-- closeOpportunity or cancelOpportunity directly (lib/opportunities/actions.ts
-- is not modified by M8 at all).
--
-- Decision 20 -- the prior INSERT policy
-- ("is_church_admin() OR member_id = current_member_id()") permitted a
-- member to insert a notification naming themselves as recipient. Nothing
-- in this codebase ever used that branch -- every legitimate notification
-- writer (M3's verification handlers, every new M8 call site) already runs
-- inside a requireAdmin()-gated server action before insertNotification is
-- ever called. Tightened to admin-only, closing the member-self-insert and
-- forge-recipient paths.

alter table public.notifications
  drop constraint notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'MEMBERSHIP_CONFIRMED',
    'CREDENTIALS_REVIEWED',
    'CORRECTION_REQUESTED',
    'APPLICATION_SHORTLISTED',
    'APPLICATION_INTERVIEW',
    'APPLICATION_SELECTED',
    'APPLICATION_REJECTED',
    'APPLICATION_OPPORTUNITY_CLOSED'
  ));

drop policy "Notification inserts" on public.notifications;

create policy "Admins create notifications"
  on public.notifications for insert to authenticated
  with check (public.is_church_admin());
