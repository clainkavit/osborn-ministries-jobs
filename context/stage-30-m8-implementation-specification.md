# Stage 30 — M8 Implementation Specification: Notifications

Written 2026-09-12, by Claude. **Implementation-ready.** All eleven decisions this document originally flagged as open were resolved by Champion on 2026-09-12 and are now binding for M8 — see §12. No code, migration, or test file has been touched while producing this document; implementation has not started.

---

## 0. What already exists (inspection summary)

M8 is **not a green field**. M3 already built a real, working, in-app notification system for its own 3-event subset. M8's job is to *extend* that system to M5/M6/M7's events, not design a new one.

**Already decided and already built:**
- **In-app only, no email** — Stage 12's own opening line states this as already decided. Stage 18's M8 description names only "in-app notifications... Notifications screen, read/unread state."
- **Migration number is pre-named**: Stage 20 reserves `006_notifications.sql` for exactly this purpose. The real `notifications` table was actually created early, inside migration 003 (M3 needed it immediately for its own verification-decision flow). M8's migration is an `alter table` extension of the existing table, not a `create table` — see §13.
- **Exact schema already live**: `public.notifications (id, member_id, type [check constraint], body_text, related_url, read_at, created_at)`, index `(member_id, created_at desc)`. A deliberate simplification of Stage 15's original polymorphic `related_entity_type`/`related_entity_id` design into a single resolved `related_url` string — M3 already made this call; M8 follows it.
- **RLS already exists**: members SELECT/UPDATE their own rows only. The existing INSERT policy previously permitted `is_church_admin() OR member_id = current_member_id()` — **this member-self-insert branch is removed by M8, per Decision 20 (RESOLVED).**
- **Server-side write pattern already established**: `insertNotification(supabase, memberId, type)` in `lib/notifications/writer.ts` — takes an existing Supabase client and resolves body/URL from a `NOTIFICATION_COPY` lookup table keyed by `NotificationType`.

  **Important architectural correction, binding for this entire document:** the existing verification code (`lib/verification/actions.ts`) calls `insertNotification` using the *same Supabase client instance* as its preceding status-update and audit-history writes, and on a notification-insert failure it **manually issues a second, compensating update/delete** to undo those two prior writes. This is **not** database transaction atomicity — no PostgreSQL transaction or RPC wraps these statements; each is a separate round-trip, and a crash between them would leave inconsistent state that no rollback code can reach. It is a **guarded, application-level compensating-action pattern**, and it is described that way for the remainder of this document. The three concepts are kept distinct throughout: (1) **database transaction semantics** — a real Postgres transaction/RPC, which this system does not use anywhere; (2) **guarded business-state updates** — M5/M7's own `.eq('status', from)` guarded-update pattern, which is real and load-bearing; (3) **notification side effects** — best-effort writes that must never be allowed to compromise (1) or (2), governed for M8 by Decision 21 below.
- **Read queries already exist**: `getMyNotifications()`, `getUnreadCount()` in `lib/notifications/queries.ts`.
- **Mark-read already exists**: `markNotificationRead(id)` in `lib/notifications/actions.ts`.
- **UI already exists and already works**: `/notifications` page, `NotificationRow`, `NotificationBell` — all wired into the member layout.
- **E2E precedent already exists**: M3's acceptance test 18 proves the mark-read + bell-decrement flow end to end for the existing subset.
- **Admin notifications are explicitly "not P0"** — Stage 12 states this in writing, naming the admin dashboard's live "needs attention" counts (already built) as the actual mechanism.

**Confirmed still absent, needing M8's own work:**
- No M5/M6/M7 event writes any notification yet — grep-confirmed zero references to `notifications`/`NotificationType` anywhere in `lib/opportunities/`, `lib/matching/`, `lib/applications/`.
- The `NotificationType` union and the DB check constraint only have 3 values; M8 extends both.
- No "mark all as read" action exists — **not added by M8, per Decision 8 (RESOLVED).**
- The admin dashboard's `<StatCard label="Applications" value={0} />` is stale (M7 added real applications) but fixing it is M9's job per Stage 18, not M8's.

---

## 1. Milestone goal

**M8 adds:** in-app notification creation for every M5/M6/M7 event Stage 12 specified copy for and that survives the resolved decisions below, extending the existing M3 notification system (table, RLS, writer, queries, UI) rather than building a parallel one.

