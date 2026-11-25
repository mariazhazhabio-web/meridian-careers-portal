-- ════════════════════════════════════════════════════════════════════════════
-- Meridian & Co. Careers — security: Row-Level Security + private storage
--
-- Principle of least privilege
--   anon (public visitors)   → SELECT published jobs. Nothing else.
--   authenticated non-admin  → same as anon.
--   admin (in admin_users)   → full read/write on jobs, read/update applications,
--                              read email log & events, read resumes bucket.
--   service_role (Edge Fn)   → inserts applications, uploads resumes, writes email_log.
--                              Bypasses RLS; key lives ONLY in function secrets.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Admin check (SECURITY DEFINER so it can read admin_users under RLS) ─────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ── Enable RLS everywhere ───────────────────────────────────────────────────
alter table public.admin_users        enable row level security;
alter table public.jobs               enable row level security;
alter table public.applications       enable row level security;
alter table public.email_log          enable row level security;
alter table public.application_events enable row level security;

-- Force RLS even for the table owner (defence in depth)
alter table public.applications force row level security;

-- ── admin_users ─────────────────────────────────────────────────────────────
drop policy if exists "admins read admin list" on public.admin_users;
create policy "admins read admin list" on public.admin_users
  for select to authenticated using (public.is_admin());
-- No insert/update/delete policies: admins are provisioned via SQL / service role only.

-- ── jobs ────────────────────────────────────────────────────────────────────
drop policy if exists "public reads published jobs" on public.jobs;
create policy "public reads published jobs" on public.jobs
  for select to anon, authenticated using (status = 'published');

drop policy if exists "admins read all jobs" on public.jobs;
create policy "admins read all jobs" on public.jobs
  for select to authenticated using (public.is_admin());

drop policy if exists "admins insert jobs" on public.jobs;
create policy "admins insert jobs" on public.jobs
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admins update jobs" on public.jobs;
create policy "admins update jobs" on public.jobs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete draft jobs" on public.jobs;
create policy "admins delete draft jobs" on public.jobs
  for delete to authenticated using (public.is_admin() and status = 'draft');

-- ── applications ────────────────────────────────────────────────────────────
-- NOTE: deliberately NO insert policy for anon. Public submissions must go
-- through the submit-application Edge Function (server-side validation, spam
-- checks, file inspection), which uses the service role.
drop policy if exists "admins read applications" on public.applications;
create policy "admins read applications" on public.applications
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update applications" on public.applications;
create policy "admins update applications" on public.applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Column-level privileges: admins can only modify status and notes.
revoke update on public.applications from authenticated;
grant update (status, notes) on public.applications to authenticated;
revoke all on public.applications from anon;

-- ── email_log & events (read-only audit for admins) ────────────────────────
drop policy if exists "admins read email log" on public.email_log;
create policy "admins read email log" on public.email_log
  for select to authenticated using (public.is_admin());

drop policy if exists "admins read events" on public.application_events;
create policy "admins read events" on public.application_events
  for select to authenticated using (public.is_admin());

revoke all on public.email_log, public.application_events from anon;

-- ── Private resume storage ──────────────────────────────────────────────────
-- Private bucket, 5 MB hard limit, PDF/DOC/DOCX only — enforced by Storage itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admins can read (create signed URLs for) resumes. Nobody else has any policy,
-- so anon/authenticated users cannot list, read, upload, overwrite or delete.
drop policy if exists "admins read resumes" on storage.objects;
create policy "admins read resumes" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and public.is_admin());

-- ── Dashboard statistics view (runs with the caller's privileges → RLS applies) ─
create or replace view public.recruitment_stats
with (security_invoker = true) as
select
  count(*)                                              as total_applications,
  count(*) filter (where status = 'new')                as new_count,
  count(*) filter (where status = 'shortlisted')        as shortlisted_count,
  count(*) filter (where status = 'interviewed')        as interviewed_count,
  count(*) filter (where status = 'hired')              as hired_count,
  count(*) filter (where status = 'rejected')           as rejected_count,
  count(*) filter (where created_at > now() - interval '7 days') as last_7_days
from public.applications;
