# Church Professional & Opportunity Network
## Complete Project Specification — Pastor Tony Osborn Ministries

Assembled 2026-09-09, updated 2026-09-10, from the project's full working document set: the original transcript, the origin brief, and 21 numbered stages running from project definition through an actual M1 coding blueprint. This is the complete record — origin, product definition, PRD, UX design, the pre-development blueprint, MVP scope, user journeys, state machines, matching algorithm, data model, API shape, screen specs, build milestones, technical architecture (stack decision, then physical schema/repo/deployment detail), and the M1 implementation spec itself — kept in one file for handoff. **Product, UX, and technical architecture are complete, down to migration SQL and acceptance tests. This spec is ready to code from.**

**How to read this document.** It is chronological, not by importance — each section was written after and builds on the ones before it, and later sections sometimes revise or resolve something an earlier section left open. Where that happens, the later section says so explicitly, usually flagged as "DECIDED" with a date. If a stage's own reasoning is what you need, read it in order; if you need "what's actually being built," the later stages (5 onward) are the current, load-bearing spec — sections 1-4 are the reasoning and design history behind it.

**This document was reviewed twice already.** First (2026-09-09/10) by an external reader whose feedback resolved five open product decisions and reversed the technical-architecture deferral, producing Stage 19's stack decision and Stage 20's physical architecture. Then (2026-09-10) Stage 20 was carried into an actual M1 coding spec (Stage 21) — which surfaced and corrected one real schema conflict: the received M1 migration used a single `profile_status` column that conflated membership and credentials verification, which Stage 7/15 had already decided must be two independent fields. Corrected before filing, flagged inline in Stage 21. Every place a decision changed or was corrected is marked "DECIDED" or "CORRECTED" with a date, so a later reader can tell what's freshly settled from what was always solid.

## Contents

| # | Document | Covers |
|---|---|---|
| — | Source transcript | The pulpit announcement this whole project originates from, kept verbatim |
| — | Origin brief | The first scoping pass; superseded in scope by the PRD but holds early reasoning and the open-questions log |
| 1 | Project Definition | The full "Church Professional & Opportunity Network" concept |
| 2 | PRD | Functional requirements, user roles, data model (conceptual), MVP scope, roadmap |
| 3 | UX Design | Visual direction, design system, information architecture, screen-by-screen UX |
| 4 | Pre-Development Blueprint | Sorts a 54-item external checklist into answered / deferred / genuinely new |
| 5 | MVP Feature Freeze | Every feature classified P0 / P1 / P2 |
| 6 | User Journeys | Every P0 flow, step by step, with failure branches |
| 7 | State Machines | Member, Opportunity, and Application lifecycles, formalized |
| 8 | Connection Model | How "contact"/"shortlist" actually works — staged visibility, decided |
| 9 | Matching Algorithm | The actual weighted formula behind match scoring |
| 10 | Taxonomy | Profession/skill/industry categories |
| 11 | States Catalog | Every empty, loading, and error state, with copy |
| 12 | Notification Copy | Every in-app notification, tied to its exact trigger |
| 13 | Acceptance Criteria | Given/When/Then scenarios covering the P0 loop |
| 14 | Seed Data | Dev/QA data plan and the real launch cold-start plan |
| 15 | Data Model | Logical entity/field/relationship model (stack-independent) |
| 16 | API Shape | Every endpoint, grouped by entity |
| 17 | Screen Specs | Every P0 screen — inputs, actions, permissions, states, API, responsive behavior |
| 18 | Development Milestones | M1–M10, each a demoable vertical slice |
| 19 | Technical Architecture | The chosen stack: Next.js/TypeScript, Supabase/PostgreSQL, Vercel — decided, not deferred |
| 20 | Technical Architecture v1 | Physical database schema, repo/route structure, RLS, environments, migrations, testing, deployment |
| 21 | M1 Implementation Spec | The actual coding blueprint: init commands, dependencies, migration SQL, RLS policies, screens, file structure, acceptance tests — start here to build |

