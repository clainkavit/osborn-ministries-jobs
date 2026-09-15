---
name: compliance-deferred-to-post-launch
description: legal/compliance and dispute-handling items are deliberately deferred until the system is confirmed running, not pre-launch gates
metadata:
  type: project
---

**Decision (Champion, 2026-09-09), reversing earlier guidance.** [project-brief.md](../project-brief.md) and [stage-2-prd.md](../stage-2-prd.md) originally said the employment-agency legal question and PDPA compliance (data controller, consent, deletion) had to be resolved **before** Phase 1 collected real member data. That guidance is superseded.

**Current sequencing:** build and confirm the system is running first. Only then:
- The ministry registers in the compliance/eCommerce data-protection portal.
- The employment-agency legal status question gets checked.
- Dispute/outcome handling (what happens when a placement goes wrong, either direction) gets flagged and designed — **superseded 2026-09-10, see below.**
- ~~Technical architecture (stack, hosting, secure document storage) gets brought up properly.~~ **Reversed 2026-09-09/10, see [stage-19-technical-architecture.md](../stage-19-technical-architecture.md).** An external review of the combined spec argued you can't code M1 without a stack, even a deliberately pragmatic one. Champion agreed. The stack is decided (Next.js/TypeScript, Supabase/PostgreSQL, Vercel — see Stage 19) and is no longer part of this deferral. PDPA/employment-agency compliance and the *detailed* infrastructure hardening (backups, deep monitoring, CI maturity) remain deferred.

None of these block build start, Stage 3/4/5 work, or launch in this project's current plan.

**Dispute/outcome handling — narrowed, not fully deferred anymore.** The same external review pushed for a decided opportunity-closing rule rather than leaving it open. Adopted: closing an opportunity blocks new applications but does NOT auto-reject existing ones — the admin explicitly chooses to continue selection or close all remaining applications. See [stage-7-state-machines.md](../stage-7-state-machines.md) and [stage-16-api-shape.md](../stage-16-api-shape.md) for where this was updated. The broader "what happens when a placement goes wrong" dispute question (member misconduct, employer mistreatment) is still deferred.

**Why:** stated as the explicit trade-off Champion chose when asked what else was missing before coding — prove the system works first, handle compliance and architecture once there's something real to register and secure, rather than gating build on paperwork for a system that doesn't exist yet.

**How to apply:** don't re-raise these as blockers in this project. They're on the list for a checkpoint *after* the system is confirmed running — a natural trigger is Phase 1 going live with real (non-seed) member data, at which point resurface all four items together. See [[scope-conflict-brief-vs-stage1]] for the separate, already-resolved verification-badge/warranty question, which is not part of this deferral.

**Still not deferred — needs an answer now, no owner yet:** verification *criteria* (Church Admins are confirmed as the *who*, per PRD section 19-21 and the brief's open question 3; nobody has defined length-of-membership/attendance/reference rules they'd apply). This is a workflow-design gap, not a compliance item, and isn't covered by this deferral.
