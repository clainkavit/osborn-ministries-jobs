# Osborn Ministries Jobs Platform

A recruitment platform for Pastor Tony Osborn Ministries: a searchable pool of congregation members' professional profiles, so that employers who trust the ministry's character formation can hire from it.

Announced from the pulpit at a Sunday service (transcript excerpt at 1:57:16, see [source-transcript.md](source-transcript.md)). Scoping stage. Nothing built, no platform chosen, no data collected.

**Status (2026-09-09): superseded in scope by [stage-2-prd.md](stage-2-prd.md).** The pastor confirmed the full network vision, not this document's fast three-role slice as an end state — that slice was the proof-of-concept case that started this project, and is separately confirmed filled/handled. This document stays as the origin record and still holds the reasoning behind two resolved decisions (see Open questions) plus the items still genuinely open. For current product scope, read the PRD.

## Why this exists

Not a strategy-deck idea. It came from a specific inbound request.

A businessman told the pastor he had been following the ministry for 70 days. He opened a new company in August and needs three professions: **drivers, managers, and HRs**. His reason for asking the church rather than the open market, in his own words: *"he doesn't want watu watoke sehemu yoyote... the way you pastoring your people I want to test them."* He is buying character, not skills.

The pastor's response was to commit publicly to building an application: *"Mfano this month tutalaunch a special application."*

So there are two obligations running at once, and they have different clocks:
- **A named customer with three open roles**, who exists now and will hire from somewhere else if this takes months.
- **A congregation that heard a launch promised this month**, and will read silence as the idea dying.

Neither requires a finished platform. Both require something visible and real, soon.

## What it is

A pool of professional profiles drawn from the congregation. Per the transcript: what each person studied, their profession, age, *"zile details zote zinazoulizwa kwenye CV."* Employers who approach the ministry are matched against that pool.

The differentiator is not the software. A job board is a solved problem and a free one. The differentiator is that **members of this congregation are known**, and employers want that. Everything worth building here serves that, and every design decision should be checked against it.

## What it is not

- **Not a public job board.** The pool is congregation members, not open applicants.
- **Not a recruitment agency.** No fees, no commission, no placement contracts. See Decisions.
- **Not an inducement to join the church.** The pastor guarded this explicitly from the pulpit: *"it doesn't mean watu waje kanisani kutafuta ajira."* If people start attending in order to get listed, the ministry's endorsement becomes worthless, which destroys the only thing employers are actually paying attention to. Any membership-eligibility rule must be designed against this failure, not around it.
- **Not connected to Osborn Pay.** Different project, different folder, shares only a name. The "CEO" in the transcript is the ministry's CEO, not Osborn Pay's operating CEO.

## Decisions made

**Introduction only, no warranty.** (Champion, 2026-09-09.) The platform introduces members to employers. It does not guarantee conduct, competence, or honesty. Employers do their own vetting, interviewing, reference checks, and hiring. The ministry carries no liability for what a placed member does.

**Build the real application.** (Champion, 2026-09-09.) Not a form-and-spreadsheet stopgap as the end state. The platform gets built properly. Intake can still open before the build finishes, see Approach.

## Open questions

Status as of 2026-09-09. See [stage-2-prd.md](stage-2-prd.md)'s closing section for the fullest current statement, this list is kept in sync with it.

**1. RESOLVED — the verbal guarantee vs. the platform's position.** Asked directly by the employer whether the members would let him down (*"una uhakika hawatazingua"*), the pastor answered *"mimi dhamana yangu ni kwamba wako kanisani"* — my assurance is that they are in church, a personal guarantee of conduct given verbally to one businessman. Resolved by the PRD's verification model (church confirms membership/credentials are accurate) plus a copy requirement that verification badges must not imply a conduct guarantee. The pastor's verbal assurance was a personal, one-off statement to that businessman, not something the platform itself now claims.

**2. Is this legally an employment agency? DEFERRED, not resolved.** Tanzania regulates private employment agencies. Whether a church running a members-only jobs pool falls inside that regime, and whether it matters that no money changes hands, needs a qualified opinion. **Decision: the ministry will register in the compliance/eCommerce portal, but only after the system is confirmed running and works, not before.** Revisit then, not before build.

**3. Who decides eligibility? PARTIALLY RESOLVED.** The *who* is answered: **Church Admins.** The *on what basis* is not — the transcript's *"provided we know you and we sure you devote yourself to the house of God"* is still a pastoral judgment, not defined criteria. Church Admins need an actual standard (length of membership, attendance record, a reference) before the verification screen means anything in practice. This is the one open item with no deferred-to-later cover, it blocks the admin workflow being real rather than nominal.

**4. What happens to a placement that goes wrong? DEFERRED.** Both directions: a member dismissed for cause, and an employer who mistreats or underpays a member. **Decision: flag and design this once the system is confirmed running, not before.**

**5. RESOLVED — build scope.** Originally framed as "does the pastor want the fast slice or the full platform." He confirmed the full network vision; [stage-2-prd.md](stage-2-prd.md) is the approved direction. The three named roles from the original ask (drivers, managers, HRs) are separately confirmed filled/handled — that was the proof-of-concept case, not the ongoing scope.

**6. Data protection. DEFERRED, same as item 2** — folded into the same post-launch compliance registration decision. Who is the data controller, what members are told at collection, how a member gets deleted: all revisited once the system is running, not before.

**Also answered along the way:** notifications are in-app only, "the app sends the notification" (no SMS/WhatsApp channel for v1); day-to-day platform operation (verification queue, opportunity creation, matching) is run by Church Admins.

## Related

- [source-transcript.md](source-transcript.md): the pulpit announcement, verbatim, with the load-bearing points marked.
- [stage-1-project-definition.md](stage-1-project-definition.md): the "Church Professional & Opportunity Network" concept. Confirmed as the approved scope over this brief's original fast-slice framing.
- [stage-2-prd.md](stage-2-prd.md): **the current product scope.** Read this for what's being built. Its closing section restates what's resolved and what's still open.
- [memory.md](memory.md): facts discovered while working.
- `../osborn-pay/`: unrelated fintech project for the same principal. Do not conflate.
- `../book-project/04_Style_Guides/PastorTonyOsborn_style_guide.md`: the pastor's written voice, if this project ever produces member- or employer-facing copy.