**M8 deliberately does not add:** email or any other delivery channel; a general messaging/chat system; admin-facing notifications (dashboard counts remain the mechanism, per Decisions 12/13/16, RESOLVED); notification preferences/muting; push/SMS/WhatsApp; any member-facing matching computation or notification of any kind (Decision 18, RESOLVED — `lib/matching/` gains zero new code, zero new `insertNotification` call sites); mark-all-as-read (Decision 8, RESOLVED); pagination (Decision 10, RESOLVED); retention/deletion (Decision 11, RESOLVED); a notification for application withdrawal (Decision 19, RESOLVED); a retry system, notification queue, or delivery service of any kind (Decision 21, RESOLVED).

---

## 2. User journey

**Event → Create Notification → Deliver (persist) → Read**, confirmed by direct inspection of the working M3 implementation. "Deliver" means the row is committed and will appear the next time the recipient's own query runs — synchronous, in the same request as the triggering action, not asynchronous, not queued.

---

## 3. Notification events

### Already implemented (M3, unchanged by M8)
| Event | Type | Trigger function |
|---|---|---|
| Membership → Confirmed | `MEMBERSHIP_CONFIRMED` | `lib/verification/actions.ts`'s decision handler |
| Credentials → Reviewed | `CREDENTIALS_REVIEWED` | same |
| Either track → Needs Correction | `CORRECTION_REQUESTED` | same |

### New for M8 — Applications

| Event | Trigger function | Recipient | Copy (Stage 12, verbatim) | Deep link |
|---|---|---|---|---|
| Application → Shortlisted | `shortlistApplication(id)` | the applicant | "You've been shortlisted for [opportunity title]." | `/applications/[id]` |
| Application → Interview | `scheduleInterview(id, ...)` | the applicant | "You've been invited to interview for [opportunity title]. [Details →]" | `/applications/[id]` |
| Application → Selected | `recordOutcome(id, "SELECTED")` | the applicant | "Congratulations — you've been selected for [opportunity title]." | `/applications/[id]` |
| Application → Rejected (individual outcome) | `recordOutcome(id, "REJECTED")` | the applicant | "You weren't selected for [opportunity title] this time." | `/applications/[id]` |
| Application → Rejected (via opportunity closure) | `closeRemainingApplications(opportunityId)`, per application actually transitioned to REJECTED | that application's `member_id` | "[Opportunity title] has closed. Your application wasn't carried forward." | `/applications/[id]` |

