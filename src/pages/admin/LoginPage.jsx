import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, LogIn, FlaskConical, ArrowLeft, ShieldCheck, Eye, EyeOff, KeyRound } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth, useDocumentTitle } from '../../lib/hooks.js';
import { IS_DEMO } from '../../lib/config.js';
import { DEMO_CREDENTIALS } from '../../services/demoApi.js';
import { Logo } from '../../components/layout/PublicLayout.jsx';
import { Field, Spinner } from '../../components/ui/index.jsx';

export default function LoginPage() {
  useDocumentTitle('HR sign in');
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && session) return <Navigate to={loc.state?.from || '/admin'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Please enter your email and password.');
    setBusy(true);
    try {
      await api.signIn(email, password);
      navigate(loc.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed.');
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-grid hidden flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <Logo light />
        <div>
          <p className="eyebrow text-emerald-400">HR Recruitment Console</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight">Every candidate, every vacancy — one secure workspace.</h1>
          <ul className="mt-8 space-y-3 text-navy-200">
            {['Review and shortlist applicants', 'Publish and close vacancies', 'Download resumes securely', 'Export reports to CSV'].map((t) => (
              <li key={t} className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-400" /> {t}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-navy-400">Portfolio demonstration by ZC Smart Digital</p>
      </div>
      <div className="flex items-center justify-center bg-mist px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900"><ArrowLeft className="h-4 w-4" /> Back to careers site</Link>
          <div className="card mt-4 p-6 sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-emerald-400"><Lock className="h-5 w-5" /></span>
            <h2 className="mt-5 text-2xl font-extrabold text-navy-900">HR administrator sign in</h2>
            <p className="mt-1 text-sm text-navy-500">Access is restricted to authorised Meridian &amp; Co. HR staff.</p>

            {IS_DEMO && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="flex items-center gap-1.5 font-semibold"><FlaskConical className="h-4 w-4" /> Demo credentials (simulated login)</p>
                <dl className="mt-2 space-y-1 font-mono text-xs">
                  <div><dt className="inline text-amber-700">Email: </dt><dd className="inline">{DEMO_CREDENTIALS.email}</dd></div>
                  <div><dt className="inline text-amber-700">Password: </dt><dd className="inline">{DEMO_CREDENTIALS.password}</dd></div>
                </dl>
                <button type="button" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800" onClick={() => { setEmail(DEMO_CREDENTIALS.email); setPassword(DEMO_CREDENTIALS.password); }}>
                  <KeyRound className="h-3.5 w-3.5" /> Fill demo credentials
                </button>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
              <Field label="Work email" required>
                {(p) => <input {...p} type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />}
              </Field>
              <Field label="Password" required>
                {(p) => (
                  <div className="relative">
                    <input {...p} type={show ? 'text' : 'password'} autoComplete="current-password" className="input pr-11" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-navy-400 hover:text-navy-700" aria-label={show ? 'Hide password' : 'Show password'}>
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </Field>
              <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : <LogIn className="h-4 w-4" />} Sign in</button>
            </form>
            {!IS_DEMO && <p className="mt-4 text-xs text-navy-400">Accounts are provisioned by an administrator in Supabase Auth. Self-registration is disabled.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
