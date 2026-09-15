---
name: m1-schema-verification-fields-corrected
description: the M1 implementation spec's members table had a schema conflict with the decided verification model, corrected before filing
metadata:
  type: project
---

[stage-21-m1-implementation-spec.md](../stage-21-m1-implementation-spec.md) was received with a `members.profile_status` column using five values that conflated profile-completeness with verification status (`REGISTERED, PROFILE_COMPLETE, PENDING_VERIFICATION, VERIFIED, NEEDS_CORRECTION`).

**Why this was wrong:** [stage-7-state-machines.md](../stage-7-state-machines.md) and [stage-15-data-model.md](../stage-15-data-model.md) already decided membership and credentials are two **independent** tracks — a member can be `membership_status = Confirmed` while `credentials_status = Pending` simultaneously, and [stage-13-acceptance-criteria.md](../stage-13-acceptance-criteria.md) has a scenario testing exactly that combination. A single combined column can't represent it.

**How to apply:** the migration SQL in Stage 21 was corrected to three separate fields (`profile_status`, `membership_status`, `credentials_status`) before filing, with the fix flagged inline. If any future implementation document (Stage 22+) proposes a `members`/profile table, check it against this three-field split before treating it as correct — this is the second time verification-state modeling has needed a check (see also [[scope-conflict-brief-vs-stage1]] for the badge-copy correction), so it's worth double-checking specifically, not assuming later drafts got it right by default.
