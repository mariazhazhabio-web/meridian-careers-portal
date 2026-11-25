import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, FlaskConical, ArrowUpRight, Mail, Phone, MapPin } from 'lucide-react';
import { IS_DEMO, COMPANY, HR_EMAIL } from '../../lib/config.js';
import { cx } from '../../lib/utils.js';

export function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill={light ? '#ffffff' : '#0b1a33'} />
        <path d="M16 46V18l16 16 16-16v28" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={cx('font-display text-lg font-bold leading-none', light ? 'text-white' : 'text-navy-900')}>
        Meridian <span className="text-emerald-500">&amp;</span> Co.
      </span>
    </span>
  );
}

export function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="bg-navy-950 text-[13px] text-navy-100">
      <div className="container-x flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center">
        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Portfolio demo
        </span>
        <span>
          Built by <strong className="text-white">ZC Smart Digital</strong> for the fictional company Meridian &amp; Co. Data stays in your browser; emails are simulated.
        </span>
        <Link to="/case-study" className="inline-flex items-center gap-0.5 font-semibold text-white underline decoration-emerald-500 underline-offset-4 hover:text-emerald-300">
          Read the case study <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

const NAV = [
  { to: '/#about', label: 'About' },
  { to: '/#benefits', label: 'Benefits' },
  { to: '/#culture', label: 'Culture' },
  { to: '/jobs', label: 'Open roles' },
  { to: '/#process', label: 'Hiring process' },
  { to: '/#faq', label: 'FAQ' },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname, loc.hash]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={cx('sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition', scrolled ? 'border-line shadow-sm' : 'border-transparent')}>
      <nav className="container-x flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Link to="/" aria-label="Meridian & Co. careers home">
          <Logo />
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="rounded-lg px-3 py-2 text-sm font-medium text-navy-600 hover:bg-mist hover:text-navy-900">
              {n.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/admin" className="btn-ghost btn-sm">HR login</Link>
          <Link to="/jobs" className="btn-primary">View open roles</Link>
        </div>
        <button className="rounded-lg p-2 text-navy-700 hover:bg-mist lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div id="mobile-nav" className="border-t border-line bg-white lg:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2.5 text-base font-medium text-navy-700 hover:bg-mist">
                {n.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link to="/admin" className="btn-outline">HR login</Link>
              <Link to="/jobs" className="btn-primary">Open roles</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-300">{COMPANY.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Careers</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" to="/jobs">Open positions</Link></li>
            <li><Link className="hover:text-white" to="/#benefits">Benefits</Link></li>
            <li><Link className="hover:text-white" to="/#process">Hiring process</Link></li>
            <li><Link className="hover:text-white" to="/privacy">Applicant privacy notice</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Talent team</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> <a className="break-all hover:text-white" href={`mailto:${HR_EMAIL}`}>{HR_EMAIL}</a></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {COMPANY.hrPhone}</li>
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {COMPANY.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Meridian &amp; Co. — a fictional company. Meridian &amp; Co. is an equal opportunity employer.</p>
          <p>
            Portfolio demonstration designed &amp; developed by <strong className="text-navy-200">ZC Smart Digital</strong> ·{' '}
            <Link to="/case-study" className="underline underline-offset-2 hover:text-white">Case study</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Scrolls to #hash targets inside HashRouter paths like "#/#benefits". */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) return void setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift">
        Skip to content
      </a>
      <ScrollManager />
      <DemoBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
