-- M10 development/demo admin-provisioning helper -- Decision 2 (Champion,
-- 2026-09-13). Setup tooling only, NOT a new application feature. Does not
-- touch middleware, RLS, or the authorization model -- CHURCH_ADMIN has
-- meant exactly what migration 003's own RLS policies say it means since M3
-- (is_church_admin() checks role IN ('CHURCH_ADMIN', 'SUPER_ADMIN'), and
-- every admin-gated route/action already relies on that). This script only
-- sets the role column on one already-existing members row; it introduces
-- no new concept of "admin," redefines no verification criteria, and grants
-- no capability that migration 003 didn't already define.
--
-- WHAT THIS DOES, exactly:
--   1. Registers no account and sets no password -- the target person must
--      already have registered a normal member account through the app
--      (POST /register / the Create account flow) BEFORE this is run. This
--      script only ever flips an EXISTING row's role column.
--   2. Requires the operator to fill in one specific email address below,
--      replacing the placeholder. There is no default, no wildcard, and no
--      "promote whoever registered most recently" behavior -- the target
--      must be named explicitly, every time.
--   3. Is idempotent: re-running it against the same email is a no-op if
--      that member is already CHURCH_ADMIN (the WHERE clause only matches
--      rows that need to change), and safe to re-run after that member
--      re-registers or if the script is run twice by mistake.
--   4. Never grants SUPER_ADMIN -- this script only ever sets CHURCH_ADMIN,
--      the same level used by every existing admin-facing E2E suite (M3
--      onward) and by this project's one real admin account.
--
-- HOW TO USE (mirrors the existing manual pattern from migration 003's own
-- "CHURCH_ADMIN seeding" note, just made re-runnable):
--   1. Register a normal account through the app for the person who should
--      become an admin -- via /register, with their own real credentials.
--      This script never creates the account or sets/knows the password.
--   2. Replace 'REPLACE_WITH_TARGET_EMAIL@example.com' below with that
--      account's exact email.
--   3. Run this file's UPDATE statement (and only that statement) in the
--      Supabase SQL editor, against the development/demo project.
--   4. The SELECT at the end confirms exactly which row changed (or that
--      no row matched, e.g. a typo'd email) -- always check its output.
--
-- This script intentionally requires the operator to edit the email inline
-- before running it (no environment-variable substitution, no CLI
-- argument) -- that manual edit IS the "intentional operator input"
-- requirement: it is not runnable unattended or by accident.

update public.members
set role = 'CHURCH_ADMIN'
where email = 'REPLACE_WITH_TARGET_EMAIL@example.com'
  and role <> 'CHURCH_ADMIN';

-- Always inspect this after running the UPDATE above.
select id, email, first_name, last_name, role
from public.members
where email = 'REPLACE_WITH_TARGET_EMAIL@example.com';