**RESOLVED — Decision 5 (opportunity-closed notification):** the notification is built and fires **only** from `closeRemainingApplications`, and **only** for each individual application that function actually transitions to `REJECTED` in that call. It is a per-application side effect of the bulk action, not a per-opportunity broadcast. `closeOpportunity` and `cancelOpportunity` themselves gain **zero** notification logic and **zero** `insertNotification` call sites — they only ever change `opportunities.status`, exactly as M5 built them. An application that stays open because the admin chose "continue selection" rather than calling `closeRemainingApplications` never receives this notification, which is the correct, truthful behavior (Stage 7's own decided rule: closing an opportunity never automatically affects applications in flight).

**Deliberately excluded, per Stage 12's own explicit instruction and Champion's resolved decisions:**
- **Application → Reviewed produces NO notification** (Stage 12, explicit).
- **Application → Applied produces NO notification** — the "Application submitted" feedback is inline UI (`ApplyButton`), not a persisted notification.
- **Application → Withdrawn produces NO notification** — **RESOLVED, Decision 19: no notification to the member or any admin.**

### Matching (M6) — excluded, RESOLVED

**Decision 18 (RESOLVED): M8 introduces zero member-facing matching notifications and zero new matching computation.** `lib/matching/` is not modified in any way by M8; it gains no new `insertNotification` call sites, no new exports, no new files. The "new opportunity matches your profile" notification Stage 12 lists is **not built**, full stop — there is no live member-facing match computation anywhere in this codebase to trigger it from, and Stage 28's own M6 specification remains the authority on that boundary, unchanged by M8.

---

## 4. Recipient rules

- **Verification events (existing):** the member whose track changed. Unchanged.
- **Application status events (Shortlisted/Interview/Selected/individual-Rejected):** the applicant (`applications.member_id`) — single, unambiguous recipient.
- **Opportunity-closed-driven rejection:** the specific member whose specific application `closeRemainingApplications` actually transitioned to REJECTED in that call — resolved per-row from the same eligible-applications set the action already computes via `isEligibleForBulkClose`, not a broadcast to every member with any relationship to the opportunity.
- **RESOLVED — Decision 13: no admin, and specifically not the opportunity's `created_by` admin, ever receives an M8 notification.** The existing admin dashboard counts remain the sole admin-facing mechanism, unchanged by M8.

---

## 5. Notification persistence model

**No schema redesign — extend the existing table.** `notifications (id, member_id, type, body_text, related_url, read_at, created_at)` is correct and sufficient for every M8 event: every one has a single member recipient, fixed resolved copy, and one deep-link URL.

- **Immutable after creation, except `read_at`:** yes, unchanged.
- **Read state belongs to the notification row (`read_at`):** yes, unchanged.
- **Deletable:** **RESOLVED — Decision 11: no.** No delete action, no automatic expiry, no archival, no retention configuration. Notifications persist indefinitely.
- **Type as check constraint:** yes, extended via `alter table ... drop constraint ... add constraint` with the new M8 values (§13).
- **Deduplication:** **RESOLVED — Decision 6: none added.** No dedup query, no uniqueness constraint, no idempotency key, no "already notified" lookup. M7's guarded, `.eq('status', from)`-scoped application-state transitions already make every relevant event structurally one-shot per application; a second attempt at an already-completed transition fails that guard before the notification write is ever reached.
- **Indexes:** the existing `(member_id, created_at desc)` index already serves every M8 query pattern. No new index added.
- **Foreign keys:** unchanged — `member_id references members(id) on delete cascade`.
- **Retention:** **RESOLVED — Decision 11: none.** Persist indefinitely.

---

## 6. Delivery model

**A. In-app notifications only.** Already decided; no source document at any point requests email, SMS, WhatsApp, or push for M8.

---

## 7. Read/unread behavior

Already built, unchanged by M8:

- **Becomes unread:** at creation (`read_at` null).
- **Becomes read:** `markNotificationRead(id)`, called automatically when a member clicks the notification row.
- **Opening auto-marks read:** yes, best-effort (a failed mark-read doesn't block navigation).
- **"Mark all as read":** **RESOLVED — Decision 8: not implemented.**
- **Read/unread is per-user:** yes, inherent to the `member_id`-scoped row model.
- **Unread count in navigation:** yes, already built (`NotificationBell`), unchanged.
- **Empty state:** the existing M3-era copy ("Nothing yet. We'll let you know when the church reviews your profile.") is scoped to verification-only language and needs a copy-only update to reflect the broader event set M8 introduces. This is a text change inside the existing `/notifications` page, not a new decision or a structural change.

---

## 8. Notification UI

**No new screens.** `NotificationBell`, `/notifications`, `NotificationRow` are unchanged structurally; only the empty-state copy (§7) is updated.

- **Ordering:** newest-first, unchanged.
- **Grouping:** none, unchanged.
- **Pagination:** **RESOLVED — Decision 10: none.** The existing flat, unpaginated, newest-first list is kept exactly as-is.
- **Unread styling:** bold text + filled dot, unchanged.
- **Link behavior:** unchanged (`router.push(relatedUrl)` + `router.refresh()`); for M8's new events `relatedUrl` becomes `/applications/[id]`, an existing, already-guarded M7 route.
- **Empty/loading/error states:** unchanged shape (Server Component fetch before render; a failed `getMyNotifications()` returns `[]` via its existing early-return pattern, matching every other list query in this codebase).

---

## 9. Security / RLS

**RESOLVED — Decision 20: the notification INSERT policy is tightened to admin-only.** The prior `is_church_admin() OR member_id = current_member_id()` policy is replaced with `is_church_admin()` alone (§13). Every legitimate notification writer — the M3 verification handlers and every new M8 call site — already runs inside a `requireAdmin()`-gated server action before `insertNotification` is ever called, so removing the member-self-insert branch removes no legitimate path.

**Guaranteed by this change, and covered by required acceptance tests (§16):**
- A member cannot insert a notification for themselves.
- A member cannot insert a notification for another member.
- A member cannot read another member's notifications (unchanged, already enforced by the existing SELECT policy).
- A member cannot modify another member's notification (unchanged, already enforced by the existing UPDATE policy plus the application code's own `.eq('member_id', ...)` guard).
- Admin access: `is_church_admin()` alone now gates every INSERT; no admin SELECT policy exists or is needed (there is no admin notification feed, per Decision 12).
- No service-role bypass exists or is needed anywhere in this change — every write happens through the same authenticated, RLS-respecting client the triggering admin action already uses. `SUPABASE_SECRET_KEY` remains unset.

---

## 10. Server-side architecture

**Extend the existing pattern — do not introduce a second one.** `insertNotification(supabase, memberId, type)` is called inline, synchronously, inside the triggering server action, using the same Supabase client instance the action already has open. This is a **same-request, same-client sequence of separate statements**, not a database transaction (see §0's architectural correction) — described precisely as that throughout this document, not as "the same transaction."

**M8's new call sites:**
- `shortlistApplication` → one `insertNotification` call, one recipient.
- `scheduleInterview` → one `insertNotification` call, one recipient.
- `recordOutcome(id, "SELECTED")` → one `insertNotification` call, one recipient.
- `recordOutcome(id, "REJECTED")` → one `insertNotification` call, one recipient.
- `closeRemainingApplications` → one `insertNotification` call **per application actually transitioned to REJECTED in that invocation**, inside the same loop/pass that performs those transitions — the one true fan-out case in this system, governed by Decision 21 (§11).

No database trigger, no queue, no separate notification-service abstraction, no change to `lib/opportunities/actions.ts` — `closeOpportunity` and `cancelOpportunity` are untouched by M8 (Decision 5, RESOLVED).

---

## 11. Failure semantics — RESOLVED

**Single-recipient call sites (`shortlistApplication`, `scheduleInterview`, `recordOutcome`):** these follow the existing verification-era compensating-action pattern, described precisely: on a notification-insert failure, the action issues a second, explicit guarded update to revert the application's `status` (and, for `scheduleInterview`, the interview fields) back to its prior value, using the same `.eq('status', to)`-style guard the forward transition itself used, and reports failure to the caller. This is a **compensating action**, not a rollback of a database transaction — no Postgres transaction exists to roll back. It mirrors the existing `lib/verification/actions.ts` precedent applied to the single-recipient shape, where that precedent transfers cleanly (each of these is a single, deliberate, occasional, one-recipient admin action).

**`closeRemainingApplications` — RESOLVED, Decision 21(c) with Champion's binding clarification:**

This is an application-state operation whose primary outcome is closing eligible applications; notification delivery is a secondary side effect and must never compromise the primary outcome. Binding rules:

1. **Application status changes commit regardless of notification-insert outcome.** Each eligible application's guarded status update (`.eq('status', from)` → `REJECTED`) is performed and its success/failure is independent of whether that same application's notification insert later succeeds.
2. **A notification failure never rolls back an application rejection.** There is no compensating update that reverts a REJECTED status back to its prior value because a notification failed to insert — the rejection is real and stands regardless.
3. **A notification failure never prevents other eligible applications in the same batch from being processed.** The loop continues to the next eligible application after a notification failure on one; it does not abort the batch.
4. **Notification failures are never silently swallowed.** The action tracks which notification inserts failed and surfaces that count/list in its own return value.
5. **The returned result exposes enough information for the caller to know delivery was incomplete** — concretely, the action's success payload gains `applicationsClosed` (count actually transitioned to REJECTED) and `notificationsFailed` (count of those whose notification insert did not succeed), so admin-facing code can distinguish "12 closed, 12 notified" from "12 closed, 9 notified, 3 notification failures."
6. **No retry system, notification queue, delivery service, or new admin notification UI is built.** A failed notification insert is recorded in the returned count and nothing more — no automatic retry, no background job, no queue table. This keeps the implementation proportional to the existing architecture, which has no queueing infrastructure anywhere.

**Other failure scenarios, unchanged from the original draft:**
- **Same event triggered twice:** structurally prevented by M7's guarded transitions (Decision 6, RESOLVED — no separate dedup logic needed).
- **User refreshes/retries:** `markNotificationRead` is naturally idempotent; a retried triggering action fails at the existing transition guard before reaching the notification-write step.
- **Notification link points to a resource no longer available:** the existing `/applications/[id]` page's own `notFound()` guard already handles this; no new handling needed.

---

## 12. Product decisions — all RESOLVED

| # | Decision | Resolution |
|---|---|---|
| 1 | In-app only vs. email | **In-app only.** Already decided; unchanged. |
| 2 | Exact notification event list | **Per §3**, including the resolved opportunity-closed event. |
| 3 | Recipient rules | **Per §4.** |
| 4 | Notification persistence model | **Extend the existing `notifications` table.** No new table, no redesign. |
| 5 | Opportunity-closed notification trigger | **Build it, triggered ONLY from `closeRemainingApplications`, only for applications it actually transitions to REJECTED.** `closeOpportunity`/`cancelOpportunity` gain no notification logic. |
| 6 | Deduplication/idempotency | **None added.** Rely entirely on M7's guarded state transitions. |
| 7 | Read/unread semantics | **Per §7** (already built, unchanged). |
| 8 | Mark-all-as-read | **Not implemented.** |
| 9 | Unread badge/count | **Unchanged** (already built, type-agnostic). |
| 10 | Notification list pagination | **None.** Flat, unpaginated, newest-first list unchanged. |
| 11 | Retention/deletion | **None.** Notifications persist indefinitely; no delete, expiry, or archival. |
| 12 | Admin notification access | **No admin notification feed.** Dashboard counts remain the mechanism. |
| 13 | Opportunity creator / admin notifications on applications | **None.** No admin or opportunity-creator notification of any kind for any M7 event. |
| 14 | Member verification notifications | **Unchanged** (already built, M3). |
| 15 | Member application-status notifications | **Shortlisted, Interview, Selected, Rejected (individual and closure-driven) only.** Explicitly not Reviewed, not Withdrawn. |
| 16 | Admin new-application notifications | **None.** Same "not P0" deferral as Decision 12/13. |
| 17 | Interview scheduling notification | **Yes**, per Stage 12's copy. |
| 18 | M6 matching notifications | **None whatsoever.** Zero new code in `lib/matching/`; zero new `insertNotification` call sites there; no member-facing match computation of any kind. |
| 19 | Application withdrawal notifications | **None.** No notification to the member or any admin. |
| 20 | Notification INSERT RLS | **Tightened to admin-only** (`is_church_admin()` alone). Member self-insert and forge-recipient paths are removed. |
| 21 | `closeRemainingApplications` fan-out failure semantics | **Status changes always commit; notification failures never roll back status and never block other eligible applications; failures are counted and returned, never silently swallowed; no retry/queue/delivery-service/new UI is built.** Exact mechanics in §11. |

No decision remains open. Every item above is binding for implementation.

---

## 13. M8 data model

**No new table.** One migration, additive, extending the existing `notifications` table's check constraint and one RLS policy only.

```sql
-- Migration 006 -- Notifications extension (M8)
-- Extends the existing notifications table (created early, in migration
-- 003, for M3's own 3-event subset) with M7's application events,
-- including the opportunity-closed-driven rejection notification, which
-- fires ONLY from closeRemainingApplications for applications it actually
-- transitions to REJECTED (Decision 5) -- never from closeOpportunity or
-- cancelOpportunity directly. No new table -- the existing schema already
-- correctly models every M8 event.

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

-- Decision 20: tighten the insert policy to admin-only. Every legitimate
-- notification writer (M3's existing handlers and every new M8 call site)
-- already runs inside a requireAdmin()-gated server action before
-- insertNotification is ever called -- the member-self-insert branch this
-- removes has no legitimate caller.
drop policy "Notification inserts" on public.notifications;

create policy "Admins create notifications"
  on public.notifications for insert to authenticated
  with check (public.is_church_admin());
```

No new columns, no new indexes, no new foreign keys, no new table. This migration touches only `public.notifications`'s constraint and its INSERT policy — it does not touch `applications`, `opportunities`, `members`, or any other M1-M7 table.

---

## 14. M8 API/server-action shape

**No new module — extend the existing three files.**

**Notification creation** (`lib/notifications/writer.ts`, extended): `insertNotification(supabase, memberId, type)` — unchanged signature. `NOTIFICATION_COPY` (in `types/notification.ts`) gains 5 new entries: `APPLICATION_SHORTLISTED`, `APPLICATION_INTERVIEW`, `APPLICATION_SELECTED`, `APPLICATION_REJECTED`, `APPLICATION_OPPORTUNITY_CLOSED` — each with `body` (Stage 12's exact copy, opportunity/application title interpolated by the caller at write time, matching the existing fully-resolved-at-insert pattern) and `relatedUrl` (a function of the application's own id: `/applications/[id]`).

**Call-site integration** (additive edits to `lib/applications/actions.ts` only — `lib/opportunities/actions.ts` is untouched, per Decision 5):
- `shortlistApplication`, `scheduleInterview`, `recordOutcome` — each gains one `insertNotification` call after its guarded transition succeeds, with the compensating-action failure handling from §11's single-recipient rules.
- `closeRemainingApplications` — gains, inside its existing eligible-applications loop, one `insertNotification` call per application actually transitioned to REJECTED, and the return-value extension (`applicationsClosed`, `notificationsFailed`) from §11 Decision 21.

**User read operations** (`lib/notifications/queries.ts`, unchanged): `getMyNotifications()`, `getUnreadCount()` — both already type-agnostic; zero query changes.

**User write operations** (`lib/notifications/actions.ts`, unchanged): `markNotificationRead(id)`.

**No admin operations** — per Decision 12, no admin-facing notification API exists or is added.

**Authorization:** every creation call site is already gated by `requireAdmin()` before reaching the new `insertNotification` calls; only the RLS-layer tightening (§13) changes the authorization surface.

**Idempotency:** none added, per Decision 6 — the state machine's own guarded transitions are the sole idempotency mechanism.

---

## 15. Routes and screens

**No new routes.** `/notifications` is unchanged in structure; only its empty-state copy is updated (§7). Clicking a new-type notification navigates to `/applications/[id]`, an existing, already-guarded M7 route.

---

## 16. Acceptance criteria (draft matrix, for `m8-acceptance.spec.ts`)

1. Shortlisting an application creates a notification for that applicant, type `APPLICATION_SHORTLISTED`, correct copy, `relatedUrl` → that application's detail page.
2. Scheduling an interview creates a notification, type `APPLICATION_INTERVIEW`, for the applicant.
3. Recording Selected creates a notification, type `APPLICATION_SELECTED`, for the applicant.
4. Recording Rejected (individual outcome) creates a notification, type `APPLICATION_REJECTED`, for the applicant; the notification body never includes admin-internal outcome notes.
5. `closeRemainingApplications` creates a notification, type `APPLICATION_OPPORTUNITY_CLOSED`, **only** for applications it actually transitions to REJECTED in that call — and creates **none** for applications already SELECTED, already REJECTED, WITHDRAWN, or otherwise outside its eligible set.
6. Each notification appears only in its own recipient's `/notifications` list, unread, and increments only that recipient's unread badge count.
7. Opening a notification marks it read, decrements the badge, and navigates to `/applications/[id]` for that specific application.
8. A member cannot read another member's notifications via a direct query (RLS proof).
9. A member cannot insert a notification for themselves via a direct query (RLS proof — the specific gap Decision 20 closes).
10. A member cannot insert a notification for another member via a direct query (RLS proof).
11. The existing M3 notification flows (Membership Confirmed, Credentials Reviewed, Correction Requested) still succeed end to end after the RLS tightening — proves Decision 20's change doesn't break any legitimate existing writer.
12. A representative new M8 flow (e.g., Shortlist) still succeeds end to end after the RLS tightening — proves the new writers are correctly covered by the admin-only policy.
13. Marking Reviewed produces zero new notification rows.
14. Withdrawing an application produces zero new notification rows.
15. Applying to an opportunity produces zero new notification rows.
16. No notification of any type is ever created by any code path in `lib/matching/` (structural proof — no `insertNotification` reference exists there).
17. The empty state on `/notifications` renders its updated copy for a member with zero notifications.
18. `closeRemainingApplications`'s returned result exposes `applicationsClosed` and `notificationsFailed`, and in the normal (non-failure) case `notificationsFailed` is 0 while `applicationsClosed` matches the actual number of rows transitioned.
19. A simulated notification-insert failure during `closeRemainingApplications` does not revert the affected application's already-committed REJECTED status, and does not prevent the remaining eligible applications in the same call from being processed.

---

## 17. Regression protection

Explicitly protected, unchanged by M8:
- **Verification rules** (`lib/verification/`) — no file modified; existing `insertNotification` call sites there are untouched.
- **Profile rules** (`lib/profile/`) — untouched.
- **Directory visibility** (`lib/directory/`) — untouched.
- **Opportunity lifecycle** (`lib/opportunities/`) — untouched, including `closeOpportunity`/`cancelOpportunity`, which gain zero notification logic per Decision 5.
- **M6 matching/scoring/ranking** (`lib/matching/`) — untouched; zero new code, zero new `insertNotification` call sites, per Decision 18.
- **Application state machine** (`lib/applications/rules.ts`) — untouched; M8 adds notification side effects to existing actions in `lib/applications/actions.ts`, never new transitions or predicate logic.
- **Contact-info visibility** — untouched; no notification body ever includes phone/email.
- **Withdrawal rules** — untouched; per Decision 19, withdrawal remains notification-free.
- **Close-remaining behavior** — `isEligibleForBulkClose` and the guarded status update are untouched in their own logic; M8 only adds a notification call per successfully-transitioned row and the two new return-value counts (§11), never changing which rows are eligible or how the status update itself is guarded.
- **RLS boundaries** — tightened in exactly one deliberate way (Decision 20); every other existing policy on `notifications` and every other table's RLS is untouched.
- **No persisted M6 scores** — unaffected; M8 doesn't touch `lib/matching/` or add any scoring-related column anywhere.

---

## 18. Scope exclusions

Explicitly excluded from M8, none built: chat/messaging of any kind; real-time presence; push notifications; SMS; WhatsApp; email of any kind; notification preferences; member-facing matching or any new matching computation (`lib/matching/` untouched); recommendation engine; configurable notification workflows; scheduled/delayed notifications; marketing broadcasts; a generic admin announcement system; a general-purpose admin notification feed; mark-all-as-read; notification deletion or retention policy; pagination; a retry system, notification queue, or delivery service; any new admin notification UI.

---

## 19. Migration strategy

**Number: `006_notifications.sql`** — the exact filename Stage 20's own architecture document already reserves for this purpose. **Contents:** exactly the two statements in §13 — extend the `type` check constraint with 5 new values (including `APPLICATION_OPPORTUNITY_CLOSED`, confirmed included per Decision 5), tighten the INSERT policy to admin-only per Decision 20. Additive only: no table dropped, no other table altered, no data backfill needed (existing M3-era rows remain valid under the extended constraint; the RLS tightening removes a permission path no existing code exercises).

---

## 20. Implementation sequence

1. Migration `006_notifications.sql` — the two `alter` statements from §13, final and confirmed (5 new type values, admin-only INSERT policy).
2. Domain types — extend `NotificationType` and `NOTIFICATION_COPY` in `types/notification.ts` with the 5 new entries; `relatedUrl` for these becomes a function of the application id rather than a fixed string.
3. No separate notification-service abstraction — `lib/notifications/writer.ts` remains the sole write path, unchanged in shape.
4. Server actions/integration points — add the `insertNotification` calls and the §11 failure-handling logic at the five identified call sites in `lib/applications/actions.ts` only; `lib/opportunities/actions.ts` is not touched.
5. Queries — no changes (`getMyNotifications`/`getUnreadCount` are already type-agnostic).
6. RLS — the one INSERT-policy change from §13.
7. Member UI — one copy-only update (`/notifications`'s empty-state text); no component or route changes.
8. Admin UI — none.
9. Unit tests — a pure test of `closeRemainingApplications`'s fan-out/failure-counting logic (the one place M8 adds real branching), plus confirmation that no new pure predicate logic was needed anywhere else (M7's existing transition guards already cover the dedup question per Decision 6).
10. E2E tests — `tests/e2e/m8-acceptance.spec.ts` covering §16's 19 scenarios, following M3/M7's established conventions (small independent describe blocks, reusable helpers).
11. Regression — full M1-M7 acceptance suites re-run unchanged, with specific attention to M3's own notification test (18) and M7's `closeRemainingApplications` tests (22, 23), since M8 directly extends both.
12. Quality gates — unit suite, typecheck, lint, production build.
13. Final scope audit — confirm no file outside `lib/notifications/`, `types/notification.ts`, `lib/applications/actions.ts`, the one migration, the `/notifications` empty-state copy, and the new test files was touched; confirm zero `insertNotification` references anywhere in `lib/matching/` or `lib/opportunities/`.

---

## 21. Status

All decisions resolved (§12). This specification is internally consistent: no remaining reference in this document describes the opportunity-closed notification firing from `closeOpportunity`/`cancelOpportunity`; no remaining reference describes a bulk notification failure rolling back application state; no remaining reference describes the existing or new notification writes as a true database transaction (§0's correction applies throughout); no remaining reference proposes any member-facing M6 matching notification.

**Implementation has not started.** No code, migration, or test file has been created or modified while producing this document.
