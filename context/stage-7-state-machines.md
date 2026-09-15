# Stage 7 — State Machines

Written 2026-09-09, by Champion. Item 4 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Formalizes the informal progressions already used in [stage-2-prd.md](stage-2-prd.md) and [stage-6-user-journeys.md](stage-6-user-journeys.md) into explicit states, transitions, and triggers for the three entities whose lifecycle actually matters to the product: Member, Opportunity, Application. (Verification is treated as two sub-states on Member, not a separate machine, since it's not independently addressable — a verification can't exist without a member.)

Every transition names its trigger (who/what causes it) and its side effect (what else happens). Where PRD/journey documents left something unstated, that's called out rather than invented.

---

## 1. Member

Two parallel tracks: **profile completeness** (member-driven) and **verification** (admin-driven, two independent sub-states). A member's overall standing is the combination of both, not one flat status.

### Profile completeness track

```
Registered
    │  (member completes required onboarding fields — P0 fields per Stage 5)
    ▼
Profile Complete
    │  (member edits a required field afterward)
    ▼
Profile Complete (unchanged state, just updated — editing doesn't revert this)
```

There is no "Profile Incomplete" state distinct from "Registered" — a member is either mid-onboarding (Registered, profile still being built) or done (Profile Complete). This collapses the PRD's implied "Registered → Incomplete → Complete" into two states because a third state added nothing actionable: the UI already shows a completion percentage (Stage 5, P1) for granularity, the state machine doesn't need to duplicate it.

**Trigger for Registered → Profile Complete:** all P0 profile fields present (personal info, profession, education, experience, skills, CV, availability — per Stage 5's P0 list) AND member selects "Submit for verification" (Journey 1, step 4). Submission is the trigger, not field-completeness alone — a member could theoretically fill every field and never submit; they stay in Registered until they do.

### Verification track (two independent sub-states)

**Membership verification:**
```
Not submitted → Pending → Confirmed
                   │
                   └──────→ Needs Correction ──(member edits + resubmits)──→ Pending
```

**Credentials verification:**
```
Not submitted → Pending → Reviewed
                   │
                   └──────→ Needs Correction ──(member edits + resubmits)──→ Pending
```

- **Trigger Not submitted → Pending (both tracks):** member reaches Profile Complete and submits (Journey 1, step 4). Both tracks enter Pending together, since submission is one action, but they are approved/rejected independently by the Church Admin (Journey 4) — a member can be Membership: Confirmed while Credentials is still Pending.
- **Trigger Pending → Confirmed/Reviewed:** Church Admin approves that section (Journey 4, step 4). Side effect: audit log entry written (who, what, when); member notified in-app.
- **Trigger Pending → Needs Correction:** Church Admin rejects with a note (Journey 4, step 4). Side effect: audit log entry; member notified with the note attached (Journey 2).
- **Trigger Needs Correction → Pending:** member edits the flagged section and resubmits (Journey 2, step 3-4).

**Discoverability rule:** a member is visible in the admin directory and eligible for matching only when **both** tracks reach Confirmed/Reviewed. Being Membership: Confirmed alone does not make a profile matchable — the PRD's matching logic (section 29) weights Verification "Very High," and Stage 5 treats both badges as P0, so both should gate visibility together, not separately. **This is a decision this document is making explicitly, since neither the PRD nor the journeys stated it** — flag if partial visibility (e.g. membership-confirmed-only members showing with a "credentials pending" note) is actually wanted instead.

### Suspension / inactivity (edge states, not yet triggered by any journey)

```
[Any verified state] ──(admin action)──→ Suspended ──(admin action)──→ [restored to prior state]
[Any state] ──(member requests deletion, OR long inactivity — no threshold defined)──→ Inactive/Removed
```

These exist in the PRD's vocabulary (section 20's "Rejected/Needs Correction," Stage 4 item 36's account-lifecycle questions) but have no defined trigger conditions yet. **Open:** what inactivity threshold, if any, moves a member toward Inactive; who can Suspend and on what grounds. Not blocking for MVP build (no journey currently produces these transitions), but the schema should have room for a Suspended/Inactive status even before the workflow around it is decided, so it isn't a breaking schema change later.

### Re-verification on edit — DECIDED 2026-09-10

Stage 6 flagged this as unresolved: if a Confirmed/Reviewed member edits a verified field (profession, education, experience), does the badge revert to Pending? **Decided, adopting Option B from below, following an external review's recommendation of exactly this field-level split:**

- **Change phone number, profile photo, bio, availability → no reverification.** These don't affect what either badge is attesting to.
- **Change profession → Credentials reverts to Pending.** Reverification required.
- **Change education → Credentials reverts to Pending if it affects stated credentials** (e.g. adding/editing a qualification); a typo fix to an already-reviewed institution name is a judgment call for implementation, not a new rule.
- **Change experience → Credentials marked "Review pending"** rather than a full Pending reset — experience updates are additive and lower-stakes than a profession/education change, so this uses a lighter-weight review-pending marker rather than pulling the member fully out of the verified directory the way a Pending reset would (per the Discoverability rule above, both tracks must be Confirmed/Reviewed to appear in the directory — a full Pending reset here would remove an otherwise-legitimate member from search results over a resume update, which is disproportionate).
- **Membership track is unaffected by any profile edit** — membership is about church attendance, not professional claims, so nothing on the professional side should touch it.

This protects the meaning of the verification badges without making every small edit a friction point.

---

## 2. Opportunity

```
Draft
    │  (admin completes creation form and selects "Publish" — Journey 5, step 2 Step 5)
    ▼
Published (= "Active" in Stage 3/5's UI language — same state, two names in different docs, use "Published" as the canonical state name, "Active" as the display label)
    │  (admin closes, or a defined "roles filled" condition is met — not yet defined, see below)
    ▼
Closed
    │  (admin marks final outcome — see PRD section 46 Opportunity Outcomes)
    ▼
Completed
```

Side branches:
```
Published ──(admin cancels)──→ Cancelled
Published ──(no expiry mechanism decided — see below)──→ Expired
Published ──(all requested headcount reached — e.g. all 3 driver roles filled)──→ Filled ──→ Closed
```

- **Trigger Draft → Published:** admin completes the 5-step creation flow (Journey 5) and selects Publish. Per Journey 5's flagged assumption, this is instant — no separate admin approval gate before an opportunity goes live. **Unresolved from Journey 5**, restated here since it's this state machine's first transition.
- **Trigger Published → Closed: DECIDED 2026-09-10, reversing this document's earlier recommendation.** The earlier draft recommended auto-rejecting every open application when an opportunity closes. An external review argued against that — "closed for new applications" doesn't necessarily mean recruitment has stopped, so blanket auto-rejection could wrongly close out candidates still genuinely in play. **Adopted instead:**
  ```
  Opportunity closes
         ↓
  No further applications allowed (Apply button disabled/hidden — Stage 17, Opportunity Detail)
         ↓
  Existing applications (Applied/Reviewed/Shortlisted/Interview) remain visible and untouched
         ↓
  Admin explicitly chooses, per application or in bulk:
       Continue selection (leave as-is, keep working the pipeline)
           OR
       Close remaining applications (bulk-transition to Rejected, with the system reason "Opportunity closed")
  ```
  Closing an Opportunity only ever stops *new* applications automatically. What happens to applications already in flight is always an admin decision, never an automatic side effect.
- **Trigger Published → Filled:** the opportunity's requested headcount (PRD section 27's "Number of people required") is reached via Selected applications. Not yet wired into any journey — Journey 7 records individual Selected outcomes but doesn't check them against the opportunity's headcount. This is a real gap: without it, a "3 drivers" opportunity has no mechanism to know it's done.
- **Trigger Published → Expired:** no expiry mechanism exists anywhere in the PRD or journeys (no "closing date" field is listed among opportunity creation fields, PRD section 27). Either add an optional expiry date at creation, or drop "Expired" from the model entirely and rely on manual Close. **Recommend dropping it for MVP** — manual close covers the same need with one fewer moving part, and nothing in Stage 5's P0 list requires automatic expiry.
- **Trigger Published → Cancelled:** admin action, distinct from Closed — Cancelled implies the opportunity never completed its purpose (e.g. the employer withdrew), Closed/Completed implies it ran its course. Same open question as Closed applies to Cancelled's effect on live applications.

