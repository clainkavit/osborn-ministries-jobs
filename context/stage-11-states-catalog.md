# Stage 11 — Empty, Loading & Error States Catalog

Written 2026-09-09, by Champion. Item 12 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Consolidates [stage-3-ux.md](stage-3-ux.md) section 12's existing empty-state guidance with the fuller list Stage 4 surfaced (failed login, expired session, failed upload, etc.), so there's one list to check against when building any screen, instead of two partial ones.

Every state below follows Stage 3's existing tone principle: specific, never blank, tells the person what's true and often what to do next — not a bare "Error" or "No data."

## Empty states

| Screen/context | Copy |
|---|---|
| Opportunities list, no matches for member | "No opportunities yet. There aren't any opportunities matching your profile right now. Keep your professional information and availability up to date so you're ready when the right opportunity appears." *(Stage 3 section 12, verbatim — already decided)* |
| My Applications, none yet | "You haven't applied to any opportunities yet. Browse opportunities to find one that fits." |
| Admin: directory search, no results | "No professionals match your search. Try a broader profession or clear a filter." |
| Admin: verification queue, nothing pending | "You're all caught up. No profiles are waiting for review." |
| Admin: opportunity's candidate list, zero matches found | "No matching professionals right now. This can happen with a narrow requirement — consider whether experience or location can be relaxed." *(Distinguish this from a search yielding zero — it's a real signal worth surfacing, not just an empty list)* |
| Notifications, none | "You're all caught up." |
| Member profile, missing a P1 section (certifications) | Not a blank section — show the existing Stage 3 profile-completion pattern ("○ Add your CV") rather than an empty heading with nothing under it. |

## Loading states

Per [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md) item 44's framing (loading/success/error/empty for every interaction). Named, not generic spinners, wherever the wait is likely to be noticeable:

| Action | Copy |
|---|---|
| Finding professionals (Journey 5, step 4) | "Finding professionals…" |
| Saving profile | "Saving…" |
| Uploading CV/document | "Uploading…" |
| Submitting for verification | "Submitting…" |
| Verifying (admin approving) | "Saving verification…" |
| Loading directory / search results | Skeleton rows, no copy needed — a directory table loading is expected and near-instant at MVP scale (a few thousand rows, per Stage 3's mockup numbers) |

## Error states

Organized by where they surface, since the same underlying failure (e.g. network error) needs different copy depending on what the person was doing.

### Authentication

| Situation | Copy |
|---|---|
| Wrong password | "That password doesn't match. Try again or reset your password." |
| Unknown phone/email at login | "We couldn't find an account with that phone or email." |
| Duplicate registration (phone/email already used) | "An account already exists with that phone or email. Sign in instead?" |
| Session expired | "Your session has expired. Sign in again to continue." — redirect to login, preserve where they were headed if practical |

### Profile & documents

| Situation | Copy |
|---|---|
| CV too large | "That file is too large. Documents must be under 10 MB." *(size limit per Stage 4 item 22's example — confirm against whatever the eventual storage choice supports)* |
| Invalid file type | "That file type isn't supported. Upload a PDF, DOC, or DOCX." |
| Upload failed (network) | "Upload failed. Check your connection and try again." |
| Required field missing on submit | Inline, at the field: "Add your [profession/education/etc.] before continuing." — never a generic top-of-form "please fix errors" |

### Opportunities & applications

| Situation | Copy |
|---|---|
| Applying to a closed/expired opportunity | "This opportunity is no longer accepting applications." — button should already be disabled/hidden per the Opportunity state machine (Stage 7); this is the fallback if someone reaches it via a stale link |
| Duplicate application | "You've already applied to this opportunity." — show their existing application status instead of letting them apply twice |
| Opportunity requires verification, member isn't verified yet | "Complete your verification to apply for opportunities." — link to their pending verification status, not a dead end |

### Admin actions

| Situation | Copy |
|---|---|
| Verifying with no notes on a "Needs correction" decision | Soft warning, not a hard block: "Add a note so the member knows what to fix?" — a correction with no explanation defeats Journey 2's purpose |
| Bulk/network failure during any admin save | "Something went wrong saving this. Your changes weren't saved — try again." — never silently lose an admin's review work |
| Account suspended, admin attempts an action on it | "This member's account is suspended." *(Ties to Stage 7's flagged-but-undefined Suspended state — copy exists even though the workflow around triggering suspension is still open)* |

### System-wide

| Situation | Copy |
|---|---|
| General network failure | "Connection lost. Check your internet and try again." |
| Unauthorized access attempt (wrong role for a screen) | Redirect quietly to the correct dashboard, no error copy needed — this is a routing/permissions bug if it happens, not a user-facing situation to explain |

## What's still open, not resolved by this document

- The exact file-size limit (10 MB used above as a placeholder from Stage 4's own example) is a technical-architecture detail, deferred along with hosting/storage per [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md) — confirm once storage is chosen, this list's number may need to change.
- Whether a "Needs correction" without a note should be a hard block or a soft warning (this document recommends soft) is a judgment call, not fully decided.
