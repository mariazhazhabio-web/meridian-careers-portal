// @vitest-environment node
// ─────────────────────────────────────────────────────────────────────────────
// Runs the REAL migration files against an in-process PostgreSQL (PGlite) and
// verifies constraints, triggers, reference numbers and Row-Level Security as
// the anon, authenticated and admin roles. Supabase's `auth` and `storage`
// schemas are stubbed with the minimum needed (auth.uid(), buckets, objects).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const ADMIN = '11111111-1111-1111-1111-111111111111';
const USER = '22222222-2222-2222-2222-222222222222';
const dir = join(process.cwd(), 'supabase', 'migrations');
let db;

const SUPABASE_STUBS = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, storage, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated;
  grant select on storage.objects to anon, authenticated;
  -- Supabase grants table privileges to API roles by default; RLS is what restricts them.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

async function as(role, sub, fn) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

const insertApp = (over = {}) => {
  const v = { email: `a${Math.random().toString(36).slice(2, 8)}@example.com`, cover: 'x'.repeat(60), consent: true, job: "(select id from public.jobs where slug='designer')", ...over };
  return db.query(`insert into public.applications (job_id, full_name, email, phone, experience, cover_letter, resume_path, resume_name, resume_size, resume_type, consent)
    values (${v.job}, 'Alex Morgan', '${v.email}', '+1 555 010 2030', '3–5 years', '${v.cover}', 'p/x.pdf', 'cv.pdf', 1000, 'application/pdf', ${v.consent}) returning *`);
};

beforeAll(async () => {
  db = new PGlite({ extensions: { citext, pgcrypto } });
  await db.exec(SUPABASE_STUBS);
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) await db.exec(readFileSync(join(dir, f), 'utf8'));
  await db.exec(`
    insert into auth.users values ('${ADMIN}', 'hr@example.com'), ('${USER}', 'someone@example.com');
    insert into public.admin_users values ('${ADMIN}', 'HR Admin');
    insert into public.jobs (slug, title, department, location, employment_type, summary, status) values
      ('designer', 'Designer', 'Design', 'Remote', 'Full-time', 'Design things', 'published'),
      ('secret-draft', 'Draft Role', 'Sales', 'Remote', 'Full-time', 'Not yet public', 'draft'),
      ('old-role', 'Closed Role', 'Finance', 'Remote', 'Contract', 'Filled', 'closed');
    insert into storage.objects (bucket_id, name) values ('resumes', 'p/x.pdf');
  `);
}, 60_000);

describe('schema & constraints', () => {
  it('creates a private resumes bucket with a 5 MB limit and document MIME allow-list', async () => {
    const { rows } = await db.query(`select public, file_size_limit, allowed_mime_types from storage.buckets where id='resumes'`);
    expect(rows[0]).toMatchObject({ public: false, file_size_limit: 5242880 });
    expect(rows[0].allowed_mime_types).toContain('application/pdf');
  });

  it('generates MC-YYYY-XXXXXX reference numbers', async () => {
    const { rows } = await insertApp();
    expect(rows[0].reference).toMatch(/^MC-\d{4}-[A-HJ-NP-Z2-9]{6}$/);
    expect(rows[0].status).toBe('new');
  });

  it('stamps posted_at when a job is published', async () => {
    const { rows } = await db.query(`select posted_at from public.jobs where slug='designer'`);
    expect(rows[0].posted_at).toBeTruthy();
  });

  it('rejects one email applying twice to the same job (case-insensitive)', async () => {
    await insertApp({ email: 'dup@example.com' });
    await expect(insertApp({ email: 'DUP@example.com' })).rejects.toThrow(/applications_one_per_job/);
  });

  it('rejects missing consent, short cover letters and bad emails at the database level', async () => {
    await expect(insertApp({ consent: false })).rejects.toThrow(/check/);
    await expect(insertApp({ cover: 'short' })).rejects.toThrow(/check/);
    await expect(insertApp({ email: 'not-an-email' })).rejects.toThrow(/check/);
  });
});

