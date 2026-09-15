# Stage 6 — Complete User Journeys

Written 2026-09-09, by Champion, mapping every P0 feature from [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md) into step-by-step flows. This is item 2 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s "genuinely new" list. The PRD and UX doc describe journeys in prose (PRD section 58, UX section 15); this document makes each one an explicit numbered sequence a developer can build screens against, with branches and failure paths included, not just the happy path.

Every step references the screen it belongs to, using [stage-3-ux.md](stage-3-ux.md)'s screen names where one exists.

---

## 1. New member — registration through first opportunity

```
1.  Landing page → "Create Profile"
2.  Registration form: first name, last name, phone/email, password
     ├─ Invalid/duplicate phone or email → inline error, stay on form
     └─ Valid → account created, proceed
3.  Profile onboarding, stepped (not one form):
     Step 1: Personal information
     Step 2: Profession (searchable field)
     Step 3: Experience (years, employment status)
     Step 4: Education (one or more records)
     Step 5: Skills (tag entry)
     Step 6: CV upload
          ├─ File too large / wrong type → inline error, retry
          └─ Valid → attached, proceed
     Step 7: Availability (Open / Selective / Not available)
     Step 8: Review — full profile shown back to the member
4.  "Submit for verification"
5.  Member lands on Dashboard. Status shows:
     - Membership: Pending
     - Credentials: Pending
     - Profile completion: shown as %, CV/certifications flagged if missing
6.  [Branches to Journey 4 — Church Admin verification. Member waits here.]
7.  Church Admin approves both badges (Journey 4) →
     member gets in-app notification: "Your membership has been confirmed."
     (and separately) "Your credentials have been reviewed."
8.  Member's profile is now visible in the admin directory and eligible for matching.
9.  Dashboard now shows "Opportunities for you" — populated once an admin has created
    an opportunity the member's profile matches (Journey 3/5).
10. Member opens an opportunity → sees requirements + "Your match" breakdown → Apply.
11. Application status begins at "Applied." [Continues in Journey 7.]
```

**Failure branches not to skip:**
- Member abandons onboarding partway (e.g. closes after Step 4). Profile should save as a draft and resume where they left off next login, not restart.
- Member submits for verification with an incomplete profile (e.g. no CV, per P1 vs P0 split — CV is P0, so this shouldn't be reachable; if the UI allows submission without a CV, that's a bug against this journey, not a valid path).
- Verification is rejected/needs correction — see Journey 2.

---

## 2. Existing member — correction and re-submission

```
1.  Member receives notification: "Your profile needs a correction."
2.  Dashboard shows a flagged item (e.g. "Credentials — Needs correction") with
    the admin's note visible (PRD section 21's verification history, PRD section 24's
    Notes field on the admin side).
3.  Member edits the flagged section only (not forced to redo the whole profile).
4.  Re-submits.
5.  Returns to Church Admin's verification queue as "Pending" again. [Journey 4.]
```

**Note:** the PRD doesn't currently specify whether a correction request is scoped to one field, one section, or the whole profile. This journey assumes section-level (education, or documents, or personal info) since that matches the admin review screen's per-section approve controls (PRD section 24). Flag if that assumption is wrong — it affects both the member-facing edit screen and the state machine.

---

## 3. Existing member — updating availability

```
1.  Member profile or dashboard → change availability toggle
    (Open / Selective / Not available)
2.  Change takes effect immediately — no re-verification needed,
    since availability isn't a verified claim, it's a live status.
3.  Member stops/starts appearing in "available" filtered searches and matches
    from this point forward. Past applications/shortlists are unaffected.
```

Short journey, but worth stating explicitly since it's the one profile change that should NOT trigger re-verification — everything else that touches profession/education/experience arguably should (open question, not resolved by this document, see Still Open below).

---

## 4. Church Admin — verification queue (the trust-model core)

```
1.  Admin login → Dashboard shows "Pending verification: N"
2.  Admin opens Verification queue → list of pending members,
    tabs: All / Pending / Approved / Needs correction
3.  Admin opens one member's verification review screen:
     Left: full profile as submitted
     Right: Membership [Approve], Profession/Credentials [Approve],
            Documents [View], Notes field
4.  Admin makes a decision per section:
     ├─ Approve Membership → badge becomes "Membership confirmed"
     ├─ Approve Credentials → badge becomes "Credentials reviewed"
     └─ Request correction on either → member notified (Journey 2), note attached
5.  Every approve/reject/correction action writes to the audit trail
    (who, what, when — PRD section 50, confirmed P0 in Stage 5).
6.  Once both badges are approved, member becomes visible in the
    directory and eligible for matching.
```

**This is the journey that depends on the still-open item.** Step 4's "Admin makes a decision" currently has no defined criteria behind it — see Still Open below. This journey documents the *mechanics* of verifying; it does not and cannot supply the judgment call itself.

---

## 5. Church Admin — creating an opportunity and finding matches