---

## 3. Application

```
Applied
    │  (admin opens/reviews the application — Journey 7, step 2)
    ▼
Reviewed
    │  (admin shortlists — Journey 7, step 3)
    ▼
Shortlisted
    │  (admin schedules — Journey 7, step 4)
    ▼
Interview
    │  (admin records outcome — Journey 7, step 5)
    ▼
Selected ──or──▶ Rejected
```

Side branch:
```
[Any state before Selected] ──(member withdraws)──→ Withdrawn
[Any state] ──(opportunity is Closed/Cancelled, per the Opportunity machine's open item above)──→ Rejected (system-generated)
```

- **Every forward transition is admin-triggered**, except Applied itself (member-triggered) and Withdrawn (member-triggered). This matches Journey 7 exactly; restated here as the formal machine.
- **Notification side effects**, per Journey 7's stated (not fully decided) defaults:
  - Applied → no special notification beyond the immediate "Application submitted" confirmation.
  - Reviewed → **no notification**, per Journey 7's default assumption (flagged there as a judgment call, not a decision).
  - Shortlisted → notified.
  - Interview → notified if admin shares details in-platform (depends on the still-unresolved "connect" mechanism, see Stage 8).
  - Selected → notified.
  - Rejected → notified with "Not selected," no detailed reason (PRD section 10's framing, carried into Journey 7 step 5).
- **Withdrawn** is a state this document adds that isn't explicit in the PRD or journeys, but is an obvious real-world need (a member gets a job elsewhere, or changes their mind) and costs nothing to include now. Recommend allowing withdrawal from Applied, Reviewed, or Shortlisted, not after Interview (at that point, contact treat as a Rejected outcome with an internal note instead, since an interview implies real coordination already happened).

---

## Summary of decisions this document makes vs. flags

**Decided (modeling choices, safe to build against):**
- Member profile-completeness collapses to two states (Registered, Profile Complete), not three.
- "Published" is the canonical Opportunity state name; "Active" is display-only.
- Withdrawn is added as an Application state.
- Expired is recommended dropped from Opportunity for MVP (no mechanism exists to trigger it).

**Decided (product decisions, adopted 2026-09-10 from an external spec review — see [COMBINED-SPEC.md](../../COMBINED-SPEC.md)'s review thread):**
1. Both-badges-required gates directory visibility — confirmed, no partial-visibility caveat.
2. Editing a verified field: field-specific rules, not a blanket revert — see "Re-verification on edit" above.
3. Opportunity closing does NOT auto-reject open applications — admin explicitly chooses per-application or bulk. Reverses this document's original auto-reject recommendation.

**Still genuinely open — no document resolves these, only Champion or Church Admins can:**
4. Does an opportunity auto-transition to Filled when headcount is reached, and is headcount even tracked against Selected count anywhere yet? (Opportunity track) — not raised or resolved by the external review, still open.
5. Suspension/inactivity thresholds — not blocking, but the schema should reserve room for these states.
6. Verification *criteria* (Church Admins are the who, not the what/how) — the single most-repeated open item across every stage, still unresolved.

None of the remaining items block Stage 8-19 from proceeding — each uses a stated default where a real decision is still pending.