describe('row-level security — anonymous visitors', () => {
  it('can only read published jobs', async () => {
    const { rows } = await as('anon', null, () => db.query('select slug from public.jobs order by slug'));
    expect(rows.map((r) => r.slug)).toEqual(['designer']);
  });
  it('cannot read applications', async () => {
    await expect(as('anon', null, () => db.query('select * from public.applications'))).rejects.toThrow(/permission denied/);
  });
  it('cannot insert applications directly (must use the Edge Function)', async () => {
    await expect(as('anon', null, () => insertApp())).rejects.toThrow(/permission denied/);
  });
  it('cannot create or modify jobs', async () => {
    await expect(as('anon', null, () => db.query(`insert into public.jobs (slug,title,department,location,employment_type,summary) values ('x-role','X role','Sales','Remote','Full-time','s')`))).rejects.toThrow(/row-level security|permission denied/);
    const r = await as('anon', null, () => db.query(`update public.jobs set title='hacked'`));
    expect(r.affectedRows).toBe(0);
  });
  it('cannot see resume files', async () => {
    const { rows } = await as('anon', null, () => db.query('select * from storage.objects'));
    expect(rows).toHaveLength(0);
  });
  it('is_admin() is false', async () => {
    const { rows } = await as('anon', null, () => db.query('select public.is_admin() as ok'));
    expect(rows[0].ok).toBe(false);
  });
});

describe('row-level security — signed-in non-admin', () => {
  it('sees no applications, drafts, email log or resumes', async () => {
    await as('authenticated', USER, async () => {
      expect((await db.query('select * from public.applications')).rows).toHaveLength(0);
      expect((await db.query(`select * from public.jobs where status <> 'published'`)).rows).toHaveLength(0);
      expect((await db.query('select * from public.email_log')).rows).toHaveLength(0);
      expect((await db.query('select * from storage.objects')).rows).toHaveLength(0);
      expect((await db.query(`update public.applications set status='hired'`)).affectedRows).toBe(0);
    });
  });
});

describe('row-level security — HR administrator', () => {
  it('reads all jobs including drafts and closed roles', async () => {
    const { rows } = await as('authenticated', ADMIN, () => db.query('select slug from public.jobs'));
    expect(rows.map((r) => r.slug).sort()).toEqual(['designer', 'old-role', 'secret-draft']);
  });
  it('creates and publishes a vacancy', async () => {
    await as('authenticated', ADMIN, async () => {
      await db.query(`insert into public.jobs (slug,title,department,location,employment_type,summary) values ('qa-engineer','QA Engineer','Engineering','Remote','Contract','Test things')`);
      const r = await db.query(`update public.jobs set status='published' where slug='qa-engineer' returning posted_at`);
      expect(r.rows[0].posted_at).toBeTruthy();
    });
  });
  it('reads applications and updates status + notes, which is audited', async () => {
    const { rows } = await insertApp();
    await as('authenticated', ADMIN, async () => {
      expect((await db.query('select count(*)::int as n from public.applications')).rows[0].n).toBeGreaterThan(0);
      await db.query(`update public.applications set status='shortlisted', notes='Strong' where id='${rows[0].id}'`);
    });
    const ev = await db.query(`select from_status, to_status, changed_by from public.application_events where application_id='${rows[0].id}'`);
    expect(ev.rows[0]).toMatchObject({ from_status: 'new', to_status: 'shortlisted', changed_by: ADMIN });
  });
  it('cannot alter what the candidate submitted', async () => {
    const { rows } = await insertApp();
    await expect(as('authenticated', ADMIN, () => db.query(`update public.applications set full_name='Changed' where id='${rows[0].id}'`))).rejects.toThrow(/permission denied/);
  });
  it('can access resume objects in the private bucket', async () => {
    const { rows } = await as('authenticated', ADMIN, () => db.query(`select name from storage.objects where bucket_id='resumes'`));
    expect(rows).toHaveLength(1);
  });
  it('recruitment_stats view respects RLS (admins see data, anon is denied)', async () => {
    const { rows } = await as('authenticated', ADMIN, () => db.query('select total_applications from public.recruitment_stats'));
    expect(Number(rows[0].total_applications)).toBeGreaterThan(0);
    const anon = await as('authenticated', USER, () => db.query('select total_applications from public.recruitment_stats'));
    expect(Number(anon.rows[0].total_applications)).toBe(0);
  });
});