```
1.  Admin dashboard or Opportunities list → "Create opportunity"
2.  Guided form:
     Step 1: Opportunity type (Employment / Church opportunity / Service —
             Project and Business are P2, not offered as options in v1)
     Step 2: Title, organization, location, description
     Step 3: Requirements — profession, experience, education, skills
     Step 4: Review
     Step 5: Publish
3.  Opportunity appears in the admin's Opportunities list, status "Active,"
    and immediately becomes visible to matching members in their
    "Opportunities for you" and the public Opportunities browse screen.
4.  Admin selects "Find matching professionals" →
    system returns a ranked, filtered list of verified members
    against the opportunity's requirements (PRD section 28-29).
5.  Each candidate row shows the match breakdown (per-criterion ✓/✕,
    not just a percentage — P0, already decided).
6.  Admin reviews candidates, selects "Shortlist" on chosen ones.
7.  Shortlisted members are notified: "You've been shortlisted for [opportunity]."
    [Continues in Journey 7 from the member's side.]
```

**Note on step 3:** the PRD doesn't specify whether a new opportunity is visible to members instantly on publish or only after some admin double-check. Assumed instant per "Publish" being the final step of the creation flow. Flag if a review step is wanted before an opportunity goes live.

---

## 6. Church Admin — searching the directory directly

```
1.  Admin → Professionals (directory)
2.  Search by name/profession/skill, and/or apply filters
    (profession, location, experience, availability, verification)
3.  Results list/table, each row showing verification badges and availability
4.  Admin opens a professional's full profile
5.  Admin can: shortlist directly against an existing opportunity,
    or note them for a future one (no formal "save for later" feature — P2,
    not in this journey's scope; admin would need to remember or
    create the opportunity first)
```

This is the manual-search path, distinct from Journey 5's "find matches for a specific opportunity." Both use the same directory/filter machinery underneath.

---

## 7. Application lifecycle — from apply to outcome

```
1.  Member applies to an opportunity (from Journey 1 step 10, or independently)
     → Application status: Applied
     → Member sees confirmation: "Application submitted."
2.  Admin reviews the application (as part of Journey 5's candidate review,
    or directly from the opportunity's application list)
     → Status: Reviewed
     → (Open question: does "Reviewed" trigger a member notification?
        Not decided — PRD section 34 lists it as a "maybe." Default assumption
        for this journey: no notification at Reviewed, only at Shortlisted
        and later, to avoid over-notifying for a routine internal step.)
3.  Admin shortlists → Status: Shortlisted
     → Member notified: "You've been shortlisted for [opportunity]."
4.  Admin schedules an interview → Status: Interview.
     → DECIDED 2026-09-10, see [stage-8-connection-model.md](stage-8-connection-model.md):
       date/time/location/instructions are entered by the admin and shared with
       the member in-platform (stored on the Application record, Stage 15).
       Any actual back-and-forth (rescheduling, questions) happens off-platform
       using the contact details already visible since Shortlisted.
     → Member notified: "You've been invited to interview for [opportunity]."
5.  Outcome recorded by admin:
     ├─ Selected → Status: Selected. Member notified.
     │             Opportunity may move to Filled/Closed if all roles are filled.
     └─ Not selected → Status: Rejected. Member sees "Not selected,"
                        no detailed reason shown (per PRD section 10's framing —
                        avoid exposing rejection detail).
6.  Outcome is recorded against the Opportunity Outcomes model (PRD section 46)
    even though the impact dashboard that reads it (P2) isn't built yet —
    the data should exist from day one so it's not backfilled later.
```

---

## 8. What is deliberately NOT a journey here

Per [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md)'s P2 list: no journey exists for an external employer self-registering, submitting a talent request, or messaging a candidate directly — Church Admins are the only ones creating opportunities and initiating contact in v1 (Stage 4 item #26, already resolved). No journey exists for multi-professional project team assembly. If a future request needs one of these mapped, that's a signal the MVP scope itself is changing, not a gap in this document.

---

## Still open — these journeys expose gaps, they don't close them

Writing the journeys out surfaced exactly where the remaining gaps bite, more precisely than the blueprint's list did:

1. **Verification criteria** (Journey 4, step 4). Still the single most consequential open item in the entire project — the mechanics of approving are fully mapped, but the judgment behind clicking "Approve" isn't defined anywhere. Needs an actual answer from whoever the Church Admins turn out to be.
2. ~~How "connect" works, concretely (Journey 7, step 4).~~ **RESOLVED 2026-09-10** — see [stage-8-connection-model.md](stage-8-connection-model.md): staged contact-info visibility unlocking at Shortlisted, interview logistics shared in-platform, other communication off-platform.
3. ~~Does editing a verified field re-trigger verification?~~ **RESOLVED 2026-09-10** — see [stage-7-state-machines.md](stage-7-state-machines.md)'s field-specific rules (profession/education → full reset, experience → lighter "review pending," contact/availability → no effect).
4. **Does "Reviewed" notify the member?** (Journey 7, step 2.) Still open — PRD section 34 leaves this as a maybe; this document defaults to "no" to avoid over-notifying, but that's a judgment call, not a decision on record.
5. **Does a new opportunity require any admin approval step before going live?** (Journey 5, step 3.) Still open. Assumed no; flag if that's wrong.

Items 2 and 3 were resolved following an external review of the full combined spec; item 1 remains the single thing most worth resolving next, since every other stage document repeats it as the top-priority open item.
