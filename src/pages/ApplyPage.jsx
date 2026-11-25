import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UploadCloud, FileText, X, Lock, Send, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { api } from '../services/api.js';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { Field, PageLoader, Spinner, Modal } from '../components/ui/index.jsx';
import { validateApplication, validateResumeFile, checkFileSignature, LIMITS, UPLOAD, EXPERIENCE_LEVELS } from '../lib/validation.js';
import { formatBytes, cx } from '../lib/utils.js';
import { IS_DEMO, TURNSTILE_SITE_KEY } from '../lib/config.js';
import { PrivacyContent } from './PrivacyPage.jsx';

const EMPTY = { fullName: '', email: '', phone: '', jobId: '', experience: '', coverLetter: '', consent: false };

/** Optional Cloudflare Turnstile widget (production only, when a site key is configured). */
function Turnstile({ onToken }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || IS_DEMO) return;
    const render = () => window.turnstile?.render(ref.current, { sitekey: TURNSTILE_SITE_KEY, callback: onToken, 'expired-callback': () => onToken('') });
    if (window.turnstile) return void render();
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.onload = render;
    document.head.appendChild(s);
  }, [onToken]);
  if (!TURNSTILE_SITE_KEY || IS_DEMO) return null;
  return <div ref={ref} className="mt-2" />;
}

