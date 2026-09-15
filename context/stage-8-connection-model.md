# Stage 8 — The Connection Model

Written 2026-09-09, by Champion. Item 5 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Resolves what actually happens when a Church Admin clicks "Contact" or "Shortlist" on a candidate — left as an open question in [stage-6-user-journeys.md](stage-6-user-journeys.md) Journey 7 and [stage-7-state-machines.md](stage-7-state-machines.md)'s Application track.

## The four options, as Stage 4 framed them

**A.** Reveal the member's phone number directly to the admin.
**B.** Notify the member: "A church administrator is interested in connecting with you."
**C.** Create a formal connection request the member accepts or declines.
**D.** Admin contacts the member through an in-platform channel.

## Decision: B, escalating to controlled contact-info release at Shortlist

Not a single mechanism across the whole application lifecycle — the right level of contact changes as an application moves through its states (Stage 7's Application machine), so this is a staged model, not a single answer.

```
Applied / Reviewed
    → No contact exchange. Admin sees the profile, not private contact details.

Shortlisted
    → Member is notified (Option B): "You've been shortlisted for [opportunity]."
    → Admin's view of the candidate now surfaces phone/email (Stage 2 PRD section 38
      already marks these "Controlled" for employers — this is that control point,
      triggered by Shortlisted specifically, not by Applied).

Interview — DECIDED 2026-09-10 (was open, see prior note below)
    → Interview date, time, location/meeting link, and instructions are entered
      by the admin and shared WITH the member in-platform (part of the Interview
      state's own data, not free-text messaging — Stage 15's Application entity
      gains an interview_details field, not a new Notification/message type).
    → Actual private, back-and-forth communication (rescheduling, questions,
      anything conversational) happens outside the platform using the contact
      details already visible since Shortlisted — call, SMS, WhatsApp, whatever
      the admin already uses. No in-platform messaging is being built (Stage 5,
      P2 — "Messaging beyond notifications" stays out of scope).
    → This gives the platform enough control to keep interview logistics visible
      and on-record, without building a messaging system to do it.

Selected / Rejected
    → Outcome recorded (Journey 7, step 5). No further access change.
```

## Why this, not the other three options as a single answer

**Not A alone (reveal on any admin interest).** Exposing contact info at Applied/Reviewed means every applicant's private details are visible before any real vetting decision has been made — the PRD's own privacy stance (section 38: phone/email are "Controlled," CV is "Controlled") exists specifically to prevent this. Revealing contact info only at Shortlisted is the same mechanism as Option A, just gated to the point where the admin has actually decided this candidate matters.

**Not C (formal accept/decline request).** A separate request-and-response step adds a real workflow the PRD, UX doc, and journeys never described, and Stage 5 didn't budget for it (no "connection requests" screen exists anywhere in the 42-screen inventory). It also duplicates what Shortlisting already communicates — being shortlisted already is the signal of interest; asking the member to additionally accept a "connection request" before the admin can even see their phone number adds a step without a clear benefit over just notifying them (Option B) and moving forward.

**Not D as a built feature.** In-platform messaging is already P2 (Stage 5's non-goals list, matching PRD section 43's "Communication — future module"). Building a dedicated contact channel now would contradict a scope decision already made. "D" in spirit still happens, just through whatever channel the admin already uses once contact info is released, not through new platform infrastructure.

## What this means concretely for the screens already designed

- The admin's **Find matches / candidate row** (Stage 3, "Matching screen") shows profile and match data, not phone/email, before Shortlist — no change needed, Stage 3's mockup already doesn't show contact details on that screen.
- The admin's **Shortlist** screen and the **admin professional profile view** should reveal phone/email once that candidate is shortlisted for at least one active opportunity. This is a small addition to Stage 3's existing "Admin professional profile" section — worth noting there if Stage 3 gets revised, not required for this document alone.
- No new screen is needed. This decision changes *when data is visible*, not what screens exist.

## Resolved 2026-09-10 — no longer open

Whether the interview step (Journey 7, step 4) shares interview date/time/location back to the member in-platform or purely off-platform was left open by this document's first draft. An external review of the full spec recommended splitting it: logistics (date/time/location/instructions) in-platform, actual private communication off-platform. Adopted — see the Interview row in the staged model above. This keeps the platform's involvement bounded to structured data, not conversation, consistent with messaging staying P2.
