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
