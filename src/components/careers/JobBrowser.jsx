import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, Clock, ArrowRight, Building2, Wallet, X, SearchX } from 'lucide-react';
import { DEPARTMENTS, EMPLOYMENT_TYPES, LOCATIONS } from '../../lib/constants.js';
import { formatSalary, timeAgo, cx } from '../../lib/utils.js';
import { EmptyState, Badge } from '../ui/index.jsx';

export function filterJobs(jobs, { q = '', department = '', type = '', location = '' }) {
  const needle = q.trim().toLowerCase();
  return jobs.filter(
    (j) =>
      (!needle || j.title.toLowerCase().includes(needle)) &&
      (!department || j.department === department) &&
      (!type || j.employmentType === type) &&
      (!location || j.location === location),
  );
}

export function JobCard({ job }) {
  const salary = formatSalary(job);
  return (
    <article className="group card relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lift sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Badge tone="navy">{job.department}</Badge>
        {job.postedAt && <span className="text-xs text-navy-400">{timeAgo(job.postedAt)}</span>}
      </div>
      <h3 className="mt-3 text-lg font-bold text-navy-900">
        <Link to={`/jobs/${job.slug}`} className="after:absolute after:inset-0 focus:outline-none">
          {job.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-navy-500">{job.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Job details">
        <li className="chip"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{job.location}</li>
        <li className="chip"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{job.employmentType}</li>
        {salary && <li className="chip"><Wallet className="h-3.5 w-3.5" aria-hidden="true" />{salary}</li>}
      </ul>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm font-semibold text-emerald-700 group-hover:text-emerald-600">View role & apply</span>
        <ArrowRight className="h-4 w-4 text-emerald-600 transition group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </article>
  );
}

function Select({ label, value, onChange, options, icon: Icon }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input appearance-none pl-10 pr-8" aria-label={label}>
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
    </label>
  );
}

export default function JobBrowser({ jobs, limit }) {
  const [filters, setFilters] = useState({ q: '', department: '', type: '', location: '' });
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const results = useMemo(() => filterJobs(jobs, filters), [jobs, filters]);
  const shown = limit ? results.slice(0, limit) : results;
  const active = Object.values(filters).some(Boolean);
  const usedDepts = DEPARTMENTS.filter((d) => jobs.some((j) => j.department === d));

  return (
    <div>
      <div className="card grid gap-3 p-3 sm:p-4 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]" role="search">
        <label className="relative block md:col-span-2 lg:col-span-1">
          <span className="sr-only">Search by job title</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set('q')(e.target.value)}
            placeholder="Search by job title…"
            className="input pl-10"
            aria-label="Search by job title"
          />
        </label>
        <Select label="Department" value={filters.department} onChange={set('department')} options={usedDepts} icon={Building2} />
        <Select label="Employment type" value={filters.type} onChange={set('type')} options={EMPLOYMENT_TYPES} icon={Briefcase} />
        <Select label="Location" value={filters.location} onChange={set('location')} options={LOCATIONS} icon={MapPin} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-navy-500" aria-live="polite">
          Showing <strong className="text-navy-900">{shown.length}</strong> of {jobs.length} open {jobs.length === 1 ? 'role' : 'roles'}
        </p>
        {active && (
          <button className="btn-ghost btn-sm" onClick={() => setFilters({ q: '', department: '', type: '', location: '' })}>
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {shown.length ? (
        <div className={cx('mt-4 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3')}>
          {shown.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState icon={SearchX} title="No roles match your search" action={<button className="btn-outline" onClick={() => setFilters({ q: '', department: '', type: '', location: '' })}>Reset filters</button>}>
            Try a different title or clear a filter. You can also send a speculative application to our Talent team.
          </EmptyState>
        </div>
      )}
      {limit && results.length > limit && (
        <div className="mt-8 text-center">
          <Link to="/jobs" className="btn-outline">See all {results.length} roles <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}
    </div>
  );
}