function ResumeDrop({ file, onFile, error, fieldProps }) {
  const [drag, setDrag] = useState(false);
  const input = useRef(null);
  const pick = (f) => f && onFile(f);
  return (
    <div>
      {file ? (
        <div className={cx('flex items-center gap-3 rounded-xl border p-4', error ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-emerald-50/60')}>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-card"><FileText className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900">{file.name}</p>
            <p className="text-xs text-navy-500">{formatBytes(file.size)}</p>
          </div>
          <button type="button" className="rounded-lg p-2 text-navy-500 hover:bg-white" onClick={() => { onFile(null); if (input.current) input.current.value = ''; }} aria-label="Remove selected resume">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={fieldProps.id}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
          className={cx(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition',
            drag ? 'border-emerald-500 bg-emerald-50' : error ? 'border-red-300 bg-red-50/40' : 'border-line bg-mist/50 hover:border-navy-200 hover:bg-mist',
          )}
        >
          <UploadCloud className="h-8 w-8 text-navy-400" aria-hidden="true" />
          <span className="mt-3 text-sm font-semibold text-navy-800">
            <span className="text-emerald-700 underline underline-offset-2">Choose a file</span> or drag it here
          </span>
          <span className="mt-1 text-xs text-navy-400">PDF, DOC or DOCX · max {UPLOAD.maxLabel}</span>
        </label>
      )}
      <input
        ref={input}
        {...fieldProps}
        type="file"
        className="sr-only"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}

export default function ApplyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: jobs, loading } = useAsync(() => api.listPublishedJobs(), []);
  const preselected = useMemo(() => jobs?.find((j) => j.slug === slug), [jobs, slug]);
  useDocumentTitle(preselected ? `Apply — ${preselected.title}` : 'Apply');

  const [values, setValues] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const startedAt = useRef(Date.now());
  const formRef = useRef(null);

  useEffect(() => {
    if (preselected) setValues((v) => ({ ...v, jobId: v.jobId || preselected.id }));
  }, [preselected]);

  const jobIds = jobs?.map((j) => j.id) ?? [];
  const runValidation = (vals = values, f = file) => {
    const { errors: e } = validateApplication(vals, { jobIds });
    const fe = validateResumeFile(f);
    if (fe) e.resume = fe;
    return e;
  };
  const update = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const next = { ...values, [k]: val };
    setValues(next);
    if (touched[k] || errors[k]) setErrors((prev) => ({ ...prev, [k]: runValidation(next)[k] }));
  };
  const blur = (k) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors((prev) => ({ ...prev, [k]: runValidation()[k] }));
  };
  const onFile = async (f) => {
    setFile(f);
    let err = validateResumeFile(f);
    if (!err && f) err = await checkFileSignature(f);
    setErrors((prev) => ({ ...prev, resume: f ? err : touched.resume ? validateResumeFile(null) : undefined }));
    setTouched((t) => ({ ...t, resume: true }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const errs = runValidation();
    if (!errs.resume && file) {
      const sig = await checkFileSignature(file);
      if (sig) errs.resume = sig;
    }
    setErrors(errs);
    setTouched(Object.fromEntries(Object.keys(EMPTY).concat('resume').map((k) => [k, true])));
    if (Object.values(errs).some(Boolean)) {
      setFormError('Please correct the highlighted fields before submitting.');
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 30);
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.submitApplication({ values, file, honeypot, startedAt: startedAt.current, turnstileToken });
      try { sessionStorage.setItem('mc-last-application', JSON.stringify(result)); } catch { /* ignore */ }
      navigate(`/application-submitted/${result.reference}`, { state: result, replace: true });
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  const coverLen = values.coverLetter.trim().length;

  return (
    <div className="bg-mist">
      <div className="container-x py-10 sm:py-14">
        <Link to={preselected ? `/jobs/${preselected.slug}` : '/jobs'} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" /> {preselected ? 'Back to role details' : 'Back to open roles'}
        </Link>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="card p-5 sm:p-8">
            <p className="eyebrow">Application form</p>
            <h1 className="mt-1 text-2xl font-extrabold text-navy-900 sm:text-3xl">{preselected ? `Apply for ${preselected.title}` : 'Apply to Meridian & Co.'}</h1>
            <p className="mt-2 text-sm text-navy-500">Fields marked <span className="text-red-500">*</span> are required. It takes about 10 minutes.</p>

            {formError && (
              <div className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {formError}
              </div>
            )}

            <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-6 space-y-8">
              {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
              <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>

              <fieldset className="space-y-5">
                <legend className="text-base font-bold text-navy-900">1. Your details</legend>
                <Field label="Full name" required error={errors.fullName}>
                  {(p) => <input {...p} className={cx('input', errors.fullName && 'input-error')} value={values.fullName} onChange={update('fullName')} onBlur={blur('fullName')} autoComplete="name" maxLength={LIMITS.fullName.max} placeholder="e.g. Alex Morgan" />}
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Email address" required error={errors.email}>
                    {(p) => <input {...p} type="email" className={cx('input', errors.email && 'input-error')} value={values.email} onChange={update('email')} onBlur={blur('email')} autoComplete="email" inputMode="email" placeholder="you@example.com" />}
                  </Field>
                  <Field label="Contact number" required error={errors.phone}>
                    {(p) => <input {...p} type="tel" className={cx('input', errors.phone && 'input-error')} value={values.phone} onChange={update('phone')} onBlur={blur('phone')} autoComplete="tel" inputMode="tel" placeholder="+1 555 010 2030" maxLength={LIMITS.phone.max} />}
                  </Field>
                </div>
              </fieldset>

              <fieldset className="space-y-5">
                <legend className="text-base font-bold text-navy-900">2. The role</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Position applied for" required error={errors.jobId}>
                    {(p) => (
                      <select {...p} className={cx('input', errors.jobId && 'input-error')} value={values.jobId} onChange={update('jobId')} onBlur={blur('jobId')}>
                        <option value="">Select a position…</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>{j.title} — {j.location}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field label="Relevant experience" required error={errors.experience}>
                    {(p) => (
                      <select {...p} className={cx('input', errors.experience && 'input-error')} value={values.experience} onChange={update('experience')} onBlur={blur('experience')}>
                        <option value="">Select years of experience…</option>
                        {EXPERIENCE_LEVELS.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>
              </fieldset>

              <fieldset className="space-y-5">
                <legend className="text-base font-bold text-navy-900">3. Resume & cover letter</legend>
                <Field label="Resume / CV" required error={errors.resume} id="resume">
                  {(p) => <ResumeDrop file={file} onFile={onFile} error={errors.resume} fieldProps={p} />}
                </Field>
                <Field label="Cover letter" required error={errors.coverLetter} hint={`Tell us why this role interests you and what you would bring (${LIMITS.coverLetter.min}–${LIMITS.coverLetter.max} characters).`}>
                  {(p) => (
                    <div>
                      <textarea {...p} rows={8} className={cx('input resize-y', errors.coverLetter && 'input-error')} value={values.coverLetter} onChange={update('coverLetter')} onBlur={blur('coverLetter')} maxLength={LIMITS.coverLetter.max} placeholder="Dear Hiring Team, …" />
                      <p className={cx('mt-1 text-right text-xs', coverLen && coverLen < LIMITS.coverLetter.min ? 'text-amber-600' : 'text-navy-400')} aria-live="polite">
                        {coverLen} / {LIMITS.coverLetter.max}
                      </p>
                    </div>
                  )}
                </Field>
              </fieldset>

              <fieldset>
                <legend className="text-base font-bold text-navy-900">4. Privacy</legend>
                <Field error={errors.consent} className="mt-3">
                  {(p) => (
                    <label htmlFor={p.id} className={cx('flex cursor-pointer gap-3 rounded-xl border p-4', errors.consent ? 'border-red-300 bg-red-50/50' : 'border-line bg-mist/40')}>
                      <input {...p} type="checkbox" checked={values.consent} onChange={update('consent')} className="mt-0.5 h-5 w-5 shrink-0 rounded border-navy-300 accent-emerald-600" />
                      <span className="text-sm leading-relaxed text-navy-600">
                        I have read the{' '}
                        <button type="button" className="font-semibold text-emerald-700 underline underline-offset-2" onClick={(e) => { e.preventDefault(); setPrivacyOpen(true); }}>
                          Applicant Privacy Notice
                        </button>{' '}
                        and consent to Meridian &amp; Co. processing my personal data to assess my application. Data is retained for 12 months. <span className="text-red-500">*</span>
                      </span>
                    </label>
                  )}
                </Field>
              </fieldset>

              <Turnstile onToken={setTurnstileToken} />

              <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-1.5 text-xs text-navy-400"><Lock className="h-3.5 w-3.5" /> Your resume is stored privately and only visible to our HR team.</p>
                <button type="submit" className="btn-primary px-7 py-3 text-base" disabled={submitting}>
                  {submitting ? <><Spinner className="h-4 w-4" /> Submitting…</> : <><Send className="h-4 w-4" /> Submit application</>}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {preselected && (
              <div className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">You're applying for</p>
                <p className="mt-1 font-bold text-navy-900">{preselected.title}</p>
                <p className="text-sm text-navy-500">{preselected.department} · {preselected.location} · {preselected.employmentType}</p>
              </div>
            )}
            <div className="card p-5">
              <p className="flex items-center gap-2 font-semibold text-navy-900"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Your data is protected</p>
              <ul className="mt-3 space-y-2 text-sm text-navy-500">
                <li>• Resumes are stored in private, encrypted storage</li>
                <li>• Only authorised HR staff can access applications</li>
                <li>• Data deleted after 12 months, or sooner on request</li>
              </ul>
            </div>
            {IS_DEMO && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-semibold"><Info className="h-4 w-4" /> Demo mode</p>
                <p className="mt-1.5 leading-relaxed">Please use fictional details. Your submission is stored only in this browser and no real email is sent — you'll see a preview of both emails instead.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Applicant Privacy Notice" footer={<button className="btn-primary" onClick={() => { setPrivacyOpen(false); setValues((v) => ({ ...v, consent: true })); setErrors((e) => ({ ...e, consent: undefined })); }}>I understand &amp; agree</button>}>
        <PrivacyContent />
      </Modal>
    </div>
  );
}
