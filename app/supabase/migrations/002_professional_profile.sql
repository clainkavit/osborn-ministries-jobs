-- Migration 002 -- Professional profile (M2)
-- Source: stage-22-m2-implementation-checklist.md ("Database (migration 002)").
-- Adds the professional-profile columns to members, the taxonomy tables
-- (professions, skills), and the per-member sub-collections (education,
-- experience, member_skills, certifications, documents). Certifications table
-- exists for a later milestone; M2 has no certifications UI.
--
-- The three status fields (profile_status, membership_status,
-- credentials_status) already exist from migration 001. availability was
-- deliberately deferred to this migration.

-- ---------------------------------------------------------------------------
-- members: professional-profile columns
-- ---------------------------------------------------------------------------
alter table public.members
  add column photo_url            text,
  add column date_of_birth        date,
  add column gender               text,
  add column location             text,
  add column primary_profession_id uuid,
  add column profession_freetext  text,
  add column job_title            text,
  add column industry             text,
  add column employment_status    text
    check (
      employment_status is null or employment_status in (
        'EMPLOYED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'FREELANCER',
        'STUDENT', 'UNEMPLOYED', 'RETIRED', 'OTHER'
      )
    ),
  add column years_of_experience  integer check (years_of_experience is null or years_of_experience >= 0),
  add column availability         text not null default 'NOT_SET'
    check (availability in ('NOT_SET', 'OPEN', 'SELECTIVE', 'NOT_AVAILABLE'));

-- ---------------------------------------------------------------------------
-- taxonomy: professions, skills  (reference data; members read only)
-- ---------------------------------------------------------------------------
create table public.professions (
  id       uuid primary key default gen_random_uuid(),
  name     text not null unique,
  category text not null,
  synonyms text[] not null default '{}'
);

create table public.skills (
  id       uuid primary key default gen_random_uuid(),
  name     text not null unique,
  synonyms text[] not null default '{}'
);

alter table public.members
  add constraint members_primary_profession_fk
  foreign key (primary_profession_id) references public.professions(id) on delete set null;

alter table public.professions enable row level security;
alter table public.skills enable row level security;

create policy "Anyone authenticated can read professions"
  on public.professions for select to authenticated using (true);

create policy "Anyone authenticated can read skills"
  on public.skills for select to authenticated using (true);

-- Free-text skill entry upserts into public.skills (Stage 10's "growing
-- list" model), so authenticated members may insert a skill row. They may
-- not update or delete existing rows.
create policy "Authenticated members can add a skill"
  on public.skills for insert to authenticated with check (true);

-- ---------------------------------------------------------------------------
-- per-member sub-collections
-- ---------------------------------------------------------------------------

-- helper: the members.id owned by the current auth user
create or replace function public.current_member_id()
returns uuid
language sql
stable
as $$
  select id from public.members where auth_user_id = auth.uid()
$$;

create table public.education (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.members(id) on delete cascade,
  institution    text not null,
  qualification  text not null,
  field_of_study text,
  start_year     integer,
  end_year       integer,
  is_current     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.experience (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.members(id) on delete cascade,
  organization text not null,
  position     text not null,
  location     text,
  start_date   date,
  end_date     date,
  is_current   boolean not null default false,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.member_skills (
  member_id  uuid not null references public.members(id) on delete cascade,
  skill_id   uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, skill_id)
);

create table public.certifications (
  id                   uuid primary key default gen_random_uuid(),
  member_id            uuid not null references public.members(id) on delete cascade,
  name                 text not null,
  issuing_organization text,
  issue_date           date,
  expiration_date      date,
  document_id          uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.members(id) on delete cascade,
  type         text not null check (type in ('CV', 'CERTIFICATE', 'OTHER')),
  filename     text not null,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);

alter table public.certifications
  add constraint certifications_document_fk
  foreign key (document_id) references public.documents(id) on delete set null;

-- updated_at triggers (reuse public.set_updated_at from migration 001)
create trigger education_set_updated_at
  before update on public.education
  for each row execute function public.set_updated_at();

create trigger experience_set_updated_at
  before update on public.experience
  for each row execute function public.set_updated_at();

create trigger certifications_set_updated_at
  before update on public.certifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: a member can CRUD only their own sub-collection rows
-- ---------------------------------------------------------------------------
alter table public.education     enable row level security;
alter table public.experience    enable row level security;
alter table public.member_skills enable row level security;
alter table public.certifications enable row level security;
alter table public.documents     enable row level security;

-- education
create policy "Members manage own education"
  on public.education for all to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- experience
create policy "Members manage own experience"
  on public.experience for all to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- member_skills
create policy "Members manage own skill links"
  on public.member_skills for all to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- certifications (table only; no M2 UI, but lock it down now)
create policy "Members manage own certifications"
  on public.certifications for all to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- documents
create policy "Members manage own documents"
  on public.documents for all to authenticated
  using (member_id = public.current_member_id())
  with check (member_id = public.current_member_id());

-- ---------------------------------------------------------------------------
-- Supabase Storage: private bucket for member documents
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('member-documents', 'member-documents', false)
on conflict (id) do nothing;

-- A member may operate only on objects under "{their member id}/..."
create policy "Members read own documents storage"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'member-documents'
    and (storage.foldername(name))[1] = public.current_member_id()::text
  );

create policy "Members upload own documents storage"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'member-documents'
    and (storage.foldername(name))[1] = public.current_member_id()::text
  );

create policy "Members delete own documents storage"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'member-documents'
    and (storage.foldername(name))[1] = public.current_member_id()::text
  );