**Resolved since the first version of this document (2026-09-10):**
- **Technology stack** — was deferred until post-launch, now decided (Stage 19), elaborated into a full physical architecture (Stage 20), and turned into a coding blueprint (Stage 21).
- **Church/branch architecture** — confirmed deliberate: branches within this ministry, not a multi-church SaaS platform (PRD closing section).
- **Reverification on edit** — field-specific rules adopted, not a blanket policy (Stage 7).
- **Opportunity-closing behavior** — admin explicitly chooses what happens to open applications; no auto-rejection (Stage 7, reversing that stage's own earlier recommendation).
- **Interview/contact mechanism** — logistics shared in-platform, other communication off-platform (Stage 8).
- **M1 migration schema** — corrected to match the decided three-field verification model (Stage 21).

**Still genuinely open — no document resolves these:**
- **Verification criteria.** Church Admins are confirmed as *who* verifies; *on what basis* (length of membership, attendance, a reference) is undefined. Repeated as the top-priority open item across nearly every stage — resolve this first, ideally before or during M3, but it does not block M1 from starting.
- Whether an opportunity auto-transitions to Filled when headcount is reached (Stage 7).
- Whether "Reviewed" application status notifies the member (Stage 6).
- Whether publishing a new opportunity needs an admin approval step (Stage 6).
- Suspension/inactivity thresholds for members (Stage 7).
- PDPA registration, employment-agency legal status, and detailed dispute-handling workflow — deliberately deferred until the system is confirmed running, not oversights.

Search this document for "DECIDED" and "still open" to find every instance of both.

---



<div style="page-break-before: always;"></div>

# Source: Sunday service transcript excerpt

Sunday service, Pastor Tony Osborn Ministries. Excerpt runs 1:57:16 to 2:01:53. This is the origin of the project and the only primary record of what was announced. Machine transcription of Swahili/English code-switched speech, so it carries transcription errors (e.g. "Valic", "polized", "fooded", "kurcruit", "anaso m"). Read it for intent, not for exact wording.

Kept verbatim on purpose. Do not clean it up, later documents paraphrase it and this is what they are checked against.

---

Alafu alfu watu wana miradi ya ujenzi kama ndugu zetu wa Valic makazi kila mahali and then they offer one whole project na kusema if there is anyone in the house of God ambaye hana makazi

Mfano this month tutalaunch tutalaunch a special application. Ninaamini CEO na watu wa tech team wataenda watakutana na kama unaweza kufanya hivyo vitu unaweza ukamuona CEO mkatengeneza hichi kitu kikatokea.

naiscuss na CEO tutengeneze application maalum ya recruitment watu na taaluma zao profession zao kila mtu alichosomea umri wao zile details zote zinazoulizwa kwenye CV zile zikae alafu tunakuwa na pool ya professional mbalimbali ndani ya hiyo application and that department wa kwetu yoyote provided we know you and we sure you devote yourself to the house of God na tutakuwa na namna ya kurcruit na kujua

alfu because we meet people juzi CEO uliombwa ajira za watu wangapi I had to call CEO A certain rich man contacted me akaniambia I've been following you. kwa aina ya mafundisho unayofundisha kama watu wanasikiliza kweli you are not just creating members of the church you are creating good employees good bosses because all I see is character building

and sijui sio yuko wapi sio yuko wapi walikuwa wanataka watu wangapi wale alikuwa anaulizwa hiyo watu watatu sio namba yaani profession kama tatu walikuwa wanatafuta madereva walikuwa wanatafuta managers walikuwa wanatafuta hrs yaani profession kama tatu the man is opening his new company he want people but he doesn't want watu watoke sehemu yoyote. anasema the way you pastoring your people I want to test them

hapo hapo tukazaa wazo na yule mtu wa Mungu aliyenipigia simu akasema kwa nini msiwe na pool ya profession karibia zote kwa sababu nikiliangalia kanisa ni prime age alafu the way you guys are devoted to pray. Anasema he has been following siku 70.

Akasema pastor umetuambia hii ni new beginning August. Mimi ni beginning yangu nimefungua kampuni mpya. But I need these professions. Can we get them from church? I don't know any to call CEO. Unamfahamu mtu anaso m nawajua. Namambia una uhakika hawatazingua anasema mimi dhamana yangu ni kwamba wako kanisani

now it doesn't mean watu waje kanisani kutafuta ajira I'm just showing you that kila mmoja wetu anaweza akaamua kuwa mtu anayetengeneza impact kubwa sana kwenye nchi hii kubwa mno.

This country is too politimized now. Too much politics everything. Yaani unaweza ukaongea kitu kidogo tu cha kawaida watu wakakipoliticize yaani country is already polized. Everything is political na and we don't know we are being fooded and na uwezo wetu wa kufikiri kwa sababu wote tumeangalia sasa upande mmoja. Unajua wote mkiangalia upande mmoja adui akiwa anatokea hukamwelewi. So no one is thinking outside the box. Opportunities, good things are taken away, are gone. Na niwaambie kitu kigumu zaidi?

---

## What is load-bearing in here

1. **A public launch commitment**: "Mfano this month tutalaunch a special application." Said from the pulpit, to the congregation.
2. **The product**: a recruitment application holding a pool of church professionals, with what each person studied, their profession, age, "zile details zote zinazoulizwa kwenye CV."
3. **A named first customer with dated, specific demand**: a businessman, following the ministry for 70 days, opened a new company in August, needs three professions: drivers, managers, HRs.
4. **The stated basis of trust**: "provided we know you and we sure you devote yourself to the house of God." The employer's words: "he doesn't want watu watoke sehemu yoyote... the way you pastoring your people I want to test them."
5. **A personal guarantee, given verbally**: asked "una uhakika hawatazingua," the pastor's answer was "dhamana yangu ni kwamba wako kanisani." See the open question in [project-brief.md](project-brief.md), the agreed platform position contradicts this.
6. **A stated non-goal**: "it doesn't mean watu waje kanisani kutafuta ajira." Guarding against people joining the church to get jobs.


---


<div style="page-break-before: always;"></div>

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


---


<div style="page-break-before: always;"></div>

# Stage 1 — Complete Project Definition

Received 2026-09-09, pasted in from a separate drafting session working the stage sequence: project definition → PRD → UI/UX architecture → wireframes → technical architecture → MVP plan. Kept close to as-received; only the heading level was adjusted to nest under this file's own title.

This document expands the platform's ambition well beyond [project-brief.md](project-brief.md)'s scope (drivers/managers/HRs for one named employer, launched fast). See the note at the end of this file for where the two disagree and what that means before Stage 2 gets written.

---

# Church Professional & Opportunity Network

### Working concept

A digital platform that enables a church to **discover, organize, verify, connect, and activate the professional capabilities of its members**, while creating a structured channel through which jobs, projects, services, business opportunities, and other opportunities can reach the right people.

### Core principle

> **Know the people. Know their abilities. Connect their abilities to opportunities. Create impact.**

---

## 1. The vision

The vision is to create a professional ecosystem within the church where the skills, education, experience, businesses, professions, and capabilities of church members are known and organized.

Rather than having thousands of members whose professional abilities are largely invisible to one another and to church leadership, the platform creates a structured **professional pool**.

For example, a church may have:

- 50 engineers
- 30 doctors
- 20 lawyers
- 100 teachers
- 40 accountants
- 15 architects
- 200 business owners
- 50 drivers
- 30 software developers
- 25 project managers

Today, that information may exist informally or not at all. The platform turns it into a **usable professional network**.

---

## 2. The problem

The church already possesses a significant resource: its people. But that resource is difficult to organize.

A pastor or church leader may know that "we have many professionals in this church." But when someone asks "Do you know a qualified HR manager with five years of experience?", the answer may depend on personal relationships and memory.

**Problem 1 — Professional visibility.** The church doesn't have a structured understanding of the professional capabilities within its membership.

**Problem 2 — Opportunities are disconnected.** A company may be looking for people while qualified church members are looking for work. The two sides may never meet.

**Problem 3 — Projects are fragmented.** Someone may need an entire project completed, but finding the necessary professionals can be difficult.

**Problem 4 — Talent is underutilized.** People possess skills that the wider church community may not know about.

**Problem 5 — Connections depend too much on individuals.** The pastor, CEO, department leaders, or other influential people may personally know certain professionals. The platform turns those individual relationships into a system.

---

## 3. The solution

The platform creates a centralized professional network. Every participating member can create a professional profile containing information such as profession, education, skills, experience, certifications, employment, location, CV, portfolio, and availability.

The church can then verify the person's membership and, where appropriate, professional information. This produces a **verified professional pool**, which the church can then use to respond to opportunities.

---

## 4. What kind of opportunities?

The platform should eventually support more than jobs. Four major categories:

**A. Employment.** "Company needs 3 drivers." "Company needs an HR manager." "Organization needs an accountant." "School needs teachers."

**B. Projects.** "A member needs a house constructed." Connects architect, engineer, quantity surveyor, contractor, electrician, plumber, interior designer. The goal is not for the church to execute the project, but to facilitate the connection of appropriate people.

**C. Professional services.** "Member needs a lawyer." "Business needs an accountant." "Church department needs a graphic designer." "Organization needs a software developer."

**D. Business opportunities.** "A company is looking for suppliers." "A business needs a distribution partner." "An entrepreneur is looking for a particular professional." "A company is expanding and needs a team."

---

## 5. Not a job board

This distinction should remain central throughout the project.

A traditional job board is: **Jobs → Applicants**.

This platform is: **People → Capabilities → Opportunities → Connections → Impact.**

---

## 6. The professional profile

Every member has a professional identity inside the platform. Simplified example:

> **John Michael** — Civil Engineer, Dar es Salaam, 7 years experience
> Skills: Structural Design, Project Management, AutoCAD, Construction Management
> Education: BSc Civil Engineering, University XYZ
> Certifications: professional certification...
> Availability: 🟢 Open to opportunities
> Verification: ✓ Church Verified ✓ Profession Verified

The important thing is that this becomes **structured data**, not just a PDF CV, so the platform can search and match people.

---

## 7. The professional database

The database becomes the organization's institutional knowledge about its people. Instead of "I think I know someone who does that," the church can search Profession / Experience / Location / Availability / Verification and immediately see suitable people.

---

## 8. Verification

Verification is fundamental to the concept. Two distinct questions, not to be treated as the same thing:

- **Membership verification** — is this actually a member of the church?
- **Professional verification** — is this person's claimed profession/qualification legitimate?

---

## 9. Verification levels

- **Level 0 — Registered.** The person has created an account.
- **Level 1 — Member Verified.** The church has confirmed membership.
- **Level 2 — Profession Verified.** The church has reviewed relevant professional information.
- **Level 3 — Fully Verified.** Required profile and supporting information have been reviewed.

Can later become a trust system.

---

## 10. Privacy model

Needs to be designed from the beginning. A member should not automatically expose their entire profile to everyone.

- **Member** can see: their own profile, their applications, opportunities, their verification status.
- **Church administrator** can see: professional directory, member profiles, verification information, applications, opportunity requests.
- **External organization** should initially receive only information the church chooses to share.

This prevents the platform from becoming a database anyone can scrape member information from.

---

## 11. Who uses the platform?

**User 1 — Member.** Ordinary church member. Can register, create profile, add education/experience/skills, upload CV, add certifications, set availability, browse opportunities, apply, track applications, receive notifications.

**User 2 — Church administrator.** Responsible for managing the professional network. Can review and verify members, review and verify professional profiles, search professionals, create/manage opportunities, shortlist professionals, manage applications, generate reports.

**User 3 — Organization / employer.** Initially a controlled feature, introduced after the first version. Could eventually submit a talent request, define requirements, request professionals, review approved candidates, communicate with candidates, track recruitment. The church remains in control of what information gets shared.

**User 4 — Super administrator.** Responsible for the entire platform: churches, branches, administrators, members, professional categories, industries, opportunities, permissions, system settings, analytics.

---

## 12. The core user journey

```
MEMBER → REGISTER → BUILD PROFESSIONAL PROFILE → SUBMIT FOR VERIFICATION
→ CHURCH VERIFIES → PROFESSIONAL POOL → OPPORTUNITY APPEARS → MATCH
→ SHORTLIST → CONNECT → INTERVIEW / PROJECT → OUTCOME
```

## 13. The opportunity journey

```
OPPORTUNITY → DEFINE REQUIREMENTS → SEARCH PROFESSIONAL POOL → MATCH
→ REVIEW CANDIDATES → SHORTLIST → CONTACT → SELECTION → OUTCOME
```

## 14. The project journey

```
PROJECT REQUEST → DEFINE PROJECT → REQUIRED PROFESSIONS → SEARCH PROFESSIONALS
→ BUILD PROJECT TEAM → CONNECT → PROJECT EXECUTION → COMPLETION
```

This is the area that could eventually make the platform significantly more powerful than a recruitment system.

---

## 15. Matching

Initially, matching should be simple and transparent. The platform compares opportunity requirements with member attributes, e.g.:

```
OPPORTUNITY: HR Manager, 5+ years, Dar es Salaam, Available, Bachelor's degree
↓
SEARCH: PROFESSION = HR, EXPERIENCE >= 5, LOCATION = Dar es Salaam,
        AVAILABLE = YES, EDUCATION >= Bachelor's, VERIFIED = YES
↓
MATCHES: Candidate A — 95%, Candidate B — 89%, Candidate C — 83%
```

The exact percentage can come later. For MVP, even filtered results are sufficient.

---

## 16. The platform's main modules

01. Authentication — registration / login / password / security
02. Member management — profiles / membership / status
03. Professional profiles — education / skills / experience / certifications / CV
04. Verification — membership / professional verification
05. Professional directory — search / filtering / profiles
06. Opportunities — jobs / projects / services / business opportunities
07. Matching — requirements → professionals
08. Applications — applications / shortlisting / status
09. Communication — notifications / eventually messaging
10. Projects — project teams / professionals / progress
11. Organizations — external employers / businesses
12. Analytics — people / professions / opportunities / outcomes

---

## 17. MVP vs future platform

**Version 1 — MVP.**
Member: registration, profile, education, experience, skills, CV, availability.
Admin: member management, verification, professional directory, search/filter.
Opportunities: create opportunity, search professionals, shortlist, connect.
Basic notifications.

**Version 2.** Employer accounts, applications, advanced matching, messaging, better notifications, analytics, project management.

**Version 3.** AI matching, professional services marketplace, business directory, project teams, business-to-business connections, recommendations, skill endorsements, professional networking, advanced analytics.

---

## 18. What success looks like

Not just registration count. Better metrics:

- **People**: registered professionals, percentage verified, professions represented, industries represented.
- **Opportunities**: opportunities created, jobs requested, projects created, services requested.
- **Connections**: professionals matched, candidates shortlisted, applications, connections made.
- **Impact**: jobs obtained, projects completed, businesses connected, services delivered, opportunities fulfilled. Could become one of the platform's most important metrics.

---

## 19. The bigger vision

Five years out: a network containing professionals, businesses, entrepreneurs, organizations, projects, skills, and opportunities, with the platform understanding the relationships between them. Someone opening a company and needing an HR manager, three drivers, an operations manager and an accountant; someone needing a house constructed; someone with a business needing a supplier; someone with a skill looking for an opportunity — the platform helps identify the people, professionals, businesses, or opportunities in each case.

---

## 20. The product in one sentence

> "We are building a verified professional and opportunity network that organizes the skills, professions, businesses and capabilities within the church and connects them to employment, projects, services and business opportunities."

---

## Next stage, as planned by the drafting session

Stage 2 — PRD: exact features, exact screens, functional requirements, user stories, user permissions, registration flow, profile fields, verification workflow, opportunity workflow, matching rules, application states, notifications, admin functionality, search/filter behavior, privacy rules, MVP boundaries, future features, acceptance criteria.

---

## Where this disagrees with project-brief.md

Recorded here rather than silently merged, because the two documents point at different products and that needs a decision, not a blend.

**Scope.** The brief scopes this as: fill three named roles (drivers, managers, HRs) for one named, already-waiting employer, fast, because a launch was promised from the pulpit this month. This document scopes a general-purpose, multi-church-capable professional network covering employment, construction projects, professional services, and business opportunities, with four user roles and a three-version roadmap. Even its own MVP (section 17) is bigger than the brief's whole platform.

**Verification vs. warranty.** This document's verification levels (section 9) are membership + profession verification, done by the church, surfaced to employers as a trust signal ("✓ Church Verified"). The brief's decided position is introduction only, no warranty, specifically because the pastor gave a personal guarantee from the pulpit that the brief flags as a liability to walk back, not formalize. A "Church Verified" badge on a profile is close to that guarantee in badge form. This needs to be resolved explicitly before Stage 2 writes verification into the PRD as a feature, not inherited from whichever document was read most recently.

**Multi-church framing.** Section 11's Super Administrator manages "churches, branches" plural. Nothing in the transcript or the brief suggests this is anything but a single-ministry tool. Worth confirming this is deliberate future-proofing and not scope creep nobody decided on.

None of this means the document is wrong, it may be exactly what the pastor wants once he sees the fuller vision. It means Stage 2 shouldn't get written until someone (Champion, and ideally the pastor) says explicitly which scope is being built now: the brief's fast single-employer launch, this document's full network, or the brief's launch as a deliberate first slice of this document's larger roadmap.


---


<div style="page-break-before: always;"></div>

# Stage 2 — Product Requirements Document

Received 2026-09-09, from the same drafting session as [stage-1-project-definition.md](stage-1-project-definition.md). Kept close to as-received; only heading levels adjusted to nest under this file's title.

**Status update (Champion, 2026-09-09):** the scope conflict flagged in Stage 1's closing section is resolved. The pastor has confirmed the full network vision, this PRD is the approved direction, not the brief's fast three-role slice alone. See the note at the end of this file for what that changes and what's still open.

---

# Product Requirements Document

## Church Professional & Opportunity Network

**Document:** Product Requirements Document
**Version:** 1.0
**Status:** Proposed MVP
**Product Type:** Web platform / responsive application
**Primary Users:** Church members, church administrators
**Future Users:** Employers, organizations, project owners
**Core Purpose:** Connect verified people, professional capabilities, and opportunities.

---

## 1. Executive summary

The Church Professional & Opportunity Network is a digital platform designed to identify, organize, verify, and connect the professional capabilities of members within a church community.

The platform will create a structured database of members and their professions, skills, education, qualifications, experience, certifications, businesses, services, employment status, and availability.

This professional pool can then be used to connect qualified members with employment opportunities, professional services, construction and other projects, business opportunities, church opportunities, and organizations seeking qualified personnel.

The platform's primary purpose is **not simply recruitment**. It is intended to transform an existing church community into an organized network of **people, capabilities, and opportunities**.

---

## 2. Product vision

> **To build a trusted professional ecosystem where the capabilities of people within the church can be discovered, connected to opportunities, and transformed into meaningful impact.**

---

## 3. Product mission

The platform will: discover the professional capabilities within the church; organize those capabilities into a structured database; verify members and, where appropriate, professional credentials; make qualified professionals discoverable to authorized church administrators; connect professionals with relevant opportunities; facilitate connections between people, businesses, and projects; measure the real-world impact created through those connections.

---

## 4. The problem

The church contains a significant pool of professional talent, but that talent is often fragmented and difficult to discover. A church leader may know there are engineers, lawyers, doctors, managers, drivers, entrepreneurs, developers, architects, accountants, and other professionals within the congregation, but there may be no centralized way to answer who exactly they are, what they specialize in, where they are located, how experienced they are, whether they're available, whether they're verified, or who they can be connected with. As a result, opportunities can be lost simply because the right person is unknown.

---

## 5. Product opportunity

The church already possesses the most important resource: people. The platform creates a mechanism for turning **People → Information → Capability → Connection → Opportunity → Impact**.

---

## 6. Target users

### 6.1 Church member

Goals: create a professional profile, make their skills discoverable, find relevant opportunities, maintain their professional information, control their availability, apply for opportunities.

### 6.2 Church administrator

Goals: know the professional composition of the church, verify members, verify professional information, find qualified professionals, manage opportunities, connect people with opportunities, track outcomes.

### 6.3 Organization / employer

Goals: request qualified professionals, define recruitment requirements, receive suitable candidates, review approved candidate profiles, connect with candidates. **Note:** future-facing role. MVP access should remain controlled by the church.

### 6.4 Super administrator

Goals: manage churches, branches, users, permissions, professional categories, system configuration, platform-wide activity.

---

## 7. Core product principles

**1. Trust** — people and professional information should be verifiable. **2. Privacy** — members should control how their information is exposed. **3. Simplicity** — a non-technical member should complete their profile easily. **4. Discoverability** — administrators should quickly find the right professional. **5. Opportunity** — the system should facilitate meaningful connections, not merely store CVs. **6. Impact** — the system should eventually measure what happened after connections were made.

---

## 8. MVP scope

Three primary systems: **A. Professional Registry** (who are our people?), **B. Verification** (can we trust the information?), **C. Opportunity Matching** (who can fulfill this opportunity?). Everything else should support these three functions.

---

## 9. MVP feature set — authentication

Register, log in, log out, reset password, verify email/phone where applicable. Registration should be intentionally simple; collect only what is necessary to create the account. Additional professional information is collected during profile completion.

---

## 10. Member profile — personal information

Full name, profile photo, date of birth/age, gender, phone, email, location, church, branch/congregation.

---

## 11. Professional information

Primary profession (e.g. Civil Engineer), job title (e.g. Project Engineer), industry (e.g. Construction), employment status (Employed / Self-employed / Business owner / Freelancer / Student / Unemployed / Retired / Other), years of experience.

---

## 12. Education

Multiple records: institution, qualification, field of study, start year, completion year, current/incomplete status.

---

## 13. Professional experience

Multiple records: organization, position, location, start date, end date, current position, description, responsibilities. Creates structured experience data rather than relying entirely on uploaded CVs.

---

## 14. Skills

Multiple skills (AutoCAD, Project Management, Leadership, Accounting, JavaScript, Graphic Design, Welding, Driving, etc.). Should eventually come from a controlled taxonomy so "Human Resources" and "HR" don't become separate categories.

---

## 15. Certifications

Certification name, issuing organization, issue date, expiration date, certificate/document.

---

## 16. CV / documents

CV, portfolio, professional certificates, relevant supporting documents. System should support appropriate document formats and impose reasonable file-size restrictions.

---

## 17. Availability

🟢 Open to opportunities / 🟡 Selective (interested only in suitable opportunities) / 🔴 Not available. Member can change this at any time.

---

## 18. Profile completion

Show profile progress (e.g. "Profile 80% complete") and identify missing items (add experience, add skills, add CV) to encourage useful profiles.

---

## 19. Verification

Two distinct concepts that must remain separate: **Membership verification** (this person is a member of the church) and **Professional verification** (the person's professional information has been reviewed).

**Implementation note (Champion, 2026-09-09):** "verified" here means the church confirms the *information is accurate* (membership is real, credentials were reviewed). It is not a guarantee of the person's future conduct. Those are different claims, and a badge is easy to misread as the second when the church only means the first. Copy shown to employers next to any verification badge must say what was checked, e.g. "Membership confirmed" / "Credentials reviewed", not imply an endorsement of performance or character beyond that. This is a copy/UX requirement for Stage 3, not an open scope question, see the closing note on this document.

---

## 20. Verification states

Pending → Member Verified → Profession Verified → Fully Verified, with a Rejected / Needs Correction state for information requiring clarification.

---

## 21. Verification workflow

```
Member creates profile → Submits profile → Admin receives review
→ Admin checks information → Approve / Request correction → Verified profile
```

System should maintain a verification history.

---

## 22. Professional directory

The primary administrator tool. Search, filter, view profiles, check verification status, check availability, view professional information, shortlist professionals.

---

## 23. Directory search

Supports: profession, skill, industry, location, experience (e.g. 5+ years), employment status, availability, verification. Eventually: education level.

---

## 24. Professional profile view (admin)

Example layout: name, profession, years experience, location, availability, verification badges (Member Verified / Profession Verified), education, experience summary, skills list, documents (CV, certificates).

---

## 25. Opportunities

An opportunity represents something that requires people, skills, services, or professional capabilities.

---

## 26. Opportunity types

MVP focuses on: **Employment** (a company needs employees), **Church Opportunity** (a church department needs a professional), **Service** (someone needs a professional service). Projects and business opportunities can be supported in the architecture and expanded after MVP.

---

## 27. Opportunity creation

Fields: title, type, organization, location, number of people required, minimum experience, required education, required profession, required skills, availability requirement, description.

---

## 28. Opportunity matching

Administrator selects "Find Professionals"; system searches the database against the opportunity's requirements and returns potential candidates.

---

## 29. Matching logic

Rule-based for MVP. Factors and relative importance: Profession (Very High), Required skills (High), Experience (High), Location (Medium), Availability (High), Education (Medium), Verification (Very High). Do not introduce complicated AI initially — matching should be **reliable and explainable**.

---

## 30. Candidate matching result

Example: name, role, years experience, location, availability, verification, match strength label ("Strong Match"), View Profile / Shortlist actions.

---

## 31. Shortlisting

States: Matched → Shortlisted → Contacted → Interview → Selected → Successful. Alternative outcomes: Rejected, Withdrawn, Not Available.

---

## 32. Applications

Member sees an opportunity and selects Apply. Application records: member, opportunity, date applied, status.

---

## 33. Member application dashboard

Table of Opportunity / Organization / Status (e.g. Applied, Interview, Selected).

---

## 34. Notifications

MVP: basic notifications ("Your profile has been verified", "A new opportunity matching your profession is available", "Your application has been shortlisted", "You have been selected for an interview"). Future: in-app, email, SMS, push.

---

## 35. Admin dashboard

Answers "what is happening inside our professional network?" Example metrics: Members, Verified, Professionals, Open to opportunities, Active opportunities, Applications, Successful connections.

---

## 36. Professional analytics

Professionals by category (Engineering, Healthcare, Education, Finance, Technology, Business, Legal, Construction, Transport, Creative, etc.), by location, by employment status, by availability. Helps leadership understand the professional composition of the church.

---

## 37. Privacy & access control

**Member** can access: own profile, own applications, opportunities, notifications. **Church Admin** can access: professional directory, member profiles, verification, opportunities, applications. **Organization** (future): access should be limited, not unrestricted database access.

---

## 38. Information visibility

| Information | Member | Church Admin | Approved Employer |
|---|---:|---:|---:|
| Name | ✓ | ✓ | ✓ |
| Profession | ✓ | ✓ | ✓ |
| Skills | ✓ | ✓ | ✓ |
| Experience | ✓ | ✓ | ✓ |
| Education | ✓ | ✓ | ✓ |
| Phone | Own | ✓ | Controlled |
| Email | Own | ✓ | Controlled |
| CV | Own | ✓ | Controlled |
| Verification | ✓ | ✓ | ✓ |
| Private documents | Own | Controlled | ✕ |

The exact policy should be approved by church leadership before launch.

---

## 39. Church structure

Platform should support multiple churches/branches: Platform → Church → Branch → Members/Admins.

---

## 40. Project management — future module

The pastor's housing example should influence the architecture. A future project (e.g. residential house construction) would list required professions (architect, engineer, quantity surveyor, contractor, electrician, plumber) and the system finds professionals for each role, eventually assembling a full project team. **Not part of the first MVP**, but the data architecture should not prevent it.

---

## 41. Business network — future module

Eventually, verified businesses owned/operated by members (e.g. "ABC Construction Ltd, Owner: Member X, Services: Building, Renovation, Project management"), creating Professional Network + Business Network.

---

## 42. Employer portal — future module

Organization submits a Talent Request (e.g. "Need 3 drivers"), church admin reviews it, system identifies matching professionals, organization receives approved candidates. A controlled bridge between church and external organizations.

---

## 43. Communication — future module

Later: candidate messaging, employer communication, interview scheduling, notifications, announcements. For MVP, external communication stays controlled by the administrator.

---

## 44. Data model — high level

Likely entities: User, Church, Branch, MemberProfile, Profession, Industry, Skill, Education, Experience, Certification, Document, Verification, Availability, Opportunity, OpportunityRequirement, Application, Shortlist, Notification, Organization, Project, ProjectRole. Detailed schema comes after this PRD, during technical architecture.

---

## 45. Important relationship

```
MEMBER
   ├── PROFESSION
   ├── SKILLS
   ├── EDUCATION
   ├── EXPERIENCE
   ├── CERTIFICATIONS
   └── AVAILABILITY
             ↓
        OPPORTUNITY
             ↓
          MATCH
             ↓
        APPLICATION
             ↓
          OUTCOME
```

---

## 46. Opportunity outcomes

Hired, Contract awarded, Project completed, Service delivered, Connected, Not selected, Cancelled, No outcome. Lets the church measure whether the platform is actually working.

---

## 47. Success metrics

**Network growth:** registered members, completed profiles, verified members, verified professionals, professions represented. **Opportunities:** created, jobs posted, projects initiated, services requested. **Connections:** matches, shortlists, applications, interviews, connections. **Impact:** people hired, projects completed, businesses connected, services delivered, opportunities fulfilled.

---

## 48. MVP non-goals

Do not build initially: AI recruitment, complex employer marketplace, payments, full project management, social media feed, public member profiles, public CV database, advanced messaging, complex recommendation algorithms, marketplace transactions, mobile apps immediately.

The MVP should prove the central hypothesis: **can the church successfully organize its professional community and use that network to connect qualified people with real opportunities?**

---

## 49. Security requirements

Secure authentication, password hashing, role-based permissions, secure document storage, access control, audit logs, session management, input validation, rate limiting, secure file uploads, data backup, administrative activity logging.

---

## 50. Audit trail

Important administrative actions recorded, e.g. "Admin A verified Member B's professional profile", "Admin C changed Candidate D's application status", "Admin A shared Candidate E's CV with Organization F."

---

## 51. Accessibility & UX principles

Keep forms simple — a stepped registration rather than one long form: About You → Profession → Education → Experience → Skills → CV → Review → Submit.

---

## 52. Mobile first

Even as a web application, design mobile-first. A member should complete their profile from a phone. Admin dashboard optimized for larger screens while remaining responsive.

---

## 53. Product navigation

**Member:** Dashboard, Profile, Opportunities, Applications, Notifications, Settings. **Admin:** Dashboard, Members, Professionals, Verification, Opportunities, Applications, Analytics, Settings.

---

## 54. Member dashboard concept

Answers: Who am I? (profile completion) What is my professional status? (verification + availability) What opportunities exist? (recommended opportunities) What is happening with my applications? (application status)

---

## 55. Admin dashboard concept

Answers: How many people do we have? What professions do they have? How many are verified? Who is available? What opportunities exist? Are we successfully connecting people?

---

## 56. User stories

**Member:** "As a church member, I want to create a professional profile so that my skills and experience can be discovered by authorized church administrators." / "As a member, I want to indicate my availability so that I don't receive irrelevant opportunities." / "As a member, I want to apply for opportunities that match my profession." / "As a member, I want to know whether my profile has been verified."

**Administrator:** "As a church administrator, I want to search professionals by profession and skills so that I can quickly find suitable people." / "As an administrator, I want to verify members so that the professional pool remains trustworthy." / "As an administrator, I want to create opportunities so that members can be connected to them." / "As an administrator, I want to shortlist professionals so that I can manage candidate selection."

**Future employer:** "As an organization, I want to request qualified professionals so that I can find suitable candidates through the church network."

---

## 57. Acceptance criteria — example

A member profile is complete when: required personal information exists; profession exists; at least one skill exists; education information exists; experience information exists where applicable; availability has been selected; member submits the profile.

A professional appears in the verified directory only when: membership has been verified; required professional information has been reviewed; verification status is active.

An opportunity can be published when: title exists; opportunity type exists; requirements exist; organization/requesting department exists; location exists where applicable; administrator has approved it.

---

## 58. Core MVP workflow

```
MEMBER → REGISTER → COMPLETE PROFILE → SUBMIT PROFILE
→ CHURCH ADMIN → VERIFY → PROFESSIONAL DIRECTORY → OPPORTUNITY CREATED
→ FIND MATCHES → SHORTLIST → CONTACT → APPLICATION/INTERVIEW
→ OUTCOME → IMPACT
```

---

## 59. The product's three core engines

**Engine 1 — People:** who are we? Members, professionals, businesses.
**Engine 2 — Capabilities:** what can they do? Professions, skills, education, experience, services.
**Engine 3 — Opportunities:** where can those capabilities be used? Jobs, projects, services, businesses.

```
PEOPLE → CAPABILITIES → MATCHING → OPPORTUNITIES → CONNECTIONS → IMPACT
```

This should remain the conceptual foundation of the entire product.

---

## 60. MVP definition of done

V1 is successful when this scenario works end to end: a church member registers, completes their professional profile, is verified by a church admin, appears in the professional directory; an admin creates an opportunity ("HR Manager — 5+ years — Dar es Salaam"), searches for matching professionals, the system returns appropriate verified members, the admin shortlists a candidate, the candidate is notified, applies/accepts, the recruitment process proceeds, and the administrator records the outcome. If that entire loop works reliably, the MVP is built.

---

## 61. Product roadmap

**Phase 1 — Foundation:** Professional Registry (authentication, member profiles, skills, education, experience, CV, availability).
**Phase 2 — Trust:** Verification (membership verification, professional verification, admin workflow).
**Phase 3 — Opportunity:** Opportunity Network (opportunities, search, matching, shortlisting, applications).
**Phase 4 — Connection:** External organizations (employer accounts, talent requests, controlled candidate sharing).
**Phase 5 — Projects:** Project ecosystem (project requests, required professions, project teams, project tracking).
**Phase 6 — Intelligence:** Smart matching (recommendation engine, AI-assisted matching, skills analysis, opportunity recommendations).

---

## 62. Final product definition

> **A trusted digital professional and opportunity network that enables a church to discover, organize, verify and connect the professional capabilities of its members with employment, services, projects and business opportunities.**

The product starts with knowing the people, progresses to understanding their capabilities, creates a mechanism for connecting those capabilities to opportunities, and ultimately measures the impact created through those connections.

---

## Next stage, as planned by the drafting session

Stage 3 — UI/UX design: information architecture, design system, member experience (Register → Build Profile → Verification → Dashboard → Opportunities → Application), admin experience (Admin Login → Dashboard → Professional Directory → Verification → Opportunity → Matching → Shortlisting → Outcome), responsive behavior, screen-by-screen UI specification. Stated design direction: a serious professional/recruitment-platform feel, not a typical church website — the church's identity present, but polished for the professionals and organizations using it.

**Received and filed:** [stage-3-ux.md](stage-3-ux.md). Its closing section resolves this document's badge-copy caveat (section 19 above) with exact labels: "✓ Membership confirmed" / "✓ Credentials reviewed."

---

## What this changes, and what's still open

**Resolved (Champion, 2026-09-09):** the scope conflict flagged at the end of [stage-1-project-definition.md](stage-1-project-definition.md) is closed. The pastor has confirmed the full network vision. This PRD, not the brief's fast three-role slice alone, is the approved product direction. [project-brief.md](project-brief.md)'s three named roles (drivers, managers, HRs) are separately confirmed filled/handled — that was the proof-of-concept case that started this, not the ongoing product scope.

**Resolved (Champion, 2026-09-09):** the introduction-only/no-warranty question is answered by the verification model in sections 19-21, with one condition: verification badges must be scoped in their displayed copy to "information reviewed," not "conduct guaranteed" (see the implementation note under section 19 above). That's a Stage 3 copy/design requirement, not an open product decision — the pastor's verbal guarantee to the one businessman was a one-off personal assurance, not something the platform itself claims.

**Sequencing decision (Champion, 2026-09-09):** build first, resolve compliance after the system is confirmed running. Specifically:

- **PDPA / employment-agency legal status.** The ministry will register in the eCommerce/data-protection portal for compliance, but only after the system is confirmed running and works. Not a pre-launch gate. **Revisit once Phase 1 is live**, before the member base or data volume grows past what's easy to unwind if something needs to change.
- **Employment-agency legal status** (the other half of open question 2 in the brief). Same treatment — revisit once the system is running, not before.
- **Dispute/outcome handling** (what happens when a placement goes wrong, either direction). Flag and design once the system is running, not before.
- ~~**Technical architecture** (stack, hosting, secure document storage). Bring this up once the system is confirmed running and works.~~ **Reversed 2026-09-10 — see [stage-19-technical-architecture.md](stage-19-technical-architecture.md).** The stack is decided (Next.js/TypeScript, Supabase/PostgreSQL, Vercel), following an external review's argument that M1 can't start without one, even a pragmatic one. PDPA/legal compliance above remains deferred; the stack does not.

**Answered, not open:**
- **Who verifies.** Church Admins. Applies to both membership and credential review (PRD sections 19-21).
- **Who runs the platform day to day** (verification queue, opportunity creation, matching). Church Admins.
- **Notification delivery.** In-app — "the app sends the notification." No SMS/WhatsApp channel for v1.
- **Section 39's multi-church/branch architecture — DECIDED 2026-09-10.** Deliberate, not unscoped growth: build the data model to support **branches within Pastor Tony Osborn Ministries** (Church → Branch → Members/Admins, per this section's own structure), but this is not a multi-church SaaS platform serving unrelated ministries. [stage-15-data-model.md](stage-15-data-model.md)'s Church/Branch entities already match this shape.

**Still genuinely open, no owner yet:**
- Verification criteria. Church Admins are the *who*; nobody has yet defined *on what basis* a membership or credential gets approved (length of membership? attendance record? a reference?). This is a workflow-design gap independent of the compliance sequencing above, and blocks the verification screen meaning anything in practice. **This is now the single most-repeated open item across every stage document — resolve this first.**
- Content/seed plan for launch (first profiles, whether the original three-role ask becomes the first live opportunities).

Stage 3 (UI/UX) can proceed, has proceeded, and Stage 4/5 (wireframes, technical architecture) can also proceed under this sequencing — compliance and dispute-handling are explicitly post-launch check-ins, not gates on the build.


---


<div style="page-break-before: always;"></div>

# Stage 3 — UI/UX Design Proposal

Received 2026-09-09, from the same drafting session as Stages 1 and 2. Kept close to as-received; heading levels adjusted to nest under this file's title, numbered sections renumbered to flow under it rather than restart at 1.

Builds on [stage-2-prd.md](stage-2-prd.md). Working product name proposed here: **Professional Network**. Core idea restated: **People → Skills → Opportunities → Impact**.

See the note at the end of this file for one copy-consistency item worth resolving before Stage 4 (wireframes) locks in 42 screens' worth of components.

---

## 1. The design direction

Strongest recommendation: **do not make the platform look like a church website.**

The platform belongs to the church, but its job is professional networking. It should feel like a combination of a modern professional network, a talent/recruitment platform, a professional directory, and an opportunity marketplace, with a subtle connection to the church's identity.

**Professional first. Church-connected second.** Someone looking for an HR manager should feel they are using a serious professional system, not browsing a church announcement website.

---

## 2. Visual personality

Five words: **Trusted** (people are sharing professional and personal information), **Professional** (the platform deals with careers, businesses, serious opportunities), **Warm** (still fundamentally about people and community), **Clear** (there may eventually be thousands of profiles and opportunities), **Progressive** (should feel like something that could scale into a major platform).

---

## 3. Visual style

Avoid: excessive religious imagery, huge crosses everywhere, stock photos of people praying, overly decorative church graphics, excessive gradients, overly corporate "banking app" aesthetics.

Instead: clean typography, generous whitespace, strong information hierarchy, professional cards, subtle brand elements, human photography where appropriate, clear verification indicators, simple iconography.

Church identity should appear through brand colors, logo, language, and tone, rather than dominating every screen.

---

## 4. Design system — color

Deep primary brand color + neutral interface + one opportunity/action color.

**Primary:** Deep Navy / Charcoal — navigation, primary text, headers, brand identity.
**Secondary:** Warm neutral — backgrounds, sections, cards.
**Accent:** A distinctive church brand accent — buttons, active states, verification, important actions.

**Semantic colors:** Green = verified / available / successful. Amber = pending / selective / requires attention. Red = rejected / unavailable / error.

Exact palette should ultimately be derived from the church's existing brand if one exists.

---

## 5. Typography

Modern sans-serif — Inter / Geist / Manrope / Plus Jakarta Sans territory. The important thing is hierarchy, not the specific font: Dashboard 32px/bold, Section 20-24px/semibold, Card title 16-18px/semibold, Body 14-16px, Metadata 12-14px. Gives the interface a contemporary SaaS/product feel.

---

## 6. Information architecture

**Member platform:**
```
Dashboard
├── My Profile
│    ├── Personal
│    ├── Professional
│    ├── Education
│    ├── Experience
│    ├── Skills
│    ├── Certifications
│    └── Documents
├── Opportunities
├── Applications
├── Notifications
└── Settings
```

**Admin platform:**
```
Dashboard
├── Members
├── Professionals
├── Verification
├── Opportunities
├── Applications
├── Analytics
└── Settings
```

---

## 7. Desktop layout

Persistent sidebar for both member and admin. Member: Dashboard, My Profile, Opportunities, Applications, Notifications, Settings, with Help pinned at the bottom. Admin: same pattern plus a top search bar, with Members, Professionals, Verification, Opportunities, Applications, Analytics, Settings.

## 8. Mobile navigation

Sidebar becomes bottom navigation: Home / Profile / Jobs / 🔔. Additional actions live under a menu.

---

## 9. The member experience

### Screen — Landing / welcome

Hero: "Your skills can create impact." Subhead: "Build your professional profile, discover opportunities, and connect your abilities with people and organizations that need them." Buttons: Create Profile, Sign In. Below: three value props — "Show what you can do" (build a verified professional profile), "Discover opportunities" (find opportunities relevant to your skills), "Be part of something bigger" (connect your capabilities to opportunities within and beyond the church).

### Screen — Registration

Kept extremely simple: First name, Last name, Phone/Email, Password, Confirm password, Create account. Then "Already have an account? Sign in." Don't ask for their entire CV during registration.

### Screens — Profile onboarding (stepped, not one giant form)

Progress indicator across steps. Step 1: "Tell us about yourself." Step 2: "What do you do?" — searchable profession field with suggestions (Accountant, Architect, Engineer, Teacher, Software Developer, Driver, Doctor, Lawyer). Step 3: experience (years, employment status). Step 4: education. Step 5: skills. Step 6: CV upload. Step 7: availability (Open to opportunities / Open to selected opportunities / Not currently available). Step 8: review everything, then "Submit for verification."

### Profile completion

Prominent but not annoying progress display: "Your profile — 82% complete" with a progress bar and a checklist (✓ Personal information, ✓ Profession, ✓ Education, ✓ Experience, ✓ Skills, ✓ Availability, ○ Add your CV) and a "Complete profile" action.

### Member dashboard

"Good morning, John. Here's what's happening with your professional profile." Cards: Profile completion %, Verification status, Availability status. Then "Opportunities for you" — opportunity cards with a match label and "View opportunity." The dashboard should answer: How am I doing? Am I verified? Am I available? What opportunities are relevant to me?

### Member profile

Header block: photo, name, profession, location, verification badge, availability badge. Then sections: About, Professional Experience, Education, Skills, Certifications, Documents.

### Skills design

Small tags (Project Management, AutoCAD, Leadership, Structural Design, Construction Management) for scannable profiles.

### Verification design

Highly visible but subtle. **Badge labels (decided, Champion, 2026-09-09): "✓ Membership confirmed" and "✓ Credentials reviewed"** — not "Church Member Verified" / "Verified Professional." The label itself must carry the information-only meaning, since employers scan badges and rarely open hover text. Hover/click still reveals the fuller detail, e.g. "This member's professional information has been reviewed by an authorized administrator," but that detail is a supplement, not where the honesty of the claim lives. See the closing note for where else this applies.

### Opportunity discovery

Header "Opportunities" with subhead "Find opportunities that match your skills and experience," a search field, and filters: Type, Profession, Location, Experience, Date.

### Opportunity card

Title, organization, location + employment type icons, experience/education requirement line, match label, "Posted N days ago," "View opportunity" action.

### Opportunity detail

Title, organization, location, "About the opportunity" description, "Requirements" checklist, "Your match" section breaking down which criteria matched (Profession/Experience/Location/Skills), Apply action.

### Application experience

"Application submitted" confirmation, then a visible status tracker: Applied → Reviewed → Shortlisted → Interview → Selected, so the member isn't left wondering what happened.

---

## 10. The admin experience

More information-dense than the member side.

### Admin dashboard

Header "Professional Network — Overview of your church's professional ecosystem." KPI cards: Members, Verified, Available, Opportunities. Then: professional distribution chart, recent registrations, pending verification, active opportunities, recent successful connections.

### Professional directory

Likely the admin's most-used screen. Header "Professionals — 2,450 members," search (name/profession/skill), filters (Profession, Industry, Location, Experience, Availability, Verification), then a table (desktop) or cards (mobile): Professional / Profession / Experience / Status.

### Admin professional profile

Name, profession, verification badges (✓ Membership confirmed, ✓ Credentials reviewed), actions (Contact, Shortlist, ...), then sections: Professional information, Experience, Education, Skills, Certifications, Documents, Verification history, Applications. The administrator's complete view of the professional.

### Verification center

Its own module. Header "Verification," tabs (All, Pending, Approved, Needs correction), then per-candidate summary: name, profession, profile completeness %, Membership status, Profession status, document count, Review action.

### Verification review

Split view: profile on the left, verification controls on the right — Membership [Approve], Profession [Approve], Documents [View], Notes field, [Approve verification] / [Request correction]. Framed as a deliberate improvement over verification happening through WhatsApp, spreadsheets, or email.

### Opportunity management

"Opportunities" list with "Create opportunity" action; each existing opportunity shows title, organization, type, applicant count, status, and a Manage action.

### Create opportunity (guided, stepped)

Step 1: opportunity type (Employment, Church opportunity, Service, Project, Business). Step 2: basic information (Title, Organization, Location, Description). Step 3: requirements (Profession, Experience, Education, Skills). Step 4: review. Step 5: publish.

### Matching screen

Framed as potentially the most impressive screen in the product. Admin creates an opportunity, selects "Find matching professionals," gets a result count ("24 potential matches") and per-candidate cards: name, profession, experience, location, verification, availability, match percentage, a checklist of what matched (Profession/Experience/Location/Skills/Education), View/Shortlist actions.

### Match explanation

Strong recommendation: explain *why* someone matches, not just a percentage. Show "Strong match" plus a checklist (Profession ✓, Experience ✓, Location ✓, Availability ✓, Required skills 4/5 ✓) so the system is legible, not a black box.

### Shortlist

List of shortlisted candidates with match %, and actions: Contact, Share opportunity, Remove from shortlist, Change status.

### Application management

Per-opportunity funnel counts: Applied / Reviewed / Shortlisted / Interview / Selected, suggested as a visual pipeline.

### Kanban application view

Recommended for admins: columns Applied / Reviewed / Shortlisted / Interview / Selected, candidates as cards moving across.

---

## 11. Analytics and impact

### Analytics screen

Should answer: Who are we? (total professionals) What do they do? (profession breakdown, e.g. Engineering 18%, Education 15%, Business 12%, Healthcare 10%, Technology 9%, Finance 8%...) What opportunities exist? How many people are being connected? What impact are we creating?

### Impact dashboard

Recommended as a major future feature — not just "2,450 members" but "184 people connected to opportunities," "73 jobs obtained," "21 projects completed," "46 businesses connected," "312 professional connections." The framing given: this tells the pastor the platform is doing what it was built to do.

---

## 12. Cross-cutting UX details

**Empty states.** Not "No opportunities." Instead something like: "No opportunities yet — There aren't any opportunities matching your profile right now. Keep your professional information and availability up to date so you're ready when the right opportunity appears." Makes the platform feel alive even with no data.

**Mobile UX (member).** Don't show a desktop-style 30-field form. Instead a list of sections (Personal information ✓, Professional information ✓, Education →, Experience →, Skills →, Certifications →, CV →, Availability ✓) where each opens separately.

**Admin mobile.** Condensed dashboard cards (Pending verification, Active opportunities, New applications) with direct actions (Review verification, View opportunities), tables collapsing to cards.

**Search UX.** Not a bare search box — intelligent filtering alongside it (Profession, Location, Experience, Availability, Verification), easy to clear.

**Profile privacy UX.** A "Privacy & Visibility" page giving the member control: Professional profile visible to church administrators (toggle), Contact information shared when shortlisted (toggle), CV shared only when applying (toggle). Gives members a feeling of control.

**Notification center.** Badge count on the bell icon. Notifications are actionable — clicking one takes the user directly to the relevant object.

---

## 13. Design components

Buttons, Inputs, Selects, Search, Dropdowns, Tabs, Cards, Tables, Badges, Avatars, Progress bars, Modals, Toasts, Alerts, Empty states, Pagination, Filters, File upload, Timeline, Status indicators.

## 14. Status system

**Green:** Verified, Available, Selected, Successful. **Amber:** Pending, Under review, Selective. **Red:** Rejected, Unavailable, Error. **Neutral:** Draft, Archived.

---

## 15. Core UX principles

**"What should I do next?"** should always be answerable — e.g. member: "Complete your profile →"; admin: "12 professionals need verification →"; opportunity: "24 potential matches found →"; application: "3 candidates are ready for review →." Keeps the platform action-oriented.

**Sense of progression.** A member should feel the arc: Registered → Profile created → Profile complete → Member verified → Profession verified → Discoverable → Matched → Connected → Opportunity. The UX should visually reinforce this.

**Brand experience.** Use the church's logo, brand colors, typography where appropriate, language, and values — but the interface itself should communicate "this is where serious professional opportunities happen."

**One-sentence design philosophy, as given to the designer:** "Design this as a premium professional network that happens to be powered by a church community, not as a church website that happens to contain professional profiles."

---

## 16. What's established through Stage 3

**Stage 1 (Project Definition):** vision, problem, solution, users, product ecosystem, MVP, future roadmap.
**Stage 2 (PRD):** functional requirements, user stories, workflows, verification, opportunities, matching, applications, privacy, analytics, MVP boundaries.
**Stage 3 (UI/UX Architecture):** information architecture, navigation, member experience, admin experience, dashboard structure, profile experience, opportunity experience, matching experience, verification experience, analytics, mobile strategy, design system direction.

---

## Next stage, as planned by the drafting session

Stage 4 — a screen inventory + wireframe specification, taken screen by screen with exact layout, components, content, interactions, desktop version, mobile version, and states.

**Member (24 screens):** Welcome, Login, Registration, Profile onboarding, Personal information, Professional information, Education, Experience, Skills, Certifications, CV upload, Availability, Profile review, Member dashboard, Professional profile, Edit profile, Opportunities, Opportunity details, Apply, Applications, Application details, Notifications, Settings, Privacy.

**Admin (18 screens):** Admin login, Admin dashboard, Members, Member profile, Verification queue, Verification review, Professionals, Professional search, Opportunity list, Create opportunity, Opportunity details, Find matches, Candidate profile, Shortlist, Applications, Application pipeline, Analytics, Settings.

---

## Verification badge copy — resolved

**Decided (Champion, 2026-09-09).** The two verification badges are labeled **"✓ Membership confirmed"** and **"✓ Credentials reviewed"**, not "Church Member Verified" / "Verified Professional" as originally drafted in section 9. The label itself carries the information-only meaning, since employers scan badges and rarely open hover text, so the honesty of the claim can't live only in copy most people never see.

This applies everywhere either badge appears: member dashboard, member profile, admin directory, admin professional profile, matching screen, shortlist. Stage 4 should use these exact labels rather than re-deriving wording per screen. Section 9 above (Admin professional profile) has already been updated to match; any other screen spec written from this document should follow the same two labels.

The color-coded status legend in section 14 (Green = Verified/Available/Selected/Successful) and the admin dashboard's "Verified" KPI tile in section 10 are unaffected — those are aggregate/internal shorthand, not a claim shown against one person's profile to an employer, so the same overclaim risk doesn't apply there.


---


<div style="page-break-before: always;"></div>

# Stage 4 — Pre-Development Blueprint

Received 2026-09-09, from another source ("other inputs from somewhere else" — not the same drafting session as Stages 1-3, and not verified against this project's specific decisions before arriving). A 54-item checklist of what stands between the PRD/UX work done so far and writing production code, framed as: Vision → Product Definition → PRD → UX → UI → **Functional Specification → Technical Architecture → Data Model → Security → Development → QA → Launch**, with the claim that this project is currently at UI/UX and the middle is unfinished.

**This file does the sorting the source document didn't do for this project specifically:** many of its 54 items are already answered by [stage-2-prd.md](stage-2-prd.md), [project-brief.md](project-brief.md), or Champion's 2026-09-09 decisions (see [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md)). Restating those as open would contradict decisions already made. What follows is organized in three tiers: **already answered** (pointer only, not restated), **genuinely new gaps** (kept in full, this is the real content of this stage), and **deferred by earlier decision** (pointer only).

**Update, 2026-09-10:** two items below were current when this stage was written and are now stale. **#13 Technology stack is no longer deferred** — see [stage-19-technical-architecture.md](stage-19-technical-architecture.md), decided following an external spec review. **#25 Church/branch architecture is no longer open** — decided ministry-only (branches within Pastor Tony Osborn Ministries, not a multi-church SaaS platform), see the PRD's closing section. Left the original text below unchanged rather than edited in place, since this document is a historical sorting pass, not a living spec — [stage-2-prd.md](stage-2-prd.md) and [stage-19-technical-architecture.md](stage-19-technical-architecture.md) are where the current answers live.

---

## Already answered elsewhere — not restated as open here

| Item from the source checklist | Where it's actually answered |
|---|---|
| #2 Permissions matrix | [stage-2-prd.md](stage-2-prd.md) sections 37-38 (narrative form; a literal matrix table is one of the new gaps below) |
| #6 Verification mechanism (who verifies) | Church Admins — see brief open question 3, PRD sections 19-21. Criteria (on what basis) is still open, not new — see the Still Open list below |
| #7 Privacy/visibility table | PRD section 38, nearly identical to the source's version |
| #13 Technology stack | Explicitly deferred by decision — "bring this up later, when the system is running" |
| #21 Notification architecture | Answered — in-app only, "the app sends the notification," no SMS/WhatsApp for v1 |
| #25 Church/branch architecture | PRD section 39 already has this; whether it's deliberate vs. scope creep is an existing open item, not new |
| #26 MVP scope: church-controlled vs. employer portal | PRD section 6.3 already resolves this the same way the source document independently recommends: church-controlled for MVP, employer accounts future-facing |
| #34 Legal/privacy requirements | Folded into the compliance deferral — post-launch, not pre-build |
| #38 Who operates the platform | Church Admins — already answered |
| #53 What not to build | PRD section 48's MVP non-goals list, nearly identical to the source's version |

---

## Deferred by earlier decision — not re-opened here

Per [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md), these wait until the system is confirmed running:

- #13 Technology stack, #46 Infrastructure (environments, migrations, monitoring), #47 Backup and recovery, #48 Deployment process — all technical-architecture items, deferred together.
- #23 Security specification, #24 Audit logging — real requirements (and PRD sections 49-50 already list baseline expectations), but the *detailed* spec work waits with the rest of technical architecture.
- #34 Legal/privacy documents (Terms of Service, Privacy Policy, consent, deletion) — folded into the PDPA/employment-agency deferral.

---

## Genuinely new — not covered by any existing document

This is the real content of Stage 4. Kept close to the source's own framing, trimmed of items already covered above.

### 1. MVP feature freeze (P0 / P1 / P2)

The PRD has an MVP feature list (section 8-9) and a non-goals list (section 48), but not a single frozen table classifying every feature as P0 (must exist), P1 (soon after launch), or P2 (explicitly excluded). Worth producing before development starts — it's the one artifact every other estimate (sprints, timeline) depends on.

### 2. Complete user journeys, mapped step by step

The PRD and UX doc describe journeys in prose (PRD section 58, UX section 15). Not yet done as explicit step-by-step flows for: new member, existing member, admin verification, opportunity creation, professional search, matching, shortlisting, application, rejection, correction, successful connection. Worth doing before screen-level functional specs, since the flow determines what each screen needs.

### 3. Screen-by-screen functional specification

Stage 3 describes screens narratively (layout, content, tone). Not yet defined per screen: exact inputs, exact actions, exact permissions per role, exact states (unverified / pending / verified / needs correction / incomplete / no CV / no experience), and responsive behavior at each breakpoint. This turns "Professional Profile screen" into something a developer can build without guessing.

### 4. State machines for core entities

**Member:** Registered → Profile Incomplete → Profile Complete → Verification Pending → Verified → Active, with alternate states (Needs Correction, Suspended, Rejected, Inactive).

**Opportunity:** Draft → Published → Accepting Applications → Closed → Selection → Completed, with alternates (Cancelled, Expired, Filled). Needs an explicit rule for what happens to open applications when an opportunity closes.

**Application:** Applied → Reviewed → Shortlisted → Interview → Selected, with Rejected as an alternate. Each transition needs its actual behavior defined (does "Reviewed" notify the member? What does an Interview record — date, time, location, instructions? Does "Rejected" show a reason or just "Not selected"?).

None of these exist as formal state machines yet, only as informal progressions in prose.

### 5. How "connect" actually works

Genuinely undefined anywhere so far. When an admin clicks "Contact" or "Shortlist" on a candidate, what actually happens? Four options on the table:
- **A.** Reveal the member's phone number directly.
- **B.** Notify the member: "A church administrator is interested in connecting with you."
- **C.** Create a formal connection request the member accepts/declines.
- **D.** Admin contacts the member through an in-platform channel.

The source recommends a **controlled connection** (B or C) over directly exposing contact info (A), consistent with the PRD's existing privacy stance (section 38: phone/email are "Controlled" for employers, not automatically shared) and the "discoverability without unnecessary exposure" principle. Worth a decision, since it's currently just implied by adjacent privacy rules, not stated outright.

### 6. Matching algorithm — actual weights, not just relative importance

PRD section 29 ranks factors (Profession Very High, Skills High, Experience High, Availability High, Location Medium, Education Medium, Verification Very High) but never turns that into a formula. A concrete starting point, not yet decided:

```
Profession       30%
Skills           20%
Experience       15%
Availability     15%
Verification     10%
Location          5%
Education         5%
```

Whatever the actual weights end up being, the system should still explain the result per-candidate (already established in PRD section 29 and Stage 3 section 10's "match explanation" principle) — this item is about the number, not the explainability requirement, which is already decided.

### 7. Database schema / ERD

The PRD names entities (section 44) and the primary relationship chain (section 45), but not actual field-level schema or foreign-key relationships. This is real technical-architecture work — arguably it belongs inside the deferred stack decision rather than as a separate pre-build gate, since a schema is hard to finalize before the stack (relational vs. document store) is chosen. Flagging it here rather than filing it under the deferral, since Champion should decide explicitly which bucket it's in.

### 8. Controlled taxonomy for professions, skills, industries

Real gap: free-text profession/skill entry means "Software Developer," "Software Engineer," "Developer," and "Full Stack Dev" are seen as unrelated by search and matching. The source recommends a controlled taxonomy (e.g. Engineering → Civil / Mechanical / Electrical / Software) over free text, matching PRD section 14's own aside about "Human Resources" vs. "HR." No taxonomy exists yet. This affects both the registration UI (Stage 3's searchable profession field) and matching quality, so it's worth deciding before those are built out further, not after.

### 9. API specification

Not started. Needs a defined contract (REST or otherwise) between frontend and backend — auth, member profile, professional directory, opportunities, applications, admin verification actions. Depends on the stack decision, so it's downstream of the deferred technical-architecture work, but the *shape* of the API (what operations exist) can reasonably be drafted from the PRD's feature list independent of which framework implements it.

### 10. Acceptance criteria / QA scenarios, written as tests

PRD section 57 has some acceptance criteria (when is a profile complete, when does a professional appear in the directory, when can an opportunity publish). Not yet extended to Given/When/Then style scenarios covering registration, verification, matching, application flow, and QA categories (functional, cross-browser, cross-device, security, performance). This is what turns the spec into a developer's actual definition of done.

### 11. Seed/demo data

Needs realistic fake data (the mockup artifacts already show a taste of this — Sarah Kessy, John Michael, ABC Logistics, etc.) at real scale, since dashboards, search, and matching all look and behave differently with 5 records vs. 500. Worth producing before or alongside development, not after.

### 12. Loading, empty, and error states, enumerated completely

Stage 3 covers empty states for opportunities/applications/professionals (section 12) and this new source adds more (failed login, expired session, failed upload, CV too large, invalid file type, network failure, opportunity expired, duplicate application, suspended account). Worth consolidating into one list so nothing gets built without a defined failure mode.

### 13. Email and in-app notification copy, written out

PRD section 34 lists notification *events*. Neither PRD nor UX has actual final copy for each (welcome email, verification approved, verification needs correction, new matching opportunity, shortlisted, interview scheduled, application outcome). Since notifications are in-app only per the earlier decision, this is now about in-app copy specifically, not email templates — the source's email-template framing (item #42) is partly moot given that decision.

### 14. Development milestones / sprint breakdown

Not started. A vertical-slice breakdown (auth → profile → verification → directory → opportunities → matching → applications → admin → QA) makes the build controllable and estimable, once the above items give it something concrete to slice.

### 15. Operational workflow validation with actual church leadership

The source's "every morning, admin opens Verification Queue" scenario is a reasonable guess, but it hasn't been checked against how Church Admins would actually work day to day. Worth a short conversation once admins are named, likely alongside resolving verification criteria (still open, see below).

---

## Still open, unchanged — not new, just re-surfaced by this document

- **Verification criteria** (on what basis Church Admins approve membership/credentials). Confirmed in memory as the one item not covered by the compliance deferral — this document's #6 independently arrives at the same gap ("we haven't yet decided how membership gets confirmed mechanically — membership number? branch? admin confirmation?").
- **Church/branch architecture intent** — is multi-branch deliberate.
- **Content/seed plan for launch** — overlaps with item 11 above (seed data), but the *product* question (does the businessman's original three-role ask become the first live opportunities) is still Champion's call, not a data-generation task.

---

## What to do with this

Not a decision document — a map of what's left. The 15 genuinely-new items above are real gaps regardless of who raised them; the earlier tiers exist so this file doesn't relitigate settled ground. When Champion is ready to move past Stage 3, working through the "genuinely new" list — likely starting with the MVP freeze (item 1) and user journeys (item 2), since several other items depend on those — is the concrete next step, not the deferred technical-architecture items.


---


<div style="page-break-before: always;"></div>

# Stage 5 — MVP Feature Freeze

Written 2026-09-09, by Champion working from [stage-2-prd.md](stage-2-prd.md)'s feature set. This is item 1 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s "genuinely new" list, done first because the user journeys (Stage 6) and everything after depend on knowing exactly what's being built.

The PRD already has an MVP feature list (sections 8-9) and a non-goals list (section 48). This document doesn't repeat those in prose, it turns them into one frozen table with every feature classified, so there's a single place to check "is X in scope" instead of re-deriving it from PRD prose each time.

## How to read this

**P0 — must exist.** The system isn't a usable v1 without it. If any P0 item is missing, the "aha moment" (an admin searches a profession, gets explainable verified matches, shortlists, member gets notified) doesn't work end to end.

**P1 — important, not launch-blocking.** Real value, can land in the weeks right after launch without the first version feeling broken without it.

**P2 — explicitly out of scope for now.** Not forgotten, just not being built. Revisit only if usage after launch actually demands it.

Reasoning is given only where the call isn't obvious from the PRD itself — most rows are a direct read of PRD sections 8-9 and 48, not a new decision.

---

## Member-facing

| Feature | Tier | Note |
|---|---|---|
| Registration (email/phone) | P0 | |
| Login / logout / password reset | P0 | |
| Profile: personal information | P0 | |
| Profile: profession, job title, industry, employment status | P0 | |
| Profile: education (multiple records) | P0 | |
| Profile: experience (multiple records) | P0 | |
| Profile: skills | P0 | Free-text at launch — see Stage 4 item 8 (taxonomy) below, deliberately not blocking on it |
| Profile: certifications | P1 | Real value but not required for the first useful profile; a member with education + experience + skills is already searchable |
| CV upload | P0 | The transcript's original ask was explicitly CV-shaped data; skipping this breaks the founding use case |
| Availability status (Open / Selective / Not available) | P0 | Directly gates matching results |
| Profile completion indicator | P1 | Nice-to-have nudge, not required for the system to function |
| Member dashboard (status, recommended opportunities) | P0 | |
| Browse/search opportunities | P0 | |
| Apply to an opportunity | P0 | |
| Application status tracking | P0 | Applied → Reviewed → Shortlisted → Interview → Selected, per PRD section 32-33 |
| In-app notifications | P0 | Decided: in-app only, no SMS/WhatsApp for v1 |
| Privacy/visibility settings page | P1 | PRD section 38's visibility rules can ship as fixed defaults at launch; a member-facing settings page to adjust them is a fast follow, not launch-blocking |
| Settings (account-level) | P1 | |

## Admin-facing

| Feature | Tier | Note |
|---|---|---|
| Admin login | P0 | |
| Admin dashboard (KPIs, needs-attention) | P0 | |
| Professional directory (search + filter) | P0 | The single most load-bearing screen in the whole product |
| Directory filters: profession, location, experience, availability, verification | P0 | |
| Directory filter: education level | P1 | PRD section 23 already flags this as "eventually" |
| Admin professional profile view | P0 | |
| Verification queue | P0 | Without this, "verified" badges have nothing behind them |
| Verification review (approve / request correction) | P0 | |
| Create opportunity | P0 | |
| Opportunity list / manage | P0 | |
| Find matches for an opportunity | P0 | The "aha moment" itself — see PRD section 52 |
| Match explanation (per-criterion breakdown, not just a %) | P0 | Decided already: explainability is not optional, PRD section 29 and Stage 3 section 10 |
| Shortlist candidates | P0 | |
| Application management per opportunity | P0 | |
| Kanban-style application pipeline view | P1 | Genuinely useful (Stage 3 section 10) but a sorted/filtered list accomplishes the same task at launch |
| Analytics: professional distribution | P1 | Reporting on top of data that already exists; doesn't block anyone doing their job |
| Analytics: impact dashboard (jobs obtained, connections made) | P2 | PRD section 33 itself frames this as "a major future feature" — there's no outcome data to show it until after launch anyway |
| Audit trail (who verified/changed what) | P0 | Not optional given this is personal data reviewed by multiple admins — PRD section 50 lists this under Security, and Stage 4 confirms it's a real requirement even though the *detailed* security spec is deferred |

## Cross-cutting

| Feature | Tier | Note |
|---|---|---|
| Verification model: membership + credential badges with resolved copy | P0 | Already decided and designed — [stage-3-ux.md](stage-3-ux.md) closing section |
| Controlled skills/profession taxonomy | P1 | Real gap (Stage 4 item 8), improves matching quality, but free-text search still functions without it at launch — don't let this block P0 work |
| Mobile-responsive member experience | P0 | PRD section 52: mobile-first is a stated principle, not optional |
| Empty states (no opportunities, no applications, no results) | P0 | Cheap to build, expensive to skip — a broken-feeling empty screen undermines trust in a v1 |

## Explicitly out — P2, per PRD section 48 and Stage 4 item 15 confirmation

Employer/organization self-service accounts and talent-request submission · Project management module (multi-professional project teams) · Business network / verified-business listings · Messaging beyond notifications · AI-assisted or recommendation-based matching · Payments · Public/indexable profiles · Social feed · Marketplace transactions · A dedicated mobile app (the responsive web experience covers this)

No new reasoning needed here — this list matches PRD section 48 exactly. Restated so this document is a complete standalone reference rather than requiring a second lookup.

---

## What P0 actually adds up to

Reading straight down the P0 rows: a member can register, build a real profile (personal info, profession, education, experience, skills, CV, availability), get verified by a Church Admin against the two badges, and see matching opportunities. An admin can search the directory, create an opportunity, get an explainable match list, shortlist, and track applications through to an outcome, with an audit trail behind every verification decision. Nothing in that loop depends on a P1 or P2 item.

That loop is exactly the PRD's own "MVP definition of done" (section 60) and "aha moment" (source checklist item 52, and PRD section 52's admin-dashboard framing) — this freeze doesn't redefine what MVP means, it just makes the feature list behind that definition explicit and checkable.

## What this unblocks

[stage-6-user-journeys.md](stage-6-user-journeys.md) is built directly from the P0 row list above — every journey maps to a P0 feature, and no journey is written for a P1/P2 feature. If a future feature request doesn't appear as a P0 row here, treat that as a signal to check this table before building it, not a reason to assume it's in scope.


---


<div style="page-break-before: always;"></div>

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


---


<div style="page-break-before: always;"></div>

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


---


<div style="page-break-before: always;"></div>

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


---


<div style="page-break-before: always;"></div>

# Stage 9 — Matching Algorithm

Written 2026-09-09, by Champion. Item 6 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. [stage-2-prd.md](stage-2-prd.md) section 29 ranks factors by relative importance (Profession Very High, Skills High, Experience High, Availability High, Location Medium, Education Medium, Verification Very High) but never turns that into a number. This document does.

## The weights

| Factor | Weight | Why this weight |
|---|---:|---|
| Verification (both badges Confirmed/Reviewed) | **Gate, not a weighted factor** | See below — this isn't scored, it's a filter |
| Profession | 30% | The PRD's own "Very High" tier, and the single field every opportunity search starts from (Journey 5, Journey 6) |
| Skills | 20% | "High" tier; most opportunities list several required skills, so this carries real discriminating power between two same-profession candidates |
| Experience (years, vs. opportunity's minimum) | 20% | "High" tier — raised from the PRD's implied parity with Skills to reflect that the businessman's original ask (Journey 1's founding case) was explicitly experience-gated ("5+ years") |
| Availability (Open/Selective vs. Not available) | 15% | "High" tier, but capped below Profession/Skills/Experience since availability is closer to a soft filter than a differentiator — see note below |
| Location | 10% | "Medium" tier |
| Education | 5% | "Medium" tier, weighted lowest of the "Medium" pair since most opportunities in the founding use case (drivers, managers, HRs) don't gate primarily on degree level |
| **Total** | **100%** | |

**Verification is a gate, not a weighted score.** Per [stage-7-state-machines.md](stage-7-state-machines.md)'s decision that both badges must be Confirmed/Reviewed before a member is even discoverable, an unverified member never enters the candidate pool for matching in the first place — there's nothing to weight. This resolves a small inconsistency in the PRD, which listed Verification as a scored factor (section 29) even though section 21's workflow already implies unverified members aren't in the searchable directory to begin with. Treating it as a gate, not a percentage, is more honest to how the rest of the system already works.

**Availability is mostly a filter, not a scoring input.** A "Not available" member shouldn't rank lower, they shouldn't appear at all (the whole point of the availability toggle, PRD section 17, Journey 3). So in practice: Not Available members are excluded before scoring runs; the 15% only differentiates between Open (full weight) and Selective (partial weight, since a Selective member has said they'll only consider suitable opportunities — this one *is* worth scoring, since it signals lower conversion likelihood even when the profession/skills match).

## The formula

For a candidate who has passed the verification gate and the availability filter:

```
match_score =
    (profession_match × 0.30) +
    (skills_match     × 0.20) +
    (experience_match × 0.20) +
    (availability_match × 0.15) +
    (location_match   × 0.10) +
    (education_match  × 0.05)
```

Each sub-score is 0.0–1.0, not a separate weighting scheme:

- **profession_match:** 1.0 if the member's primary profession matches the opportunity's required profession exactly (or, once [Stage 4 item 8's taxonomy](stage-4-pre-development-blueprint.md) exists, matches within the same taxonomy leaf); 0.0 otherwise. Binary, not partial — a mismatched profession isn't "somewhat" a match. **Until the taxonomy exists, this is free-text exact-match, which will under-match near-synonyms (see Stage 4 item 8) — a known limitation, not a bug in this formula.**
- **skills_match:** (number of required skills the member has) ÷ (total required skills). E.g. 4 of 5 required skills = 0.8.
- **experience_match:** 1.0 if member's years ≥ opportunity's minimum; below that, a linear ramp down to 0.0 at half the minimum (e.g. opportunity wants 5+ years, member has 3 → 3/5 = 0.6), floored at 0.0 for anything below half. Avoids a harsh binary cutoff for someone one year short while still meaningfully penalizing a large gap.
- **availability_match:** 1.0 for Open, 0.6 for Selective (members already excluded from the pool entirely if Not Available, per the gate above).
- **location_match:** 1.0 if same city/region as the opportunity, 0.5 if unspecified/unknown, 0.0 if a different, distant region. (Assumes location is a single city/region field, matching PRD section 10's "Location" field — no radius/distance calculation for MVP.)
- **education_match:** 1.0 if member's education level meets or exceeds the opportunity's stated requirement, 0.0 if below, 1.0 if the opportunity specifies no education requirement (don't penalize for a criterion the opportunity didn't ask for).

## The explanation shown to the admin (already decided, restated for completeness)

Per PRD section 29 and [stage-3-ux.md](stage-3-ux.md) section 10's "match explanation" principle, already decided as non-negotiable: never show only the percentage. Every candidate row shows the per-criterion breakdown:

```
96% match

✓ Profession        (exact match)
✓ Skills             4/5 required
✓ Experience         8 yrs (5+ required)
✓ Availability       Open
✓ Location            Dar es Salaam
✓ Education          Bachelor's (met)
```

A criterion below its own full score still shows (e.g. "3/5 required skills," not hidden), so the admin sees exactly where the score came from — this is what makes the number legible rather than a black box, and it's the reason the formula above needs named sub-scores per factor, not just one opaque blended output.

## What this does NOT decide

- The exact **display threshold** for "Strong match" / "Good match" / "Fair match" labels used in Stage 3's mockups (e.g. is 90%+ "Strong"?). Suggest 85%+ Strong, 65-84% Good, below 65% Fair or not shown at all, but this is a cosmetic tuning question, not a structural one — easy to adjust after real matching data exists, unlike the weights above which affect what the query itself returns.
- Whether these weights are configurable by an admin later, or hardcoded. Recommend hardcoded for MVP (no screen or need identified for admin-tunable weights in Stage 5's P0/P1 list) — revisit only if real usage shows the defaults are wrong for this specific congregation's mix of professions.


---


<div style="page-break-before: always;"></div>

# Stage 10 — Profession, Skills & Industry Taxonomy

Written 2026-09-09, by Champion. Item 8 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Without this, free-text entry means "Software Developer," "Software Engineer," and "Developer" are unrelated strings to search and matching (the exact problem [stage-2-prd.md](stage-2-prd.md) section 14 and [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s profession_match note both flag).

Per [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md), a full taxonomy is P1, not P0 — free text ships at launch. This document exists so that when it's built, it isn't invented from scratch, and so the registration/onboarding screens (Stage 3) know roughly what list they're pointing a searchable field at, even before the full taxonomy is finalized.

## Structure: two-level, not deep

Profession and Industry each get a two-level hierarchy (category → specific profession), not the three-or-more-level trees some ATS systems use. A two-level list is easier for a member to self-select from during onboarding (Stage 3's "searchable profession field," Journey 1 step 3) and easier for an admin to reason about when filtering the directory — depth adds precision matching software doesn't currently need at this scale.

## Profession categories (seed list, not exhaustive)

Built from three sources: the PRD's own recurring examples (sections 1, 36), the founding use case (drivers, managers, HRs — Journey 1's origin), and Stage 6's seed-data candidates (engineers, teachers, accountants, HR professionals, business owners, designers, technicians).

| Category | Professions |
|---|---|
| **Engineering & Construction** | Civil Engineer, Mechanical Engineer, Electrical Engineer, Architect, Quantity Surveyor, Site Supervisor, Electrician, Plumber |
| **Business & Administration** | HR Manager, HR Officer, Office Administrator, Operations Manager, Project Manager |
| **Finance & Accounting** | Accountant, Auditor, Bookkeeper, Financial Analyst |
| **Technology** | Software Developer, IT Support, Network Technician, Data Analyst |
| **Education** | Teacher, Tutor, School Administrator |
| **Healthcare** | Nurse, Clinical Officer, Pharmacist, Lab Technician |
| **Transport & Logistics** | Driver, Logistics Coordinator, Fleet Manager |
| **Legal** | Advocate, Paralegal, Legal Secretary |
| **Trade & Technical** | Welder, Mechanic, Carpenter, Tailor |
| **Sales & Marketing** | Sales Representative, Marketing Officer, Customer Service |
| **Creative & Design** | Graphic Designer, Photographer, Videographer |

Each profession also carries **synonym tags** for search, so a free-text search for "HR" still surfaces "HR Manager" and "HR Officer," and "civil engineering" surfaces "Civil Engineer" — this is what actually solves the PRD section 14 problem, not the category structure alone.

This list is a starting point, expected to grow as real member profiles get created — it should not block onboarding (a member whose profession isn't listed yet should be able to submit free text that an admin can later fold into the taxonomy, not be blocked from registering).

## Skills — flat list, not categorized, with per-profession suggested sets

Unlike profession, skills don't need a category hierarchy — they're tags attached to a profile (Stage 3's "small tags" UI, already designed), and a member typically has skills spanning what their profession implies plus a few extras. Structure instead as:

- **A flat, growing list of known skills** (AutoCAD, Project Management, Structural Design, Recruitment, Bookkeeping, Customer Service, Class C Driving License, etc.) with the same synonym-tagging approach as professions.
- **A suggested-skills set per profession category**, shown first when a member picks their profession during onboarding (e.g. selecting "Civil Engineer" surfaces AutoCAD, Structural Design, Construction Management, Project Management as one-tap suggestions before free entry). This directly serves Stage 3's stepped onboarding (Step 5: Skills) without requiring the member to type from nothing.

## Industry — mirrors profession categories, not a separate list

PRD section 11 lists Industry as a distinct field from Profession ("Civil Engineer" / "Construction"). Rather than maintain two independent taxonomies, Industry should be **derived from the Profession category** by default (Civil Engineer → Construction; HR Manager → Business & Administration), with the option to override for members whose profession spans industries (e.g. an Accountant could be in Finance, or embedded in a Construction firm's finance department). This keeps the taxonomy from doubling in maintenance burden for a field the PRD itself treats as secondary to Profession in matching weight (Stage 9's weights don't score Industry at all — it's descriptive, not a matching input).

## Employment types and education levels — short, fixed lists, no hierarchy needed

Already effectively fixed by the PRD's own text, just consolidating here so they live somewhere:

- **Employment status** (PRD section 11): Employed, Self-employed, Business owner, Freelancer, Student, Unemployed, Retired, Other.
- **Education level** (for matching, PRD section 11/38): no formal education stated, Secondary/Certificate, Diploma, Bachelor's, Master's, Doctorate. Used by [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s education_match as an ordered scale (Bachelor's ≥ Diploma, etc.), so this list needs to stay ordered, not alphabetical, wherever it's implemented.
- **Opportunity types** (PRD section 26, Stage 5's P0 scope): Employment, Church Opportunity, Service. (Project and Business are P2 per Stage 5 — don't add them to this list's active options yet, even though PRD sections 40-41 describe them as future types.)

## What this document doesn't do

Doesn't produce a database-ready seed file (that's part of Stage 15/16's seed-data and schema work) or a UI mockup (Stage 3 already has the relevant screens' shape, e.g. the searchable profession field). This is the content decision — the actual category/profession/skill lists and the reasoning for the structure — that those downstream artifacts should be built from, so the taxonomy isn't invented a second time when someone gets to seed data or the onboarding screen's actual autocomplete list.


---


<div style="page-break-before: always;"></div>

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


---


<div style="page-break-before: always;"></div>

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


---


<div style="page-break-before: always;"></div>

# Stage 13 — Acceptance Criteria & QA Scenarios

Written 2026-09-09, by Champion. Item 10 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. [stage-2-prd.md](stage-2-prd.md) section 57 has some acceptance criteria already (when is a profile complete, when does a professional appear in the directory, when can an opportunity publish); this document extends that into Given/When/Then scenarios covering the full P0 scope from [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md), built directly from [stage-6-user-journeys.md](stage-6-user-journeys.md) and [stage-7-state-machines.md](stage-7-state-machines.md). This is the developer's actual definition of done — not exhaustive test-case enumeration, but the scenarios that prove each P0 journey works.

## Registration & profile

**Scenario: successful registration**
Given a person is not registered, when they submit valid first name, last name, phone/email, and password, then an account is created and they proceed to profile onboarding.

**Scenario: duplicate registration blocked**
Given a phone/email already has an account, when someone tries to register with it again, then registration is refused with the copy from [stage-11-states-catalog.md](stage-11-states-catalog.md) ("An account already exists…") and no duplicate account is created.

**Scenario: onboarding resumes after interruption**
Given a member closed the app partway through the 8-step onboarding (Journey 1, step 3), when they return, then they resume at the step they left, not from Step 1, and previously entered data is retained.

**Scenario: profile reaches Profile Complete**
Given a member has filled every P0 field (personal info, profession, education, experience, skills, CV, availability — per Stage 5), when they select "Submit for verification," then the profile transitions Registered → Profile Complete (Stage 7) and both verification tracks enter Pending.

**Scenario: submission blocked on missing P0 field**
Given a member has not uploaded a CV (a P0 field), when they attempt to submit for verification, then submission is refused with an inline error naming the missing field (per Stage 11), and the profile stays in Registered.

## Verification

**Scenario: membership approved**
Given a member's Membership track is Pending, when a Church Admin approves it, then the track transitions to Confirmed (Stage 7), an audit log entry is written (who/what/when), and the member receives the notification defined in [stage-12-notification-copy.md](stage-12-notification-copy.md).

**Scenario: credentials need correction**
Given a member's Credentials track is Pending, when a Church Admin requests correction with a note, then the track transitions to Needs Correction, the note is attached and visible to the member (Journey 2), and the member is notified.

**Scenario: correction resubmission returns to Pending**
Given a member's track is Needs Correction, when the member edits the flagged section and resubmits, then that track returns to Pending (Stage 7) — not directly to Confirmed/Reviewed, it re-enters the queue.

**Scenario: directory visibility requires both tracks approved**
Given a member has Membership: Confirmed but Credentials: Pending, when an admin searches the directory, then this member does NOT appear in results (Stage 7's decided gate — both tracks required). This is the one scenario most worth a developer double-checking against Stage 7's flagged decision, since getting the boolean wrong here (OR instead of AND) silently breaks the trust model.

## Directory & search

**Scenario: search returns relevant results**
Given at least one verified member has profession "Civil Engineer," when an admin searches "Civil Engineer," then that member appears in results. *(Note: with taxonomy not yet built per Stage 5's P1 classification, this scenario is exact/substring text match only — a search for "Engineer" alone matching "Civil Engineer" is acceptable at MVP; a search for a true synonym like "Structural Engineer" matching "Civil Engineer" is NOT expected to work until Stage 10's taxonomy ships.)*

**Scenario: filters narrow correctly**
Given the directory has members with mixed availability, when an admin filters to "Available," then only Open (not Selective or Not Available) members from Stage 9's gate logic appear — matching Stage 9's stated behavior that Not Available members are excluded, not merely scored lower.

## Opportunities & matching

**Scenario: opportunity creation and publish**
Given an admin completes the 5-step creation flow (Journey 5) with all required fields, when they select Publish, then the opportunity transitions Draft → Published (Stage 7) and becomes immediately visible in member browse/search and in matching.

**Scenario: matching returns an explainable result**
Given an opportunity requires "HR Manager, 5+ years, Dar es Salaam," when an admin selects "Find matching professionals," then results are ranked by the [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md) formula, verification-gated and availability-filtered per that document, and each result shows the per-criterion breakdown (not just a percentage) per the decided explainability requirement.

**Scenario: an unverified member never appears in matches**
Given a member has not completed verification, when an admin runs "Find matches" against any opportunity, even one this member would otherwise qualify for, then this member does not appear — proves the verification gate applies to matching, not only to direct directory search.

## Applications

**Scenario: apply and track**
Given a verified member views an open opportunity, when they select Apply, then an Application is created in state Applied (Stage 7), they see the "Application submitted" confirmation (Stage 11), and the application appears in their My Applications list.

**Scenario: cannot apply twice**
Given a member has already applied to an opportunity, when they attempt to apply again, then the action is blocked with the copy from Stage 11 ("You've already applied…"), and no second Application record is created.

**Scenario: shortlist reveals contact info per Stage 8**
Given an admin shortlists a candidate, when the transition Applied/Reviewed → Shortlisted occurs, then (a) the member is notified per Stage 12, and (b) the admin's view of that candidate now shows phone/email — per [stage-8-connection-model.md](stage-8-connection-model.md)'s staged-visibility decision. Contact info must NOT be visible to the admin before this transition.

**Scenario: rejection shows no detailed reason**
Given an admin records an outcome as Rejected, when the member views their application status, then they see "You weren't selected for [opportunity]" (Stage 12) with no admin notes or detailed reason exposed — proves PRD section 10's stated privacy stance actually holds in the UI, not just in the copy doc.

## Cross-cutting / regression-worthy

**Scenario: audit trail exists for every verification decision**
Given any approve/reject/correction action by a Church Admin, when the action completes, then an audit log entry exists recording admin identity, action, target member, and timestamp (Stage 7, and PRD section 50 — confirmed P0 in Stage 5 despite the broader security spec being deferred).

**Scenario: badge copy matches the resolved wording everywhere**
Given a member has both tracks approved, when their profile is viewed on the member dashboard, member profile, admin directory, admin professional profile, or matching screen, then the badges read exactly "Membership confirmed" and "Credentials reviewed" in every location — not "Verified," not "Church Verified." This is a regression test specifically because that wording was deliberately fixed after drifting once already (see [memory/scope_conflict_brief_vs_stage1.md](memory/scope_conflict_brief_vs_stage1.md)) — worth keeping as a standing check precisely because it already went wrong once.

## What this document doesn't cover

Per-browser/per-device QA matrices, performance/load testing, and security penetration scenarios (Stage 4 items #20's browser/device lists, #23's security spec) are folded into the deferred technical-architecture bucket per [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md) — this document is functional/behavioral acceptance criteria only, provable against the product decisions already made, not infrastructure-dependent testing.


---


<div style="page-break-before: always;"></div>

# Stage 14 — Seed / Demo Data Plan

Written 2026-09-09, by Champion. Item 11 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Dashboards, search, and matching all look and behave differently with 5 records vs. 500 — this document specifies what realistic seed data should look like, both for development/QA and for the actual launch cold-start problem.

Two distinct needs, kept separate since they serve different purposes:

## A. Development/QA seed data — fictional, larger scale

For building and testing against, matching the scale already implied in [stage-3-ux.md](stage-3-ux.md)'s mockup numbers (2,450 members, 1,980 verified, 420 available, 27 opportunities) and used in the published UI artifact.

- **~200-300 fictional member profiles** (not the full 2,450 shown in mockups — that number is illustrative of a mature system, not a QA dataset; 200-300 is enough to exercise pagination, search relevance, and matching without needing a synthetic-data generator). Distributed across [stage-10-taxonomy.md](stage-10-taxonomy.md)'s profession categories, roughly weighted toward the categories a Tanzanian urban congregation would plausibly have more of (Business & Administration, Transport & Logistics, Trade & Technical, Education) over rarer ones (Legal, Healthcare specialists), so the seed data doesn't accidentally imply an unrealistic professional mix.
- **Mixed verification states** — some Confirmed/Reviewed, some Pending, some Needs Correction — so the verification queue (Journey 4) and directory-visibility gate (Stage 7, Stage 13's scenario) can actually be tested against non-trivial data, not an all-verified or all-pending set that hides bugs in the gate logic.
- **Mixed availability** (Open / Selective / Not available) in realistic proportions — not everyone Open, so Stage 9's availability filter has something to filter.
- **A handful of active opportunities**, including at least one that mirrors the founding use case exactly: **3 driver roles, 1 HR Manager role**, matching the original transcript's ask (Journey 1's origin, project-brief.md), so the seed data can demonstrate the actual scenario that started this project, not only generic examples.
- **Applications in every state** of the Application machine (Stage 7) — Applied, Reviewed, Shortlisted, Interview, Selected, Rejected, Withdrawn — so Stage 13's scenarios have real records to run against.

**Reuse, don't reinvent, the names already in use.** The published UI artifact and Stage 3's mockups already established a small fictional cast (John Michael/Mwangi — Civil Engineer; Sarah Kessy/K. — HR Manager; David Mwakalindile — Accountant; Grace Rweyemamu — Driver; ABC Logistics Ltd; Baraka Construction; Kilimo Fresh Distributors). Development seed data should extend this cast rather than invent a disconnected one, so screenshots, this project's documents, and the actual dev environment all show a recognizably consistent world.

## B. Launch seed data — real, not fictional

This is the actual cold-start problem, distinct from QA data and not something this document can populate on its own, since it requires real people's consent and real information.

- **First real profiles should be seeded by Church Admins directly**, not through open self-registration, for the first batch — Stage 6's Journey 1 assumes a member self-registers, but a completely empty directory at public launch undermines the "aha moment" (an admin searches and gets real, explainable results). Recommend: Church Admins identify and directly enter or assist ~20-50 known professionals across a spread of professions before any public "create your profile" announcement, mirroring Stage 4 item #51's own recommended pilot size.
- **The founding opportunity should be the first live one.** The businessman's original ask (drivers, managers, HRs) is the product's actual origin story — if those roles are still open when the system launches, they should be the first real Opportunity created, not a placeholder. If they've already been filled by hand (as separately confirmed in an earlier conversation), the first live opportunity should still be something concrete and real, not a demo placeholder, so the first thing anyone sees in the live system is genuine, not staged.
- **Who does this seeding is not yet named.** Church Admins are confirmed as who verifies and who runs the platform generally (memory: compliance_deferred_to_post_launch.md), but whether the same people do this initial 20-50-profile outreach, or whether it's a separate short-term task, isn't decided. Flag for Champion or the ministry to assign once build is closer to done.

## What this document does not do

Does not generate an actual seed script or fixture file — that's implementation work tied to whatever stack/database is eventually chosen (deferred per the compliance/architecture decision). This document is the content and sizing plan a seed script should be built from, so that work doesn't start from a blank page once the stack is picked.


---


<div style="page-break-before: always;"></div>

# Stage 15 — Logical Data Model

Written 2026-09-09, by Champion. Item 7 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list, flagged there as ambiguous between "genuinely new gap" and "part of the deferred technical-architecture bucket." Resolved here as: **logical model now, physical schema (actual DDL, indexes, a specific database engine's types) after the stack decision.** [stage-2-prd.md](stage-2-prd.md) section 44 names entities and section 45 gives the primary relationship chain; this document turns that into entities, fields, and relationships precise enough for any relational or document database to implement, without committing to which.

This is deliberately not SQL. It's entity/field/relationship, so it survives whichever stack choice comes out of the deferred technical-architecture conversation.

## Core entities

### Member
Fields: id, name, photo, date_of_birth, gender, phone, email, location, church_id (→ Church), branch_id (→ Branch), password_hash, created_at.
Sub-state fields (per [stage-7-state-machines.md](stage-7-state-machines.md)): profile_status (Registered | Profile Complete), membership_status (Not submitted | Pending | Confirmed | Needs Correction | Suspended), credentials_status (Not submitted | Pending | Reviewed | Needs Correction), availability (Open | Selective | Not available).
Relationships: has one Church, has one Branch, has many Education, has many Experience, has many Skill (via a join, see Skill below), has many Certification, has many Document, has many Application, has one VerificationHistory (many records), has many Notification.

### Education
Fields: id, member_id (→ Member), institution, qualification, field_of_study, start_year, end_year, is_current.

### Experience
Fields: id, member_id (→ Member), organization, position, location, start_date, end_date, is_current, description.

### Skill (taxonomy entity, per [stage-10-taxonomy.md](stage-10-taxonomy.md))
Fields: id, name, category, synonyms (array/text).
Join: MemberSkill (member_id, skill_id) — many-to-many, since a member has many skills and a skill belongs to many members.

### Profession (taxonomy entity, per Stage 10)
Fields: id, name, category, synonyms (array/text).
Relationship: Member has one primary_profession_id (→ Profession) — unlike Skill, this is one-to-many from Profession's side (many members share one profession), not a join table, since the PRD treats primary profession as singular per member (section 11).

### Certification
Fields: id, member_id (→ Member), name, issuing_organization, issue_date, expiration_date, document_id (→ Document, nullable).

### Document
Fields: id, member_id (→ Member), type (CV | Certificate | Other), filename, storage_reference (stack-dependent — a URL, key, or path, left abstract here), uploaded_at, size_bytes.

### VerificationHistory
Fields: id, member_id (→ Member), track (Membership | Credentials), action (Approved | Needs Correction), admin_id (→ Admin), note, created_at.
This is both the audit trail (Stage 5's P0 requirement, PRD section 50) and the source of the "needs correction" note shown to members (Journey 2) — one entity serves both needs rather than two overlapping ones.

### Admin
Fields: id, name, email, password_hash, role (Church Admin | Super Admin — per PRD sections 6.2/6.4; Super Admin is architecturally present but has no distinct MVP screens per Stage 5), church_id (→ Church).

### Church / Branch
Fields (Church): id, name.
Fields (Branch): id, church_id (→ Church), name.
Per PRD section 39 and the brief's still-open item ("confirm multi-branch is deliberate"): this model supports multi-branch from day one even if MVP launches with one Church/one Branch — same reasoning the PRD itself gives, cheap to model now, expensive to retrofit.

### Opportunity
Fields: id, title, type (Employment | Church Opportunity | Service — per Stage 5's P0 scope, NOT Project/Business, those are P2), organization_name, location, description, status (Draft | Published | Closed | Completed | Cancelled | Filled — per [stage-7-state-machines.md](stage-7-state-machines.md); Expired dropped per that document's recommendation), headcount_required, created_by (→ Admin), created_at.

### OpportunityRequirement
Fields: id, opportunity_id (→ Opportunity), required_profession_id (→ Profession, nullable — an opportunity might not require a specific profession), min_experience_years, required_education_level, location_required.
Join: OpportunityRequiredSkill (opportunity_id, skill_id) — many-to-many, mirroring MemberSkill.

### Application
Fields: id, member_id (→ Member), opportunity_id (→ Opportunity), status (Applied | Reviewed | Shortlisted | Interview | Selected | Rejected | Withdrawn — per Stage 7, Withdrawn added there), applied_at, status_updated_at, interview_date, interview_time, interview_location, interview_instructions (all nullable, populated only once status reaches Interview — per [stage-8-connection-model.md](stage-8-connection-model.md)'s decided split: logistics shared in-platform via these fields, actual back-and-forth communication stays off-platform).

### ApplicationOutcome
Fields: id, application_id (→ Application, one-to-one), outcome (Hired | Contract awarded | Project completed | Service delivered | Connected | Not selected | Cancelled | No outcome — per PRD section 46), recorded_by (→ Admin), recorded_at, notes (admin-internal, never shown to the member per Stage 13's rejection scenario).
Kept as a separate entity from Application itself (rather than just an outcome field on Application) because PRD section 46 treats Outcome as its own concept feeding a future impact dashboard (Stage 5, P2) — separating it now means that future analytics work reads from a stable entity instead of overloading Application's own status field for two different purposes (workflow state vs. final business outcome).

### Notification
Fields: id, member_id (→ Member, nullable — reserved for a future admin-facing notification per Stage 12's "not P0" note), type (per [stage-12-notification-copy.md](stage-12-notification-copy.md)'s event list), body_text, related_entity_type, related_entity_id (polymorphic reference — an opportunity, an application, a verification record), read_at (nullable), created_at.

## The primary relationship chain (restated from PRD section 45, now with real foreign keys)

```
Member ──1:N──> Education, Experience, Certification, Document
Member ──M:N──> Skill (via MemberSkill)
Member ──N:1──> Profession (primary_profession_id)
Member ──1:N──> VerificationHistory
Member ──1:N──> Application

Opportunity ──1:1──> OpportunityRequirement
OpportunityRequirement ──N:1──> Profession
OpportunityRequirement ──M:N──> Skill (via OpportunityRequiredSkill)

Application ──N:1──> Member
Application ──N:1──> Opportunity
Application ──1:1──> ApplicationOutcome (once an outcome exists)

Church ──1:N──> Branch ──1:N──> Member
Church/Branch ──1:N──> Admin
```

## What this model deliberately excludes (per Stage 5's P2 list)

No Project or ProjectRole entities (PRD's own Project management module is P2). No Organization/Employer-account entity distinct from the free-text organization_name field on Opportunity — external employer self-service accounts are P2 (Stage 4 item #26's resolved MVP-A approach), so there's no login-capable Employer entity yet, just a descriptive string naming who the opportunity is for. No messaging/conversation entities (Stage 8's connection model explicitly keeps contact off-platform). Adding any of these later is a schema extension, not a rework, since nothing above assumes their absence in a way that would need undoing.

## What this document does not decide

Relational vs. document database, specific column types, indexing strategy, and physical storage_reference format for Document — all stack-dependent, all deferred per [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md). This logical model should translate cleanly into either a relational schema (the entities above map almost directly to tables) or a document model (Member could reasonably embed Education/Experience/Skill as subdocuments rather than separate collections) — that translation is exactly the kind of decision that waits for the stack choice, not something to pre-empt here.


---


<div style="page-break-before: always;"></div>

# Stage 16 — API Shape

Written 2026-09-09, by Champion. Item 9 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. Not a framework-specific API implementation (that's downstream of the deferred stack decision, per [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md)) — this is the *shape* of the contract between frontend and backend: what operations exist, grouped by the entities in [stage-15-data-model.md](stage-15-data-model.md) and the journeys in [stage-6-user-journeys.md](stage-6-user-journeys.md). Written as REST-style paths for concreteness, since that's the easiest shared vocabulary regardless of what actually implements it (REST, GraphQL, or RPC) — the operations list matters more than the exact verb/path convention.

## Auth

```
POST   /auth/register          Journey 1, step 2
POST   /auth/login
POST   /auth/logout
POST   /auth/password/reset-request
POST   /auth/password/reset
GET    /auth/session            check current session validity — needed for Stage 11's "session expired" handling
```

## Member profile (self-service)

```
GET    /members/me
PATCH  /members/me                          personal info, availability toggle (Journey 3)
POST   /members/me/education
PATCH  /members/me/education/:id
DELETE /members/me/education/:id
POST   /members/me/experience
PATCH  /members/me/experience/:id
DELETE /members/me/experience/:id
POST   /members/me/skills                    attach a Skill (Stage 15's MemberSkill join)
DELETE /members/me/skills/:skillId
POST   /members/me/certifications
PATCH  /members/me/certifications/:id
DELETE /members/me/certifications/:id
POST   /members/me/documents                  CV/certificate upload (Journey 1, step 3)
DELETE /members/me/documents/:id
POST   /members/me/submit-for-verification     Journey 1, step 4 — triggers both tracks → Pending (Stage 7)
```

## Professional directory (admin-facing read)

```
GET    /professionals                          list/search — query params: profession, skill,
                                                 location, min_experience, availability, verification
GET    /professionals/:id                       full profile, admin view (PRD section 24)
```

Deliberately a separate namespace from `/members` even though it's largely the same underlying data — `/members/me` is self-service, `/professionals` is the admin-facing, verification-gated, filtered view (per Stage 7's directory-visibility gate: this endpoint should only ever return members where both verification tracks are Confirmed/Reviewed, enforced server-side, not left to the frontend to filter).

## Verification

```
GET    /admin/verification-queue                filterable: All | Pending | Approved | Needs correction (PRD section 23)
POST   /admin/members/:id/verify-membership      body: { decision: Approved|NeedsCorrection, note? }
POST   /admin/members/:id/verify-credentials      body: { decision: Approved|NeedsCorrection, note? }
GET    /admin/members/:id/verification-history    (Stage 15's VerificationHistory, also the audit trail)
```

Kept as two separate endpoints (verify-membership, verify-credentials) rather than one generic `/verify`, since Stage 7 established the two tracks are independently approved — a single combined endpoint would make it easy to accidentally couple them.

## Opportunities

```
GET    /opportunities                            member-facing browse (Journey 1, step 10) — only Published
GET    /opportunities/:id
POST   /admin/opportunities                       create (Journey 5, steps 1-2) — starts as Draft
PATCH  /admin/opportunities/:id                    edit while Draft
POST   /admin/opportunities/:id/publish            Draft → Published (Stage 7)
POST   /admin/opportunities/:id/close              Published → Closed. Blocks new applications only —
                                                    per Stage 7's decided behavior, does NOT touch
                                                    existing applications automatically
POST   /admin/opportunities/:id/applications/close-remaining
                                                    admin's explicit bulk action (Stage 7) to reject
                                                    every still-open application on a closed opportunity —
                                                    separate from /close itself, since closing and
                                                    rejecting-in-bulk are two different admin decisions,
                                                    not one action
POST   /admin/opportunities/:id/cancel
GET    /admin/opportunities/:id/matches            Journey 5, step 4 — runs Stage 9's matching algorithm,
                                                    returns ranked results WITH the per-criterion
                                                    breakdown (Stage 9's explainability requirement is
                                                    a response-shape requirement, not just a UI choice —
                                                    the breakdown must come from the API, not be
                                                    reconstructed client-side)
```

## Applications

```
POST   /opportunities/:id/apply                   member-facing (Journey 1, step 10) — server must
                                                    reject if already applied (Stage 13's duplicate-
                                                    application scenario) and reject if member isn't
                                                    verified (Stage 11's verification-gate error)
GET    /members/me/applications                    My Applications (Journey 1, step 11)
GET    /admin/opportunities/:id/applications        per-opportunity list (Journey 7)
PATCH  /admin/applications/:id/status               body: { status: Reviewed|Shortlisted|Interview|
                                                      Selected|Rejected } — server enforces the Stage 7
                                                      state machine's legal transitions, not any status
                                                      to any status
POST   /admin/applications/:id/shortlist            convenience endpoint over the PATCH above — kept
                                                      separate because Stage 8's contact-info visibility
                                                      change is a meaningful side effect worth its own
                                                      explicit action, not buried in a generic status PATCH
GET    /admin/applications/:id                       full detail — contact info only included in the
                                                      response once status is Shortlisted or later
                                                      (Stage 8, Stage 13's shortlist scenario)
```

## Notifications

```
GET    /members/me/notifications
PATCH  /members/me/notifications/:id/read
```

## Reference/taxonomy data (Stage 10)

```
GET    /professions                                for the searchable onboarding field (Journey 1, step 3)
GET    /skills?profession=:professionId             suggested-skills-per-profession (Stage 10)
GET    /industries
```

Read-only, admin-managed elsewhere (not exposed as a public write endpoint in MVP — growing the taxonomy is an operational task, not a member-facing feature, per Stage 10's note that an unlisted profession should fall back to free text rather than blocking registration).

## What this document does not decide

Authentication mechanism (session cookies vs. tokens), pagination convention, error response shape, versioning — all implementation details that follow from the stack choice. This document establishes *what operations must exist and what each one's meaningful side effects are* (the gates, the state-transition rules, the response-shape requirements like Stage 9's explainability), which holds regardless of which framework ends up implementing them.


---


<div style="page-break-before: always;"></div>

# Stage 17 — Screen-by-Screen Functional Specification

Written 2026-09-09, by Champion. Item 3 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list — the largest single item. [stage-3-ux.md](stage-3-ux.md) describes every screen narratively (layout, tone, content). This document turns each **P0** screen (per [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md)) into inputs, actions, permissions, states, and responsive behavior — precise enough to build without re-deriving decisions from five other documents each time.

P1/P2 screens (Kanban view, impact dashboard, employer portal, etc.) are not specified here — building them out ahead of their feature tier would contradict Stage 5's freeze. Where a screen name differs slightly between Stage 3 and the source blueprint, Stage 3's naming is used, since it's this project's own document.

Each spec follows one shape: **Purpose · Inputs · Actions · Permissions · States · API · Responsive.**

---

## Member screens

### Registration

**Purpose:** create an account, nothing more (Stage 3: "don't ask for their entire CV during registration").
**Inputs:** first name, last name, phone or email, password, confirm password.
**Actions:** Create account → `POST /auth/register`, redirects to profile onboarding Step 1. Link to Sign in.
**Permissions:** public/unauthenticated.
**States:** default; inline validation errors per field (weak password, mismatched confirm, duplicate phone/email per [stage-11-states-catalog.md](stage-11-states-catalog.md)); submitting (button disabled, "Creating account…").
**API:** `POST /auth/register` ([stage-16-api-shape.md](stage-16-api-shape.md)).
**Responsive:** single-column form at all widths, no layout branching needed.

### Profile onboarding (8 steps)

**Purpose:** build the P0 profile fields, stepped per Stage 3 section 9, not one long form.
**Inputs, by step:** 1. Personal info (photo, DOB, gender, location) · 2. Profession (searchable field against `GET /professions`, Stage 16) · 3. Employment status + years experience · 4. Education (repeatable: institution, qualification, field, years) · 5. Skills (tag entry, suggested set from `GET /skills?profession=`) · 6. CV upload (PDF/DOC/DOCX, size limit per Stage 11) · 7. Availability (Open/Selective/Not available) · 8. Review — read-only summary of all above.
**Actions:** Next/Back per step (client-side, no API call until final submit); on Step 8, "Submit for verification" → `POST /members/me/submit-for-verification`. Each step's data auto-saves as entered (`PATCH /members/me`, `POST /members/me/education` etc.) so abandonment mid-flow doesn't lose data (Stage 13's resume scenario).
**Permissions:** authenticated member, own profile only, only reachable while profile_status = Registered.
**States:** progress indicator per Stage 3 (`● ○ ○ ○ ○ ○ ○ ○`); resumed mid-flow (Stage 13); Step 6 upload failure/wrong-type/too-large (Stage 11); Step 8 submit blocked if a P0 field is missing, inline naming which one (Stage 13's submission-blocked scenario).
**API:** per-step PATCH/POST calls listed under Inputs above; final `POST /members/me/submit-for-verification`.
**Responsive:** single column, full-width steps at all breakpoints — this is the one flow where desktop and mobile should look nearly identical, since Stage 3 explicitly designs onboarding mobile-first for everyone, not just phone users.

### Member Dashboard

**Purpose:** answer Stage 3 section 11's four questions — how am I doing, am I verified, am I available, what's relevant to me.
**Inputs:** none (read-only view).
**Actions:** "Complete profile" (if incomplete) → profile edit; "Update" on availability → inline toggle, `PATCH /members/me`; "View opportunity" per card → Opportunity Detail.
**Permissions:** authenticated member, own dashboard only.
**States:** normal (populated); empty "Opportunities for you" (Stage 11's copy) if no matches yet — expected and common for a newly-verified member with a niche profession, not necessarily a bug; loading skeleton on first paint.
**API:** `GET /members/me`, `GET /opportunities` (filtered/ranked for this member — same matching logic as admin search, applied from the member's own profile as the implicit query).
**Responsive:** desktop: profile card + status cards side by side, opportunity cards in a 3-column grid (per the published UI artifact). Mobile: stacked single column, opportunity cards full-width.

### Professional Profile (own)

**Purpose:** member's view of their own profile as employers/admins will see it, plus edit access.
**Inputs:** none directly (view); "Edit profile" routes to per-section edit forms reusing onboarding's field-level inputs.
**Actions:** Edit profile (per section, not a full re-onboarding); download own CV.
**Permissions:** authenticated member, own profile.
**States:** verification badges shown per current track status (Stage 7) — both badges, Confirmed/Reviewed, Pending, or Needs Correction, using [stage-3-ux.md](stage-3-ux.md)'s resolved copy exactly ("Membership confirmed" / "Credentials reviewed"), never "Verified" alone (Stage 13's regression scenario exists specifically for this).
**API:** `GET /members/me` plus the per-section PATCH/POST/DELETE endpoints under Inputs above.
**Responsive:** desktop: header block + two-column body (experience/skills left, education/documents right, per the published artifact). Mobile: header block, then each section as a tappable row that opens its own screen (Stage 3 section 35's explicit mobile pattern — not a shrunk two-column layout).

### Opportunities (browse)

**Purpose:** member-facing search/browse of open opportunities.
**Inputs:** search text, filters (type, location — per Stage 3 section 15; profession/experience filters are less useful here since the member's own profile already implies relevance).
**Actions:** View opportunity per card.
**Permissions:** authenticated member, verified or not (browsing is fine for an unverified member; applying is not — see Opportunity Detail below).
**States:** normal; empty (Stage 11); loading.
**API:** `GET /opportunities`.
**Responsive:** grid (3-col desktop, per artifact) collapsing to single column on mobile; filters collapse into a drawer/sheet on mobile rather than an inline row (Stage 4 item #31's explicit responsive rule, not yet stated elsewhere in this project until now).

### Opportunity Detail

**Purpose:** full opportunity info plus the member's own match breakdown against it.
**Inputs:** none.
**Actions:** Apply → `POST /opportunities/:id/apply`.
**Permissions:** authenticated member. **Apply is blocked if the member isn't fully verified** (both tracks) — Stage 11's error copy ("Complete your verification to apply") — and blocked if already applied (Stage 11/13's duplicate scenario). Both are server-enforced, not just hidden client-side.
**States:** default; Apply button disabled + explanatory copy if unverified; disabled + "Already applied — [view status]" if a prior application exists; opportunity Closed/Cancelled shows a closed banner and no Apply button (Stage 11).
**API:** `GET /opportunities/:id`, `POST /opportunities/:id/apply`.
**Responsive:** desktop: two-column (description/requirements left, match breakdown card right, per the published artifact's HR Manager detail layout). Mobile: single column, match breakdown moves below requirements.

### Applications (My Applications)

**Purpose:** track every application's status.
**Inputs:** none.
**Actions:** View per application → detail or back to Opportunity Detail; none are editable once submitted (no withdraw button in this list — see note).
**Permissions:** authenticated member, own applications only.
**States:** table/list per status (Applied/Reviewed/Shortlisted/Interview/Selected/Rejected/Withdrawn, per Stage 7); empty (Stage 11).
**API:** `GET /members/me/applications`.
**Responsive:** table on desktop, cards on mobile (Stage 3's general table→card responsive rule, section 21).
**Note:** Stage 7 introduced Withdrawn as a state but no screen in Stage 3's inventory has a "Withdraw" action. This screen is the natural place for it (a Withdraw button on Applied/Reviewed/Shortlisted rows, per Stage 7's recommendation not to allow it after Interview) — **flagged as a small addition this document is making to the screen inventory, not something Stage 3 specified.**

### Notifications

**Purpose:** list of in-app notifications (Stage 12's copy), actionable.
**Inputs:** none.
**Actions:** tap a notification → routes to its related entity (opportunity, application, verification status) per Stage 15's Notification.related_entity fields; mark as read happens automatically on open.
**Permissions:** authenticated member, own notifications.
**States:** unread (bold/highlighted) vs. read; empty ("You're all caught up," Stage 11).
**API:** `GET /members/me/notifications`, `PATCH /members/me/notifications/:id/read`.
**Responsive:** list at all widths, no layout branching needed.

---

## Admin screens

### Admin Login

**Purpose:** separate from member login per Stage 3's inventory (item #25), though it may share the same underlying auth endpoint with a role check.
**Inputs:** email, password.
**Actions:** Sign in → `POST /auth/login`, server returns role; if role isn't Admin/Super Admin, redirect to member experience rather than showing an admin-specific error (avoids leaking who has admin access).
**Permissions:** public/unauthenticated until login succeeds.
**States:** default; invalid credentials (Stage 11).
**Responsive:** single-column form.

### Admin Dashboard

**Purpose:** Stage 3 section 20/55's overview — KPIs plus "needs your attention."
**Inputs:** none.
**Actions:** each "needs attention" tile links to its queue (Pending verification → Verification Queue; New applications → relevant Opportunity's application list).
**Permissions:** Church Admin, Super Admin.
**States:** normal; the published artifact's mockup numbers (2,450 members etc.) are illustrative — a freshly-launched instance should show real, likely small, numbers without looking broken (zero-state KPI tiles just show 0, not an error).
**API:** aggregate counts — likely a dedicated summary endpoint, not itemized here since it's a read-only aggregation of entities already defined in Stage 15/16.
**Responsive:** KPI grid 4-column desktop → 2-column tablet → single column mobile (Stage 3 section 36's admin-mobile pattern: condensed cards with direct action links).

### Professionals (Directory)

**Purpose:** the most-used admin screen (Stage 3 section 21) — search/filter the verified pool.
**Inputs:** search text, filters (profession, location, experience, availability — verification filter is largely moot since only both-verified members appear at all, per Stage 7's gate, so a "verification" filter here would only ever show one value; **flagged as a discrepancy with Stage 3's original filter list**, which included a Verification filter — recommend dropping it from the UI since Stage 7's later decision makes it non-functional, unless partial-visibility gets revisited).
**Actions:** open a professional's full profile; shortlist directly against a chosen opportunity (Journey 6).
**Permissions:** Church Admin, Super Admin only — never a member, never (in MVP) an external employer.
**States:** normal (table); empty search results (Stage 11); loading skeleton.
**API:** `GET /professionals`.
**Responsive:** table (desktop) → cards (mobile), per Stage 3's stated pattern.

### Admin Professional Profile

**Purpose:** an admin's full view of one member, including verification and application history.
**Inputs:** none (view); Notes field appears only in the context of a verification decision (see Verification Review below), not here.
**Actions:** Contact (only enabled once Shortlisted somewhere, per [stage-8-connection-model.md](stage-8-connection-model.md) — otherwise disabled/hidden); Shortlist (against a chosen active opportunity).
**Permissions:** Church Admin, Super Admin. Contact info (phone/email) only rendered in the response/UI if this member has at least one Shortlisted-or-later application (Stage 8, Stage 16's API note) — this is a server-side response-shape rule, not just a hidden UI element.
**States:** verification badges (Stage 3's resolved copy); sections per PRD section 24 (experience, education, skills, certifications, documents, verification history, applications).
**API:** `GET /professionals/:id`.
**Responsive:** two-column desktop, stacked mobile — same general pattern as the member's own profile screen.

### Verification Queue

**Purpose:** Stage 3 section 23 — the trust-model's operational core.
**Inputs:** tab filter (All / Pending / Approved / Needs correction).
**Actions:** open a member's Verification Review.
**Permissions:** Church Admin, Super Admin.
**States:** count badge per tab; empty "You're all caught up" (Stage 11) on the Pending tab specifically — a genuinely good state, not a failure.
**API:** `GET /admin/verification-queue`.
**Responsive:** list at all widths; each row is compact enough not to need a table→card transformation.

### Verification Review

**Purpose:** Stage 3 section 24 — where Journey 4's actual approve/correct decisions happen.
**Inputs:** Notes field (free text, tied to a correction decision).
**Actions:** Approve Membership → `POST /admin/members/:id/verify-membership`; Approve Credentials → `POST /admin/members/:id/verify-credentials`; Request correction on either (requires — or per Stage 11's soft-warning recommendation, strongly nudges toward — a note).
**Permissions:** Church Admin, Super Admin.
**States:** each track shown independently (Pending/Confirmed/Needs Correction, per Stage 7 — this screen is the one place both tracks' independence must be visually obvious, since Journey 4 depends on admins understanding they're two separate decisions, not one).
**API:** the two verify-* endpoints ([stage-16-api-shape.md](stage-16-api-shape.md)).
**Responsive:** desktop: two-column (profile left, verification controls right, per Stage 3 section 24). Mobile: stacked, verification controls below the full profile rather than beside it.

### Opportunities (Admin list/manage)

**Purpose:** Stage 3 section 25.
**Inputs:** none directly; "Create opportunity" routes to the creation flow.
**Actions:** Create opportunity; Manage (open) an existing one → its detail/candidate view.
**Permissions:** Church Admin, Super Admin.
**States:** status badges per Stage 7 (Draft/Published/Closed/Completed/Cancelled/Filled — using "Active" as Published's display label per Stage 7's naming note).
**API:** `GET /admin/opportunities` (implied, not explicitly listed in Stage 16 but follows the same pattern as the member-facing GET).
**Responsive:** list/table desktop, cards mobile.

### Create Opportunity

**Purpose:** the 5-step guided creation flow, Stage 3 section 26.
**Inputs, by step:** 1. Type (Employment / Church opportunity / Service — Project/Business NOT offered, P2 per Stage 5) · 2. Title, organization, location, description · 3. Requirements (profession, experience, education, skills, headcount) · 4. Review · 5. Publish.
**Actions:** Next/Back; Save as Draft (implicit — the entity starts in Draft per Stage 7 until explicitly published, so a partial creation can be abandoned and resumed, same resume principle as member onboarding); Publish → `POST /admin/opportunities/:id/publish`.
**Permissions:** Church Admin, Super Admin.
**States:** step progress; validation per step (can't reach Publish without required fields, mirroring the member onboarding's submission-blocked pattern).
**API:** `POST /admin/opportunities` (creates as Draft), `PATCH /admin/opportunities/:id` (per-step edits), `POST /admin/opportunities/:id/publish`.
**Responsive:** single column at all widths, same reasoning as member onboarding.

### Find Matches (Matching screen)

**Purpose:** Stage 3 section 27 — "potentially the most impressive screen in the entire product," and the literal "aha moment" (Stage 4 item #52).
**Inputs:** none beyond the already-published opportunity's own requirements.
**Actions:** Shortlist per candidate row; View full profile per candidate.
**Permissions:** Church Admin, Super Admin.
**States:** result count ("24 potential matches"); each row shows the full per-criterion breakdown per [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md) — **this is a hard requirement, not a nice-to-have**: a version of this screen that only shows a percentage without the breakdown does not meet spec; empty (Stage 11's "no matching professionals" copy, distinct from a zero-result search).
**API:** `GET /admin/opportunities/:id/matches`.
**Responsive:** table desktop, cards mobile — match breakdown (the ✓/✕ grid) needs its own compact mobile treatment since a 6-column checkmark grid doesn't fit a phone width; stack the criteria vertically per candidate card instead of as table columns.

### Application Management (per opportunity)

**Purpose:** Stage 3 section 30 — funnel view of one opportunity's applications.
**Inputs:** none (view); status changes happen per-application, not in bulk, for MVP (Kanban bulk-drag view is explicitly P1 per Stage 5).
**Actions:** open an application → change status (`PATCH /admin/applications/:id/status`, or the dedicated Shortlist convenience endpoint per Stage 16); record outcome once status reaches Selected/Rejected.
**Permissions:** Church Admin, Super Admin.
**States:** funnel counts per status; a simple sorted/filtered list stands in for the Kanban board at MVP (Stage 5's explicit P1 deferral of the Kanban view — this screen should still work, just without drag-and-drop).
**API:** `GET /admin/opportunities/:id/applications`, `PATCH /admin/applications/:id/status`.
**Responsive:** list/table desktop, cards mobile.

---

## What this document does not specify

P1/P2 screens (Kanban application board, impact dashboard, employer portal, project management screens, privacy/visibility settings page) — building functional specs for features not yet in scope would front-run Stage 5's freeze. If any of those get promoted to P0 later, this document's format (Purpose · Inputs · Actions · Permissions · States · API · Responsive) is the template to extend it with, not a new format to invent.


---


<div style="page-break-before: always;"></div>

# Stage 18 — Development Milestones

Written 2026-09-09, by Champion. Item 14 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. A vertical-slice breakdown of the P0 scope ([stage-5-mvp-freeze.md](stage-5-mvp-freeze.md)) into buildable, demoable milestones — each one should produce something that actually runs, not an internal layer nobody can see yet.

Not dated (no team, no stack, no velocity known yet — dating this would be inventing precision that doesn't exist). Ordered by dependency: each milestone assumes the ones before it are done, and names what it unlocks.

## M1 — Auth + skeleton

Registration, login, logout, password reset. Member and Admin login as distinct entry points (screens per [stage-17-screen-specs.md](stage-17-screen-specs.md)). The app shell (sidebar nav, topbar) from [stage-3-ux.md](stage-3-ux.md), empty of real content.
**Demoable as:** someone can create an account and log in. Nothing else works yet.

## M2 — Member profile

Full 8-step onboarding, profile editing, CV/document upload, availability toggle. Backed by [stage-15-data-model.md](stage-15-data-model.md)'s Member/Education/Experience/Skill/Certification/Document entities and [stage-16-api-shape.md](stage-16-api-shape.md)'s `/members/me/*` endpoints.
**Demoable as:** a member can build a complete profile end to end (Journey 1, steps 1-5). No verification, no matching yet — the profile just sits in Registered/Profile Complete.

## M3 — Verification

Verification Queue, Verification Review, the two independent tracks (Membership/Credentials) and their state machine ([stage-7-state-machines.md](stage-7-state-machines.md)), audit trail (VerificationHistory), member-facing correction flow (Journey 2).
**Demoable as:** an admin can review M2's test profiles and approve/reject them; a member sees their badges change and can respond to a correction request. **This is the first milestone where the trust model itself — the actual point of the product — becomes visible**, even before any opportunity exists.

## M4 — Directory

Professional directory (search/filter), admin professional profile view, the both-tracks-required visibility gate ([stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)'s directory-visibility scenario is the milestone's core acceptance test).
**Demoable as:** an admin can search and find M3's verified members. Still no opportunities — this proves the "know your people" half of the product independent of the "connect them to opportunities" half.

## M5 — Opportunities

Create Opportunity (5-step flow), the Opportunity state machine (Draft→Published→Closed/Cancelled/Filled), member-facing browse/detail screens.
**Demoable as:** an admin can publish an opportunity (ideally the actual founding case — 3 drivers, HR Manager, per [stage-14-seed-data.md](stage-14-seed-data.md)) and a member can view it. No matching or applying yet.

## M6 — Matching

[stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s weighted formula, the Find Matches screen with per-criterion breakdown, `GET /admin/opportunities/:id/matches`.
**Demoable as:** **the "aha moment" itself** — an admin publishes an opportunity, hits Find Matches, and sees a ranked, explainable list of M4's verified professionals. This is the single most important milestone to get right and to actually demo to the pastor/CEO once it's working, since it's the concrete proof the concept works, not just a working CRUD app.

## M7 — Applications

Apply flow (with the verification-gate and duplicate-application checks from [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)), My Applications, Application Management (admin), the full Application state machine, Shortlist and its Stage 8 contact-info-visibility side effect, outcome recording.
**Demoable as:** the complete loop — member applies, admin shortlists (contact info unlocks), records an outcome. This closes Journey 7 end to end.

## M8 — Notifications

In-app notifications for every trigger in [stage-12-notification-copy.md](stage-12-notification-copy.md), Notifications screen, read/unread state.
**Demoable as:** every prior milestone's actions (verified, shortlisted, selected, correction needed) now actually notify the member, instead of requiring them to check manually.

## M9 — Admin dashboard + polish pass

Admin Dashboard's KPIs and "needs attention" tiles, empty/loading/error states from [stage-11-states-catalog.md](stage-11-states-catalog.md) applied across every screen built in M1-M8 (many will have been stubbed with basic states during their own milestone; this is the pass that makes sure none were skipped), responsive behavior verified against [stage-17-screen-specs.md](stage-17-screen-specs.md)'s per-screen responsive notes.
**Demoable as:** the product feels finished, not just functional — this is the milestone that turns "it works" into "it's ready for real people."

## M10 — QA, seed data, launch prep

Run every scenario in [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md) against the built system. Load [stage-14-seed-data.md](stage-14-seed-data.md)'s development dataset for a final realistic-scale check (does the directory/matching still feel right at 200-300 profiles, not just the 5-10 used during M1-M9 development). Begin the real launch seeding process (Stage 14 section B) — Church Admins identifying the first 20-50 real professionals — in parallel with this milestone, not after it, since that outreach takes real time independent of engineering.
**Demoable as:** ready for the pilot (Stage 4 item #51's recommended 20-50 member pilot before opening to the whole congregation).

---

## What's deliberately not a milestone here

Technical architecture setup (repo structure, environments, CI/deploy pipeline, monitoring) isn't milestone 0 in this list, because it's part of the deferred technical-architecture decision, not this project's product-milestone sequence — whoever picks up the stack decision should slot an M0 in front of M1 covering exactly that, once the stack is chosen. This document assumes that groundwork exists by the time M1 starts, it doesn't plan it.

## Dependency notes worth flagging

- M6 (Matching) cannot be meaningfully demoed without M3 (Verification) and M4 (Directory) already producing real verified profiles — there's no shortcut to skip ahead to the "impressive" milestone.
- M7's Stage 8 contact-info-visibility behavior needs M3's verification gate and M6's matching both already correct, since it's layered on top of the same Member/Application data those milestones establish.
- Nothing above blocks starting the real launch-seeding conversation (Stage 14 section B — who does the outreach, is it Church Admins) well before M10; that's a people/process decision independent of engineering progress and can run in parallel from M3 onward once the trust model is visibly working.


---


<div style="page-break-before: always;"></div>

# Stage 19 — Technical Architecture

Written 2026-09-09. Reverses the earlier deferral: an external reviewer of [COMBINED-SPEC.md](../COMBINED-SPEC.md) argued the technology stack, database, auth, storage, and hosting approach can't reasonably wait until after launch, even at a deliberately pragmatic, non-over-engineered level — you can't code M1 without something to code it in. Champion agreed. This reverses that one piece of [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md) — **PDPA/employment-agency compliance, dispute-handling design, and detailed infrastructure hardening (backups, monitoring depth, CI maturity) stay deferred**, but the foundational stack choice does not.

## The stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + React + TypeScript | One codebase serves member and admin web UI on desktop and mobile — no separate native apps |
| UI | Tailwind CSS + shadcn/ui | Fast, consistent component system to build [stage-3-ux.md](stage-3-ux.md)'s design system on top of, rather than hand-building every button/modal |
| Forms | React Hook Form + Zod | The 8-step onboarding and 5-step opportunity creation flows ([stage-17-screen-specs.md](stage-17-screen-specs.md)) are genuinely complex forms — validation, autosave, repeatable records (multiple Education/Experience entries) |
| Backend | Next.js Server Actions / Route Handlers, TypeScript | Frontend and backend in one project for a small team; matches [stage-16-api-shape.md](stage-16-api-shape.md)'s operation list directly |
| Database | PostgreSQL via Supabase | [stage-15-data-model.md](stage-15-data-model.md)'s entities are highly relational (Member → Education/Experience/Skill/Certification, Opportunity → Requirements/Applications) — a relational database is the natural fit, not a document store |
| Authentication | Supabase Auth | Registration, login, logout, password reset, session management — covers Stage 17's Auth screens directly |
| File storage | Supabase Storage | CVs, certificates, profile photos (Stage 15's Document entity's storage_reference field, previously left abstract, now concrete: a Supabase Storage path) |
| Authorization | PostgreSQL Row Level Security + server-side checks | Enforced at the database level, not just hidden in the frontend — matters because this project handles real personal data (education, employment history, phone, email, documents) even though PDPA registration itself is still deferred; the technical safeguard doesn't need to wait on the paperwork |
| Search | PostgreSQL search | Sufficient at MVP scale (Stage 14's seed-data sizing: 200-300 dev records, low thousands at real scale) — no Elasticsearch/Typesense until usage actually demands it |
| Matching engine | Custom TypeScript module implementing [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s formula directly | Explainable by construction — the algorithm doc's per-criterion breakdown requirement is easiest to satisfy when the scoring logic is plain, readable code, not a black-box service |
| Notifications | Postgres table + in-app delivery | Matches the already-decided in-app-only scope ([project-brief.md](project-brief.md)) |
| Testing | Vitest (unit — matching logic, validation) + Playwright (browser — the full journeys from [stage-6-user-journeys.md](stage-6-user-journeys.md), cross-browser) | Matches this workspace's own standing convention (root CLAUDE.md: Vitest is the default test runner for any TS/JS project here) |
| Hosting | Vercel (app) + Supabase (data/auth/storage) | Predictable deploy from GitHub, minimal ops overhead for a small team |
| Source control | GitHub | |
| Monitoring | Sentry | Errors/performance, once real traffic exists |
| Analytics | PostHog (or similar) | Product usage — separate from the Impact analytics Stage 5 already marks P2; this is developer-facing usage data, not the pastor-facing impact dashboard |
| Domain | A subdomain of the ministry's own domain (e.g. `network.` or `professionals.` prefix) rather than a standalone domain | Reinforces this is a church initiative, not an unrelated product — ties back to [project-brief.md](project-brief.md)'s core point that the trust model, not the software, is the differentiator |

## The philosophy behind it

One codebase, one web application, one database, one auth system, responsive everywhere, security enforced at the database/server level, not just the frontend. No native iOS/Android apps (Stage 5 already marked a dedicated mobile app P2 — "the responsive web experience covers this," this stack makes that explicit rather than just asserted). No AI matching, no Elasticsearch, no microservices, no Kubernetes — all of it deliberately deferred as unnecessary complexity for this scale, consistent with Stage 5's non-goals and Stage 9's explicit "don't introduce complicated AI" stance.

## What this explicitly rules out, matching decisions already on record

- Separate native mobile apps — Stage 5, P2.
- AI-assisted matching — Stage 5, P2; Stage 9 already specified a plain weighted formula.
- A dedicated messaging system — Stage 5, P2; Stage 8's connection model already kept contact off-platform for MVP.
- WordPress, Firebase-as-primary-database, MongoDB, microservices, a separate Node backend from the frontend — none fit this project's relational data model or small-team scale.

## Architecture diagram

```
                       USERS
                         │
          ┌──────────────┴──────────────┐
       Desktop                        Mobile
   (Chrome/Edge/Safari)          (Safari/Chrome)
          │                             │
          └──────────────┬──────────────┘
                         │
                    HTTPS / Web
                         │
                 ┌───────▼───────┐
                 │    Next.js    │
                 │  TypeScript   │
                 │  Member UI    │
                 │  Admin UI     │
                 │  Server logic │
                 └───────┬───────┘
                         │
                ┌────────┼────────┐
                ▼        ▼        ▼
             Auth      DB       Storage
                │        │        │
                └────────┴────────┘
                      Supabase
                    (PostgreSQL)
```

Deploy path: GitHub → CI/tests → Vercel → production.

## What this still doesn't decide — genuinely deferred, not by oversight

Per the surviving parts of [memory/compliance_deferred_to_post_launch.md](memory/compliance_deferred_to_post_launch.md): PDPA registration, employment-agency legal status, dispute/outcome-handling workflow design, and the *detailed* security/backup/monitoring specification (beyond "RLS + server-side checks + Sentry" named above as the baseline). Those wait until the system is confirmed running. The stack itself does not — that's the change this document makes.

## Next step, per the reviewer's own recommendation

A "Technical Architecture v1" document locking project structure (repo layout, folder conventions), the actual database schema translated from [stage-15-data-model.md](stage-15-data-model.md)'s logical model into real Postgres tables/columns/indexes, the authentication flow in Supabase Auth terms, environment setup (dev/staging/production), and how the member and admin applications share code — recommended before M1 coding starts.

**Received and filed:** [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md). Covers exactly this. M1 is ready to start.


---


<div style="page-break-before: always;"></div>

# Stage 20 — Technical Architecture v1

Received 2026-09-10, following [stage-19-technical-architecture.md](stage-19-technical-architecture.md)'s own closing section naming exactly this as the next artifact: repo structure, physical database schema, Supabase Auth flow, environments, migrations, testing strategy, deployment. This is that document. Kept close to as-received, with only heading levels adjusted to nest under this file's title and its numbering continued from Stage 19's "Section" framing translated into this document's own 1-45 numbering, left as originally written.

**Consistency check against prior decisions (Champion, 2026-09-10):** this document's Section 23 (opportunity closing) matches [stage-7-state-machines.md](stage-7-state-machines.md)'s decided behavior exactly (block new applications, leave existing ones untouched, admin explicitly chooses what happens next) — no conflict. Its Section 42 independently re-derives the same three items already tracked as genuinely open (verification criteria, reverification-on-edit, opportunity-closing) — two of those three are actually already decided as of Stage 7/8 (reverification and opportunity-closing), this document's Section 42 predates seeing that resolution and should be read as historical framing, not as reopening them. Verification criteria remains the one real open item.

---

## 1. Architecture decision

The platform is built as a **responsive full-stack web application**. Members access it through a browser on Windows, macOS, Linux, Android, iPhone/iPad, ChromeOS. No native Android or iOS application for MVP (matches [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md)'s P2 classification of a dedicated mobile app).

```
                    INTERNET
                       │
                       ▼
              ┌─────────────────┐
              │   Web Browser   │
              │ Desktop / Phone │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Next.js      │
              │ React + TS      │
              │ Member UI       │
              │ Admin UI        │
              │ Server Logic    │
              │ API Routes      │
              └────────┬────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      ┌─────────────┐     ┌─────────────┐
      │  Supabase   │     │   Storage   │
      │ PostgreSQL  │     │ CVs/Docs    │
      │ Auth / RLS  │     │             │
      └─────────────┘     └─────────────┘
```

This fits the product model because the spec already separates member self-service from the admin-facing directory and requires server-side verification gates ([stage-7-state-machines.md](stage-7-state-machines.md)).

## 2-3. Frontend and backend

**Frontend:** Next.js + React + TypeScript, App Router. UI: Tailwind CSS, shadcn/ui, Lucide icons. Forms: React Hook Form + Zod — the platform has many multi-field, multi-record forms (registration, profile, education, experience, certifications, opportunity creation, verification, applications), and Zod gives one place to define validation rules shared between client and server.

**Backend:** no separate Node/Express backend for MVP. The Next.js application contains the server layer (UI, Server Components, Server Actions, Route Handlers, business logic), responsible for authorization, profile operations, verification, opportunity creation, matching, application status changes, notifications, controlled contact-info exposure, and admin operations. Sensitive operations never depend solely on frontend checks.

## 4. Database

PostgreSQL through Supabase. The logical model ([stage-15-data-model.md](stage-15-data-model.md)) is strongly relational — Church → Branch → Member → (Education/Experience/Skills/Certifications/Documents/Verification/Applications/Notifications), Opportunity → Requirements (Profession/Skills) — so this is the correct database choice, not a document store.

## 5. Authentication

Supabase Auth handles account creation, login, logout, password reset, session management, tokens — JWT-based, integrates directly with PostgreSQL RLS. Authentication model: Supabase Auth User (1:1) → `public.members`, carrying church_id, branch_id, role. **The application database never stores passwords itself** — Supabase Auth owns credentials, `members` owns profile/application data.

## 6. User roles

MVP: `MEMBER`, `CHURCH_ADMIN`, `SUPER_ADMIN`. Future: `ORGANIZATION`, `EMPLOYER` (P2, per Stage 5).

**Member** can: manage own profile/education/experience/skills/certifications, upload documents, manage availability, view/apply to opportunities, view own applications, receive notifications.

**Church Admin** can: view the verified professional directory, review/verify membership and credentials, create opportunities, search/match/shortlist professionals, manage applications, view controlled contact information (once unlocked per [stage-8-connection-model.md](stage-8-connection-model.md)).

**Super Admin** additionally: manage churches, branches, administrators, taxonomy, system configuration, platform-wide analytics.

## 7. Authorization architecture — two layers

**Layer 1 — Application authorization.** Next.js server code determines who the user is, their role, and whether the attempted action is allowed (e.g. a MEMBER cannot reach `/admin/verification`).

**Layer 2 — PostgreSQL RLS.** Database-level authorization, active even if someone bypasses the normal UI. Especially important given the personal data this system holds: phone numbers, email addresses, CVs, qualifications, employment history, private documents.

## 8. Critical security rule

The browser must **never** receive the Supabase service-role/secret key — it bypasses RLS. The public/publishable key is frontend-safe under proper RLS policies. Service-role credentials are backend-only.

```
Browser:        Publishable key ✓ | Service-role key ✕ NEVER
Next.js Server: Secret/service credentials ✓
```

## 9-17. Physical database schema

Translating [stage-15-data-model.md](stage-15-data-model.md)'s logical entities into actual PostgreSQL tables:

**Core:** `churches` (id, name, slug, status, timestamps), `branches` (id, church_id, name, location, status, timestamps), `members` (id, auth_user_id, church_id, branch_id, first_name, last_name, photo_url, date_of_birth, gender, phone, email, location, primary_profession_id, industry_id, employment_status, profile_status, membership_status, credentials_status, availability, timestamps).

**Professional data:** `professions` (id, name, industry_id, active, created_at), `industries` (id, name, active), `skills` (id, name, profession_id, active), `member_skills` (member_id, skill_id, created_at), `education` (id, member_id, institution, qualification, field_of_study, start_year, end_year, is_current, timestamps), `experience` (id, member_id, organization, position, location, start_date, end_date, is_current, description, timestamps), `certifications` (id, member_id, name, issuing_organization, issue_date, expiry_date, credential_number, timestamps).

**Documents:** `documents` (id, member_id, document_type [CV | CERTIFICATE | OTHER], file_name, storage_path, mime_type, file_size, visibility, created_at). Actual files live in Supabase Storage; Postgres stores metadata and the storage path. Private documents must never sit in a public bucket.

**Verification:** `verification_history` (id, member_id, track [MEMBERSHIP | CREDENTIALS], decision [PENDING | CONFIRMED | NEEDS_CORRECTION | REJECTED], note, reviewed_by, created_at). The two tracks stay independent — the spec requires separate verification endpoints because membership and credentials are independent decisions ([stage-16-api-shape.md](stage-16-api-shape.md)'s two verify-* endpoints).

**Verification gate — server-side, not a frontend filter:** a member is discoverable in the professional directory only when Membership = CONFIRMED AND Credentials = REVIEWED/CONFIRMED (matches [stage-7-state-machines.md](stage-7-state-machines.md)'s Discoverability rule exactly).

```
Profile Complete → Submit for Verification
    ├── Membership Verification
    └── Credentials Verification
              ↓
        BOTH APPROVED
              ↓
       PROFESSIONAL POOL
```

**Opportunities:** `opportunities` (id, church_id, branch_id, title, type, organization_name, location, description, headcount, minimum_experience, required_education, required_profession_id, status, created_by, published_at, closed_at, timestamps). MVP types: EMPLOYMENT, CHURCH, SERVICE (Project/Business remain future, per Stage 5).

**Opportunity requirements:** `opportunity_skills` (opportunity_id, skill_id, required) — keeps the schema ready for a future project-management system without building it now.

**Applications:** `applications` (id, member_id, opportunity_id, status [APPLIED | REVIEWED | SHORTLISTED | INTERVIEW | SELECTED | REJECTED | WITHDRAWN], applied_at, updated_at). `application_outcomes` (id, application_id, outcome [HIRED | CONTRACT_AWARDED | PROJECT_COMPLETED | SERVICE_DELIVERED | CONNECTED | NOT_SELECTED | CANCELLED], notes, created_at).

**Notifications:** `notifications` (id, member_id, type, body_text, related_entity_type, related_entity_id, read_at, created_at). MVP types: PROFILE_VERIFIED, OPPORTUNITY_MATCH, APPLICATION_SHORTLISTED, INTERVIEW_SELECTED, CORRECTION_REQUESTED.

## 18-20. Matching engine

Application logic, not AI — a deterministic TypeScript matching service. **Gate before scoring:** membership verified? credentials verified? availability != Not Available? Any failed gate excludes the candidate entirely (matches [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)'s decision that verification is a gate, not a scored factor).

**Formula** (identical to Stage 9): Profession 30%, Skills 20%, Experience 20%, Availability 15%, Location 10%, Education 5%.

**API must return both `match_score` and `match_breakdown`** — never let the frontend recalculate independently. The API owns the calculation so admin UI, a future employer portal, analytics, and any future recommendation system all agree on one number. This matches [stage-17-screen-specs.md](stage-17-screen-specs.md)'s explicit requirement that the per-criterion breakdown is a response-shape requirement, not just a UI choice.

```json
{
  "score": 94,
  "breakdown": {
    "profession": 100, "skills": 90, "experience": 100,
    "availability": 100, "location": 80, "education": 100
  }
}
```

## 21-22. API architecture and rules

Implements [stage-16-api-shape.md](stage-16-api-shape.md)'s contract via Next.js Route Handlers. Every protected operation follows: authenticate → identify user → check role → validate input → check business rule → database operation → typed response. Example given for `POST /admin/members/:id/verify-credentials`: authenticated? Church Admin/Super Admin? member exists? credentials verification currently actionable? validate decision → write verification history → update credentials_status → create notification → return updated state.

## 23. Contact / connection security

Phone and email are not visible to every admin just because a profile exists. **Directory search → view professional → Shortlist → contact information becomes available.** `GET /professionals/:id` returns `phone: null, email: null` until the relevant application reaches the required stage. Enforced server-side. **Matches [stage-8-connection-model.md](stage-8-connection-model.md)'s decided staged-visibility model exactly** — restated here as an API-level implementation detail, not a new decision.

## 24-25. Repository and route structure

```
church-professional-network/
├── app/
│   ├── (public)/  (auth)/  (member)/
│   ├── admin/
│   └── api/
├── components/
│   ├── ui/ forms/ profile/ opportunities/ matching/ admin/
├── lib/
│   ├── auth/ authorization/ db/ matching/ notifications/ storage/ validation/ utils/
├── types/
├── supabase/
│   ├── migrations/ seed/ tests/
├── tests/
│   ├── unit/ e2e/
├── public/
├── middleware.ts
├── package.json
└── README.md
```

Route structure: `/login`, `/register`, `/dashboard`, `/profile` (`/edit`, `/verification`), `/opportunities` (`/[id]`, `/[id]/apply`), `/applications`, `/notifications`, `/admin` (`/dashboard`, `/members`, `/professionals`, `/verification`, `/opportunities`, `/opportunities/new`, `/opportunities/[id]`, `/opportunities/[id]/matches`, `/applications`, `/settings`) — a direct implementation of [stage-17-screen-specs.md](stage-17-screen-specs.md)'s screen inventory.

## 26. Server / client boundary

Server Components by default; Client Components only where interaction requires them. Server: directory queries, verification queue, opportunity details, dashboard data, matching results. Client: profile forms, filters, dropdowns, multi-step onboarding, upload controls, interactive modals, notifications menu. Keeps sensitive data processing primarily server-side.

## 27. Storage architecture

Supabase Storage bucket `member-documents`, structured `member-documents/{member_id}/cv/`, `/certificates/`, `/other/`. Future buckets: `profile-images`, `organization-documents`, `project-documents`. All document access private and authorization-controlled.

## 28. Search

PostgreSQL only for MVP — no Elasticsearch/OpenSearch. Searchable: name, profession, industry, skills, location, experience, availability, verification (matches [stage-16-api-shape.md](stage-16-api-shape.md)'s directory filters). Can be extracted into a dedicated search service later without changing the frontend contract, if the network grows large enough to need it.

## 29. Taxonomy

Seed categories: Engineering, Healthcare, Education, Finance, Technology, Business, Legal, Construction, Transport, Creative, Administration, Hospitality, Agriculture, Other — broader than but compatible with [stage-10-taxonomy.md](stage-10-taxonomy.md)'s more detailed profession-level breakdown; reconcile the two lists when building the actual seed data (Stage 14). An unlisted profession must not block registration — an "Other / specify" path should exist, matching Stage 10's own free-text-fallback principle.

## 30-32. Environments, variables, migrations

Three environments: Development (local), Staging (QA, testing, pastor/leadership demos, acceptance testing), Production (real members, real data). Each gets its own Supabase project, database, storage, auth config, environment variables. Production data must never be used casually for development.

Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`, `SENTRY_DSN`. Secrets never in Git; `.env.local` gitignored.

Migrations: every schema change is a numbered migration file (`001_initial_schema.sql`, `002_member_profile.sql`, `003_verification.sql`, `004_opportunities.sql`, `005_applications.sql`, `006_notifications.sql`). No undocumented production-only database changes.

## 33-34. Testing strategy

**Unit (Vitest):** matching algorithm, score calculations, validation, state transitions, permission helpers, utility functions — `matching.test.ts`, `verification.test.ts`, `permissions.test.ts`.

**End-to-end (Playwright):** Register → build profile → submit verification; Admin review → approve; Admin create opportunity → find matches → shortlist; Member receive notification → view opportunity → apply; Admin review application → shortlist. These map directly to [stage-18-development-milestones.md](stage-18-development-milestones.md)'s vertical slices.

**RLS testing** — explicit test cases required, not assumed: Member A can read own profile, cannot modify Member B; Member A can read own applications, cannot read Admin data; Church Admin can access the authorized directory; an unverified member cannot appear in the directory; a non-admin cannot access the verification queue.

## 35-36. Monitoring and metrics

Sentry for frontend/server/API errors. PostHog (or similar) for product analytics (onboarding completion, profile completion, opportunity views, applications, activation, drop-off) — kept distinct from the actual **impact metrics** ([stage-2-prd.md](stage-2-prd.md) section 47, Stage 5's P2 impact dashboard): registered members / profile completion / verification completion vs. verified professionals / matches / shortlists / connections / jobs obtained / projects completed / services delivered / businesses connected / opportunities fulfilled. Analytics must never substitute for the real impact numbers.

## 37-38. Deployment and Git strategy

`GitHub → Pull Request (tests, typecheck, lint, build) → Vercel → Next.js application → Supabase Production`. Every PR passes `lint`, `typecheck`, `test`, `build` before merge — matches this workspace's own standing TS/JS convention (root CLAUDE.md). Branches: `main`, `develop`, `feature/*`. Workflow: `feature/* → PR → develop → Staging → main → Production`.

## 39-41. Future growth and non-goals

The MVP data model deliberately excludes Project, ProjectRole, Organization/Employer, and Messaging entities — correct, per Stage 5/15. Extend later rather than prematurely build now. Explicitly not building for MVP: native iOS/Android apps, employer portal, AI matching, chat/messaging, marketplace, payments, project management, business directory, social feed, public profiles, Elasticsearch, microservices, Kubernetes, complex recommendation engine, SMS/push infrastructure — all consistent with Stage 5's non-goals list.

**Architecture principles for the engineering team:** the server is authoritative (never trust frontend state for permissions/verification/matching/status/contact visibility); every sensitive table gets RLS; business logic (matching, verification, state transitions) is centralized, not duplicated per screen; a match must be explainable; privacy is the default (no phone/email/documents exposed unless the workflow permits); mobile-first for members, desktop-optimized for admins; build vertical slices, not invisible infrastructure for weeks.

## 42. Remaining business decisions — as this document originally listed them

Three items named here as still open when this document was drafted. **Two are now resolved** (see the consistency note at the top of this file): reverification-on-edit and opportunity-closing were decided in [stage-7-state-machines.md](stage-7-state-machines.md) following the same external review that produced this document. Kept below as originally written, since this document's own reasoning matches the decisions independently, which is useful confirmation.

**A. Verification criteria — still genuinely open, no change.** Church Admin is confirmed as *who* verifies; leadership still needs to define what evidence is sufficient. Example structure offered: Membership (member number? branch confirmation? admin confirmation? membership database lookup?), Profession (CV? certificate? license? employer history? admin review?). The database architecture doesn't need to wait for this — it can store the evidence and decision history regardless of what the eventual rule turns out to be.

**B. Editing verified information — resolved in Stage 7**, matches this document's own recommendation almost exactly (low-risk fields no reverification; profession/qualification/major experience/certification require re-review).

**C. Closing opportunities — resolved in Stage 7**, matches this document's own recommendation exactly (block new applications, existing applications remain visible, admin explicitly chooses to continue or close remaining ones).

## 43-44. Final architecture and build order

```
                         USERS
            ┌──────────────┴──────────────┐
         MEMBER                         ADMIN
            └──────────────┬──────────────┘
                    NEXT.JS APPLICATION
          ┌────────────────┼────────────────┐
       Member UI        Admin UI       Server Logic
          └────────────────┼────────────────┘
                       SUPABASE
          ┌────────────────┼────────────────┐
      PostgreSQL          Auth           Storage
          │
   ┌──────┼───────────────────────────┐
Members  Verification             Opportunities
          └──────────┐
                 TRUST GATE
                      │
                MATCHING ENGINE
                      │
                 APPLICATIONS
                      │
                 CONNECTION
                      │
                    IMPACT
```

Build order follows [stage-18-development-milestones.md](stage-18-development-milestones.md)'s M1-M10 exactly, no new sequence invented. **M6 (Matching) remains the most important milestone** — the product's "aha moment," per both that document and this one independently agreeing.

## 45. Immediate next step

M1 should produce: Next.js project scaffolding, TypeScript, Tailwind, shadcn/ui, a Supabase project, PostgreSQL connection, Supabase Auth, the initial migration, RLS foundation, Member and Admin roles, login/registration/logout/password reset, protected routes, member and admin app shells, a GitHub repository, local dev environment, staging environment.

First working demo: Register → Login → Member Dashboard, and separately Admin Login → Admin Dashboard. Once reliable, proceed directly to M2 (the 8-step professional profile).

**Received and filed:** [stage-21-m1-implementation-spec.md](stage-21-m1-implementation-spec.md) — the actual M1 coding blueprint (init commands, dependencies, migration SQL, RLS policies, screens, file structure, acceptance tests). One correction made there: the `members` table's verification fields use the three-column split this document's own section 12 already specifies, not the single conflated column the received spec initially used.


---


<div style="page-break-before: always;"></div>

# Stage 21 — M1 Implementation Specification

Received 2026-09-10, the direct continuation of [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md)'s section 45 checklist, turned into an actual coding blueprint: project init commands, dependencies, Supabase client architecture, migration SQL, RLS policies, screens, file structure, and acceptance tests for M1 specifically. Kept close to as-received, with one correction — see the flagged section below — and heading levels adjusted to nest under this file's title.

**One schema conflict found and corrected before filing (Champion, 2026-09-10):** the received spec's `members.profile_status` column used five values that conflate profile-completeness with verification (`REGISTERED, PROFILE_COMPLETE, PENDING_VERIFICATION, VERIFIED, NEEDS_CORRECTION`). [stage-7-state-machines.md](stage-7-state-machines.md) and [stage-15-data-model.md](stage-15-data-model.md) already decided these are **three independent fields**, specifically so a member can be `membership_status = Confirmed` while `credentials_status = Pending` at the same time — a real, tested state (Stage 13's acceptance criteria include a scenario for exactly this). A single 5-value `profile_status` column cannot represent that combination. The migration SQL below is corrected to the three-column model; the received single-column version is not used. This is the only content change made to this document — everything else is filed as received.

---

## 1. M1 scope

**Goal:** at the end of M1, a person can register, log in, log out, reset their password, and reach the correct application area based on role. Member and admin shells exist; professional-network features come later.

**Build now:** Next.js application, TypeScript, Tailwind CSS, shadcn/ui, Supabase project connection, Supabase Auth, PostgreSQL foundation, `members` table, roles, protected routes, registration, login, logout, password reset, member dashboard shell, admin dashboard shell, responsive navigation, session handling, initial RLS policies, basic error/loading states, Git repository structure, environment configuration.

**Do NOT build yet:** professional profile, education, experience, skills, certifications, CV upload, verification, directory, opportunities, matching, applications, messaging. Those begin in [stage-18-development-milestones.md](stage-18-development-milestones.md)'s later milestones — M2 owns the complete member profile/onboarding experience.

---

## 2. Project initialization

```bash
npx create-next-app@latest church-professional-network
```

Select: TypeScript Yes, ESLint Yes, Tailwind CSS Yes, `src/` directory Yes, App Router Yes, Turbopack Yes, import alias `@/*`.

```
church-professional-network/
├── public/
├── src/
│   └── app/
├── .env.local
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 3. Core dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npx shadcn@latest init
```

Initial shadcn components: `button, input, label, card, alert, badge, dropdown-menu, separator, sheet, avatar, skeleton`. Don't install dozens of components before they're needed.

## 4. Supabase setup

```
Next.js → Supabase Auth
        → Supabase Database → PostgreSQL
```

Supabase Auth handles authentication; the app never stores passwords itself — matches [stage-19-technical-architecture.md](stage-19-technical-architecture.md) and [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md)'s decided approach exactly.

## 5. Environment variables

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The secret key stays server-side — never in a `NEXT_PUBLIC_*` variable, never in browser code. Matches Stage 19/20's "critical security rule" exactly.

## 6. Supabase client architecture

```
src/lib/supabase/
├── client.ts      — browser/client components
├── server.ts       — Server Components, Server Actions, Route Handlers
└── middleware.ts    — session state, route protection
```

Rule: browser → Supabase client only; server → Supabase server client; secret operations → server only.

## 7. Database migration #001 — CORRECTED

`supabase/migrations/001_initial_schema.sql`. The received version used a single `profile_status` enum conflating completeness and verification; corrected here to the three-field model per Stage 7/15:

```sql
create table public.members (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid not null unique
    references auth.users(id) on delete cascade,

  role text not null default 'MEMBER'
    check (role in ('MEMBER', 'CHURCH_ADMIN', 'SUPER_ADMIN')),

  first_name text not null,
  last_name text not null,

  phone text,
  email text,

  -- CORRECTED: three independent fields, per stage-7-state-machines.md
  -- and stage-15-data-model.md, not one combined column. A member can be
  -- membership_status = 'CONFIRMED' while credentials_status = 'PENDING'
  -- at the same time -- a single column cannot represent that.
  profile_status text not null default 'REGISTERED'
    check (profile_status in ('REGISTERED', 'PROFILE_COMPLETE')),

  membership_status text not null default 'NOT_SUBMITTED'
    check (
      membership_status in (
        'NOT_SUBMITTED', 'PENDING', 'CONFIRMED',
        'NEEDS_CORRECTION', 'SUSPENDED'
      )
    ),

  credentials_status text not null default 'NOT_SUBMITTED'
    check (
      credentials_status in (
        'NOT_SUBMITTED', 'PENDING', 'REVIEWED',
        'NEEDS_CORRECTION', 'REVIEW_PENDING'
      )
    ),
  -- REVIEW_PENDING added per stage-7's 2026-09-10 reverification decision:
  -- editing Experience marks credentials REVIEW_PENDING (lighter than a
  -- full reset to PENDING), so this state needs to exist from migration #001
  -- even though M1 itself never triggers it -- adding it later would be a
  -- breaking enum change instead of a value nobody uses yet.

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

This intentionally does not include the complete professional profile yet — M2 extends this with profession, education, experience, skills, certifications, documents, availability, per [stage-15-data-model.md](stage-15-data-model.md).

## 8. Why role belongs in the database

Not frontend-only state — authorization must be enforceable server-side. `MEMBER → /dashboard`; `CHURCH_ADMIN`/`SUPER_ADMIN → /admin/dashboard`; a `MEMBER` hitting `/admin/verification` is denied server-side, not just hidden in the UI.

## 9. RLS foundation

```sql
alter table public.members enable row level security;

create policy "Members can view their own profile"
on public.members for select to authenticated
using (auth.uid() = auth_user_id);

create policy "Members can update their own profile"
on public.members for update to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);
```

Initial foundation only — more sophisticated policies (admin read access to the directory, the verification-gate visibility rule) arrive with M2-M4, per [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md) section 34's RLS test-case list.

## 10-11. Registration

Screen fields: First name, Last name, Email or phone, Password, Confirm password — intentionally minimal, matching [stage-17-screen-specs.md](stage-17-screen-specs.md)'s Registration spec exactly ("don't ask for their entire CV during registration"). Flow: Registration → Supabase Auth account → `members` record → `/onboarding` (M2's territory, not built in M1).

Zod validation: required first/last name, required email/phone, password minimum requirements, confirm-password match. Inline errors, e.g. "Please enter your first name," "Password must contain at least 8 characters," "Passwords do not match." Submitting state: "Creating account…" — matches [stage-11-states-catalog.md](stage-11-states-catalog.md)'s loading-state conventions.

## 12-14. Login

Two entry points, same underlying auth: `/login` (member) and `/admin/login` (admin), differing in intended role/destination.

**Member login** → session → role → `/dashboard`.
**Admin login** → session → role check → `CHURCH_ADMIN`/`SUPER_ADMIN` → `/admin/dashboard`. A member attempting `/admin/*` gets a role check → not authorized → redirect to `/dashboard`. **Server-enforced, not just hidden navigation** — matches Stage 17/20's authorization principle exactly.

## 15. Session architecture

`Browser → Authentication → Supabase session → Server reads session → members lookup → role`. No separate custom auth session maintained in the application database — Supabase Auth is the single source of truth for identity.

## 16-17. Route protection and middleware

Protected: `/dashboard/*, /profile/*, /opportunities/*, /applications/*, /notifications/*, /settings/*`. Admin: `/admin/*`. Public: `/, /login, /register, /admin/login, /forgot-password, /reset-password`.

Middleware logic: public route → continue; else authenticated? no → login; yes → is `/admin`? yes → admin role? no → unauthorized, yes → continue; not `/admin` → continue.

## 18-20. Application shell and navigation

Desktop: persistent sidebar (logo, notifications, user menu top; nav items; sign out at bottom). Mobile: bottom navigation (Home/Profile/Jobs/Alerts) — matches [stage-3-ux.md](stage-3-ux.md)'s desktop sidebar / mobile bottom-nav pattern exactly.

Member nav (M1 shell, most routes show "Coming in the next stage" but the structure exists now): Dashboard, My Profile, Opportunities, Applications, Notifications, Settings.

Admin nav: Dashboard, Members, Professionals, Verification, Opportunities, Applications, Analytics, Settings.

## 21-22. Dashboards — honest, not fake

**Member dashboard M1:** "Welcome, [First Name]. Complete your professional profile so the church can better understand your skills and experience. [Complete profile]" — Profile: Registered. Verification: Not submitted yet. Opportunities: Coming soon.

**Admin dashboard M1:** "Welcome to the Professional Network. The platform is ready for administration." Members: 0. Verified Professionals: 0. Active Opportunities: 0. Applications: 0.

Real zero-states, not invented numbers — matches [stage-17-screen-specs.md](stage-17-screen-specs.md)'s note that a freshly-launched instance should show real small numbers, not look broken. M9 replaces these with real metrics once there's real data.

## 23-24. Loading and error states

Skeletons (shadcn), not a global spinner, on every authenticated page. Auth errors in plain language: "Incorrect email or password." / "This account already exists. Try signing in instead." / "We couldn't create your account. Please try again." / "Your session has expired. Please sign in again." — matches [stage-11-states-catalog.md](stage-11-states-catalog.md)'s Authentication section almost verbatim.

## 25. Password reset

`Forgot password → Enter email → Send reset link → Email → Reset password → Login`. Screens: request ("Send reset link"), confirmation ("If an account exists for this address, we've sent instructions..." — deliberately non-committal, doesn't confirm whether the email exists, standard security practice), new password ("Update password").

## 26. File structure after M1

```
src/
├── app/
│   ├── (public)/       page.tsx, login/, register/, forgot-password/, reset-password/
│   ├── (member)/        layout.tsx, dashboard/
│   ├── admin/            login/, (protected)/ layout.tsx, dashboard/
│   └── api/
├── components/
│   ├── ui/ auth/ layout/ navigation/
├── lib/
│   ├── supabase/ auth/ authorization/ validation/
├── types/
└── middleware.ts
```

Matches [stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md) section 24's repo structure, scoped down to what M1 actually needs.

## 27. Auth service

```
src/lib/auth/
├── actions.ts       register(), login(), logout(), requestPasswordReset(), resetPassword()
├── queries.ts        getCurrentUser(), getCurrentMember(), getCurrentRole()
├── permissions.ts    isMember(), isChurchAdmin(), isSuperAdmin(), isAdmin()
└── redirects.ts      where should this authenticated user go?
```

## 28. Type system

```
src/types/
├── auth.ts  member.ts  roles.ts  database.ts
```

```ts
export type UserRole = "MEMBER" | "CHURCH_ADMIN" | "SUPER_ADMIN";
```

Centralized, not scattered string literals through dozens of files. **Extend this pattern** to the corrected `profile_status`/`membership_status`/`credentials_status` enums from section 7 above when `member.ts` is written, so those three fields get the same typed treatment as role.

## 29. API boundary

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/password/reset-request
POST /api/auth/password/reset
GET  /api/auth/session
```

Matches [stage-16-api-shape.md](stage-16-api-shape.md)'s Auth section exactly.

## 30. M1 acceptance tests

**Registration:** new member can register; duplicate email rejected; weak password rejected; mismatched confirmation rejected; member record created; new user gets `MEMBER` role; user reaches dashboard.

**Login:** valid credentials work; invalid credentials fail; member reaches member dashboard; admin reaches admin dashboard; member cannot access admin routes.

**Logout:** ends session; protected page inaccessible afterward.

**Password reset:** request works; reset link works; new password can be set; new password allows login.

**Security:** RLS enabled; a member cannot read another member's record; a member cannot modify another member's record; admin routes protected server-side; secret keys never reach the browser.

**Responsive:** test at 360px, 390px, 768px, 1024px, 1440px, across Chrome/Safari/Firefox/Edge — extends [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)'s functional scenarios with concrete viewport/browser targets that document didn't specify.

## 31-32. M1 demo and definition of done

**Member demo:** Open platform → Create account → Login → Member Dashboard → Sign out.
**Admin demo:** Admin Login → Admin Dashboard → Members → Professionals → Verification → Opportunities (later pages can be empty shells — the architecture and access control working is what matters).

**Definition of done:** a real user can create an account, authenticate securely, maintain a session, reach the correct role-based application shell, and be prevented from accessing areas they're not authorized for.

At that point: **M2 — Professional Profile** (Registration → 8-step onboarding → Profile Complete → Submit for Verification), per [stage-18-development-milestones.md](stage-18-development-milestones.md)'s existing sequence — M2 builds the complete profile, M3 introduces verification.

---

## What this document changes for the rest of the spec

Only the migration SQL in section 7 above. No other stage document needs updating as a result of this one — the three-field model it now uses was already the decided design in Stage 7/15, this document just needed to be brought in line with it before anyone runs the migration.


---
