-- ════════════════════════════════════════════════════════════════════════════
-- Meridian & Co. Careers — initial schema
-- Tables, constraints, indexes, reference-number generator and triggers.
-- Security (RLS + storage) lives in 20261124000200_security.sql
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.job_status as enum ('draft', 'published', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('new', 'shortlisted', 'interviewed', 'hired', 'rejected');
exception when duplicate_object then null; end $$;

-- ── HR administrators ───────────────────────────────────────────────────────
-- A user may access the dashboard only if their auth.users id is listed here.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  created_at timestamptz not null default now()
);

-- ── Vacancies ───────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null check (char_length(title) between 3 and 120),
  department       text not null check (char_length(department) <= 60),
  location         text not null check (char_length(location) <= 60),
  employment_type  text not null check (employment_type in ('Full-time', 'Part-time', 'Contract', 'Internship')),
  salary_min       integer check (salary_min >= 0),
  salary_max       integer check (salary_max is null or salary_max >= salary_min),
  summary          text not null check (char_length(summary) <= 600),
  responsibilities text[] not null default '{}',
  qualifications   text[] not null default '{}',
  nice_to_have     text[] not null default '{}',
  status           public.job_status not null default 'draft',
  posted_at        timestamptz,
  closes_at        date,
  created_by       uuid references auth.users (id) default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists jobs_status_posted_idx on public.jobs (status, posted_at desc);

-- ── Applications ────────────────────────────────────────────────────────────
create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,
  job_id        uuid not null references public.jobs (id) on delete restrict,
  full_name     text not null check (char_length(full_name) between 2 and 120),
  email         citext not null check (char_length(email) <= 254 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  phone         text not null check (phone ~ '^\+?[0-9\s().-]{7,20}$'),
  experience    text not null check (experience in ('Less than 1 year', '1–2 years', '3–5 years', '6–9 years', '10+ years')),
  cover_letter  text not null check (char_length(cover_letter) between 50 and 5000),
  resume_path   text not null,
  resume_name   text not null check (char_length(resume_name) <= 200),
  resume_size   integer not null check (resume_size > 0 and resume_size <= 5242880),
  resume_type   text not null check (resume_type in (
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  consent       boolean not null check (consent = true),
  consent_at    timestamptz not null default now(),
  status        public.application_status not null default 'new',
  notes         text check (char_length(notes) <= 2000),
  ip_hash       text,                       -- salted SHA-256 of client IP (rate-limiting, never the raw IP)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- one application per email per vacancy
  constraint applications_one_per_job unique (job_id, email)
);
create index if not exists applications_status_idx   on public.applications (status, created_at desc);
create index if not exists applications_job_idx      on public.applications (job_id);
create index if not exists applications_email_idx    on public.applications (email);
create index if not exists applications_ip_time_idx  on public.applications (ip_hash, created_at desc);

-- ── Email log (audit trail of automated messages) ──────────────────────────
create table if not exists public.email_log (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications (id) on delete cascade,
  reference      text,
  kind           text not null,
  recipient      text not null,
  subject        text not null,
  html_preview   text,
  status         text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_id    text,
  error          text,
  sent_at        timestamptz not null default now()
);
create index if not exists email_log_sent_idx on public.email_log (sent_at desc);

-- ── Status history (who changed what, when) ────────────────────────────────
create table if not exists public.application_events (
  id             bigserial primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status    public.application_status,
  to_status      public.application_status not null,
  changed_by     uuid references auth.users (id),
  changed_at     timestamptz not null default now()
);

-- ── Reference numbers: MC-YYYY-XXXXXX (unambiguous alphabet) ────────────────
create or replace function public.generate_application_reference()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
begin
  loop
    candidate := 'MC-' || to_char(now(), 'YYYY') || '-';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from public.applications where reference = candidate);
  end loop;
  return candidate;
end $$;

alter table public.applications alter column reference set default public.generate_application_reference();

-- ── Triggers ────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists jobs_touch on public.jobs;
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

-- Stamp posted_at the first time a job is published.
create or replace function public.stamp_posted_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'published' and new.posted_at is null then
    new.posted_at := now();
  end if;
  return new;
end $$;

drop trigger if exists jobs_posted_at on public.jobs;
create trigger jobs_posted_at before insert or update of status on public.jobs
  for each row execute function public.stamp_posted_at();

-- Record status changes for audit.
create or replace function public.log_application_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.application_events (application_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists applications_status_log on public.applications;
create trigger applications_status_log after update of status on public.applications
  for each row execute function public.log_application_status();

-- Admins may only change status and notes; the candidate's submission is immutable.
create or replace function public.protect_application_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.reference, new.job_id, new.full_name, new.email, new.phone, new.experience,
      new.cover_letter, new.resume_path, new.resume_name, new.consent, new.created_at)
     is distinct from
     (old.reference, old.job_id, old.full_name, old.email, old.phone, old.experience,
      old.cover_letter, old.resume_path, old.resume_name, old.consent, old.created_at) then
    raise exception 'Applicant-submitted fields are read-only';
  end if;
  return new;
end $$;

drop trigger if exists applications_protect on public.applications;
create trigger applications_protect before update on public.applications
  for each row execute function public.protect_application_fields();
