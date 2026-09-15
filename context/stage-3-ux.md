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
