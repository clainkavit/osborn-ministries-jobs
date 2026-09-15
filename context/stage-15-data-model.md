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
