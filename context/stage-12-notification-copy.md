# Stage 12 — Notification Copy

Written 2026-09-09, by Champion. Item 13 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. [stage-2-prd.md](stage-2-prd.md) section 34 lists notification *events*; this document writes the actual copy, and — since notifications are in-app only for v1 (already decided) — skips the email-template framing Stage 4's original source used, since there's no email channel to write templates for yet.

Every notification here is triggered by a transition already defined in [stage-7-state-machines.md](stage-7-state-machines.md) or a step in [stage-6-user-journeys.md](stage-6-user-journeys.md), cross-referenced so nothing here invents a new trigger.

## Member-facing notifications

| Trigger (from Stage 6/7) | Notification copy |
|---|---|
| Membership → Confirmed (Journey 1, step 7) | "Your membership has been confirmed." |
| Credentials → Reviewed (Journey 1, step 7) | "Your professional information has been reviewed." *(Not "credentials verified" — matches the resolved badge label "Credentials reviewed" from Stage 3, so the notification and the badge use the same word)* |
| Either track → Needs Correction (Journey 2, step 1) | "Your profile needs a correction. [See what's needed →]" — links directly to the flagged section, per Journey 2 step 2's requirement that the admin's note is visible |
| New opportunity matches member's profile (implied by Journey 1, step 9 — dashboard populates once a match exists) | "A new [profession] opportunity matches your profile: [opportunity title]." |
| Application → Shortlisted (Journey 7, step 3 / Stage 8) | "You've been shortlisted for [opportunity title]." |
| Application → Interview (Journey 7, step 4 — decided per Stage 8: logistics always shared in-platform) | "You've been invited to interview for [opportunity title]. [Details →]" — links to the interview date/time/location/instructions now stored on the Application (Stage 15) |
| Application → Selected (Journey 7, step 5) | "Congratulations — you've been selected for [opportunity title]." |
| Application → Rejected (Journey 7, step 5) | "You weren't selected for [opportunity title] this time." — deliberately not "Not selected" alone (Stage 11's UI copy); the notification needs the opportunity title since a member may have several applications in flight, but keeps the same no-detailed-reason rule from PRD section 10 |
| Opportunity closes/cancels while member's application is still open (Stage 7's flagged Opportunity→Closed side effect, recommended auto-reject) | "[Opportunity title] has closed. Your application wasn't carried forward." — only fires if the recommended auto-reject behavior (Stage 7) is confirmed; if that recommendation isn't adopted, this notification doesn't exist |

**Deliberately no notification** at Application → Reviewed, per Journey 7's stated default (an internal admin step, not member-facing) — restated here so notification copy doesn't accidentally get written for a transition that was deliberately left silent.

## Admin-facing notifications

The PRD and journeys focus on member notifications; admin-side alerts are implied by the dashboard's "needs your attention" tiles (Stage 3 section 10, "12 professionals need verification") rather than push notifications. For MVP, treat the admin dashboard's live counts as the notification mechanism — no separate admin notification feed is in Stage 5's P0 scope. If that changes, the two events worth alerting on directly would be:

| Trigger | Notification copy (if built) |
|---|---|
| New application received on an active opportunity | "New application for [opportunity title]." |
| Member submits (or resubmits) for verification | "[Member name] is ready for verification review." |

Flagged as **not P0** rather than fully speccing these — Stage 5 doesn't list an admin notification feed as in-scope, so building copy for it now would be ahead of the actual feature decision.

## Style rules applied throughout

Matching the workspace-wide writing rules in the root `CLAUDE.md` and Stage 3's own tone: no em-dashes in the copy itself (used only in this document's own prose, not in any quoted notification text), active voice, name things by what the member recognizes ("shortlisted," "selected," not internal status codes), specific over vague. Every notification that has an obvious next action links to it (a flagged correction links to the correction, an interview invite links to the details) rather than leaving the member to go find it themselves.

## What this document doesn't cover

Push notification permissions/opt-in flow, and notification preferences (can a member mute certain types) — neither appears in Stage 5's P0 or P1 lists, so no copy is needed for settings that don't exist yet.
