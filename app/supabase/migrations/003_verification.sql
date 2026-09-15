-- Migration 003 -- Verification (M3)
-- Source: stage-23-m3-implementation-checklist.md.
--
-- Adds: verification_history (append-only audit trail), notifications
-- (in-app, minimal M3 subset), the is_church_admin() RLS helper, and the
-- admin RLS policies M1/M2 never created. No members schema change -- the
-- four status enums from migration 001 already carry every value M3 needs.
--
-- ACCEPTED PRODUCT RULE (Req 1, checklist Contradiction C):
--   directory-visible  <=>  membership_status = 'CONFIRMED'
--                           AND credentials_status IN ('REVIEWED', 'REVIEW_PENDING')
--   PENDING and NEEDS_CORRECTION credentials are NOT visible. REVIEW_PENDING
--   IS visible (a lighter-weight reverification after an Experience edit, per
--   stage-7's reverification decision).

-- ---------------------------------------------------------------------------
-- helper: is the current auth user a Church/Super admin?
--
-- SECURITY DEFINER is required, not optional: this function's own query
-- reads public.members, and public.members carries a SELECT policy
-- ("Admins read all members", below) that calls is_church_admin() in its
-- USING clause. Under the default SECURITY INVOKER, evaluating that inner
-- select re-triggers every SELECT policy on members -- including the one
-- calling is_church_admin() again -- and Postgres recurses until it hits
-- "stack depth limit exceeded" (54001) on ANY query touching a table with
-- an admin RLS policy (observed: education inserts during onboarding failed
-- with exactly this error once migration 003 was applied). SECURITY DEFINER
-- makes this function's internal select run as its owner, bypassing RLS for
-- that one read and breaking the cycle. search_path is pinned for the usual
-- SECURITY DEFINER hardening reason (untrusted search_path hijacking).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- directory-visibility predicate (accepted rule, Req 1)
-- ---------------------------------------------------------------------------
create or replace function public.member_is_directory_visible(
  p_membership text,
  p_credentials text
)
returns boolean
language sql
immutable
as $$
  select p_membership = 'CONFIRMED'
     and p_credentials in ('REVIEWED', 'REVIEW_PENDING')
$$;

-- ---------------------------------------------------------------------------
-- verification_history -- append-only audit trail
-- ---------------------------------------------------------------------------
create table public.verification_history (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.members(id) on delete cascade,
  track           text not null check (track in ('MEMBERSHIP', 'CREDENTIALS')),
  action          text not null check (
    action in ('APPROVED', 'NEEDS_CORRECTION', 'RESUBMITTED', 'AUTO_REVERIFICATION')
  ),
  note            text,               -- present for NEEDS_CORRECTION (optional, soft-warning); may accompany others
  actor_admin_id  uuid references public.members(id),  -- acting admin; null for member/system events
  actor_member_id uuid references public.members(id),  -- the member, for RESUBMITTED; null otherwise
  detail          text,               -- free-text note of what changed, for AUTO_REVERIFICATION
  created_at      timestamptz not null default now()
);

create index verification_history_member_idx
  on public.verification_history (member_id, created_at desc);

alter table public.verification_history enable row level security;

-- Members read their own history (drives "what the admin said").
create policy "Members read own verification history"
  on public.verification_history for select to authenticated
  using (member_id = public.current_member_id());

-- Admins read all history.
create policy "Admins read all verification history"
  on public.verification_history for select to authenticated
  using (public.is_church_admin());

-- Inserts: an admin acting on any member, OR the member themselves
-- (RESUBMITTED / AUTO_REVERIFICATION rows written by their own actions).
create policy "Verification history inserts"
  on public.verification_history for insert to authenticated
  with check (
    public.is_church_admin()
    or member_id = public.current_member_id()
  );

-- No UPDATE / DELETE policy anywhere: the audit trail is append-only.

-- ---------------------------------------------------------------------------
-- notifications -- in-app, minimal M3 subset (Stage 15's Notification)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  type        text not null check (
    type in ('MEMBERSHIP_CONFIRMED', 'CREDENTIALS_REVIEWED', 'CORRECTION_REQUESTED')
  ),
  body_text   text not null,          -- resolved copy, stored at creation
  related_url text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_member_idx
  on public.notifications (member_id, created_at desc);

alter table public.notifications enable row level security;

-- Members read + mark-read their own notifications.
create policy "Members read own notifications"
  on public.notifications for select to authenticated
  using (member_id = public.current_member_id());

create policy "Members mark own notifications read"
  on public.notifications for update to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- Inserts: an admin creating a notification for any member (approve/correct),
-- or the member for a self-notification (none in M3, but harmless).
create policy "Notification inserts"
  on public.notifications for insert to authenticated
  with check (
    public.is_church_admin()
    or member_id = public.current_member_id()
  );

-- ---------------------------------------------------------------------------
-- members: admin policies (Gap 3 -- none existed before M3)
-- ---------------------------------------------------------------------------

-- Admins read any member row (verification review + directory gate).
create policy "Admins read all members"
  on public.members for select to authenticated
  using (public.is_church_admin());

-- Admins update a member's verification status ONLY. Postgres RLS can't
-- restrict which columns an UPDATE touches, so the server action is the
-- real guard (it only ever sets membership_status / credentials_status).
-- This WITH CHECK is defense-in-depth: an admin update may not change role
-- (no privilege escalation) and may not change profile_status (that's M2's
-- submit transition, never M3's).
create policy "Admins update member verification status"
  on public.members for update to authenticated
  using (public.is_church_admin())
  with check (
    public.is_church_admin()
    and role = 'MEMBER'
    and profile_status = 'PROFILE_COMPLETE'
  );

-- ---------------------------------------------------------------------------
-- sub-collections: admins get SELECT (read-only -- they review, not edit)
-- ---------------------------------------------------------------------------
create policy "Admins read all education"
  on public.education for select to authenticated
  using (public.is_church_admin());

create policy "Admins read all experience"
  on public.experience for select to authenticated
  using (public.is_church_admin());

create policy "Admins read all member skills"
  on public.member_skills for select to authenticated
  using (public.is_church_admin());

create policy "Admins read all certifications"
  on public.certifications for select to authenticated
  using (public.is_church_admin());

create policy "Admins read all documents"
  on public.documents for select to authenticated
  using (public.is_church_admin());

-- Storage: admins may read any member's documents (open a CV in review).
create policy "Admins read member documents storage"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'member-documents'
    and public.is_church_admin()
  );

-- ---------------------------------------------------------------------------
-- CHURCH_ADMIN seeding (not SQL you run blind): after applying this
-- migration, register a normal account through the app, then:
--   update public.members set role = 'CHURCH_ADMIN' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
