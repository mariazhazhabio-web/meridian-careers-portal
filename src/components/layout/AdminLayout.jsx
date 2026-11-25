import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Inbox, LogOut, ExternalLink, FlaskConical, RotateCcw } from 'lucide-react';
import { Logo } from './PublicLayout.jsx';
import { useAuth } from '../../lib/hooks.js';
import { api } from '../../services/api.js';
import { IS_DEMO } from '../../lib/config.js';
import { PageLoader, Avatar, Modal, useToast } from '../ui/index.jsx';
import { cx } from '../../lib/utils.js';

const NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/applications', label: 'Applications', icon: Users },
  { to: '/admin/jobs', label: 'Vacancies', icon: Briefcase },
  { to: '/admin/emails', label: 'Email log', icon: Inbox },
];

export function RequireAdmin({ children }) {
  const { session, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <PageLoader label="Checking your session…" />;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function AdminLayout() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const signOut = async () => {
    await api.signOut();
    navigate('/admin/login');
  };
  const reset = async () => {
    await api.resetDemo();
    setConfirmReset(false);
    toast('Demo data restored to its original state');
  };
  const link = ({ isActive }) =>
    cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-white/10 text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white');

  return (
    <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="hidden flex-col bg-navy-950 p-4 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link to="/admin" className="px-2 py-2"><Logo light /></Link>
        <p className="mt-1 px-2 text-xs font-semibold uppercase tracking-wider text-navy-400">HR Recruitment Console</p>
        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Admin">
          {NAV.map(({ to, end, label, icon: I }) => (
            <NavLink key={to} to={to} end={end} className={link}>
              <I className="h-4 w-4" aria-hidden="true" /> {label}
            </NavLink>
          ))}
          <Link to="/" target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-300 hover:bg-white/5 hover:text-white">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> View careers site
          </Link>
        </nav>
        {IS_DEMO && (
          <div className="mb-3 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-200 ring-1 ring-amber-400/20">
            <p className="flex items-center gap-1.5 font-semibold text-amber-300"><FlaskConical className="h-3.5 w-3.5" /> Demo mode</p>
            <p className="mt-1 leading-relaxed">Simulated login. Data lives in this browser only.</p>
            <button onClick={() => setConfirmReset(true)} className="mt-2 inline-flex items-center gap-1 font-semibold text-white hover:underline"><RotateCcw className="h-3 w-3" /> Reset demo data</button>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar name={session?.user?.name} className="h-9 w-9 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{session?.user?.name}</p>
            <p className="truncate text-xs text-navy-300">{session?.user?.email}</p>
          </div>
          <button onClick={signOut} className="rounded-lg p-2 text-navy-300 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <div className="sticky top-0 z-30 bg-navy-950 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/admin"><Logo light /></Link>
          <div className="flex items-center gap-1">
            {IS_DEMO && <button onClick={() => setConfirmReset(true)} className="rounded-lg p-2 text-amber-300" aria-label="Reset demo data"><RotateCcw className="h-4 w-4" /></button>}
            <button onClick={signOut} className="rounded-lg p-2 text-navy-200" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="Admin">
          {NAV.map(({ to, end, label, icon: I }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-white/10 text-white' : 'text-navy-300')}>
              <I className="h-4 w-4" aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Outlet />
      </main>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        size="max-w-md"
        footer={<><button className="btn-outline" onClick={() => setConfirmReset(false)}>Cancel</button><button className="btn-navy" onClick={reset}>Reset data</button></>}
      >
        <p className="text-sm text-navy-600">This restores the original fictional vacancies and applicants and clears anything you submitted in this browser. It does not affect anyone else.</p>
      </Modal>
    </div>
  );
}

export function AdminPageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
