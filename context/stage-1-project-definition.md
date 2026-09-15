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
