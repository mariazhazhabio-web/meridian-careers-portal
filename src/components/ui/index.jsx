import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cx } from '../../lib/utils.js';
import { APPLICATION_STATUSES, JOB_STATUSES } from '../../lib/constants.js';

const TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  navy: 'bg-navy-50 text-navy-700 ring-navy-100',
};

export function Badge({ tone = 'gray', className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, kind = 'application' }) {
  const map = kind === 'job' ? JOB_STATUSES : APPLICATION_STATUSES;
  const s = map[status] || { label: status, tone: 'gray' };
  return (
    <Badge tone={s.tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {s.label}
    </Badge>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={cx('animate-spin', className)} aria-hidden="true" />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-navy-400" role="status">
      <Spinner /> <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-mist/50 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy-400 shadow-card">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-navy-500">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({ label, error, hint, required, children, id: idProp, className }) {
  const auto = useId();
  const id = idProp || auto;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy, 'aria-required': required || undefined })}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-navy-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'max-w-2xl', footer }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('input,select,textarea,button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className={cx('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-lift sm:rounded-2xl animate-fade-up', size)}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h2 id="modal-title" className="text-lg font-bold text-navy-900">
            {title}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 hover:bg-mist hover:text-navy-700" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

// ── Toasts ────────────────────────────────────────────────────────────────
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icons[t.tone] || Info;
          return (
            <div
              key={t.id}
              className={cx(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lift animate-fade-up',
                t.tone === 'error' ? 'bg-red-600 text-white' : 'bg-navy-900 text-white',
              )}
            >
              <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', t.tone === 'error' ? 'text-white' : 'text-emerald-400')} />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function Avatar({ name, className = 'h-10 w-10 text-sm' }) {
  const initials = String(name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const palette = ['bg-navy-100 text-navy-700', 'bg-emerald-100 text-emerald-800', 'bg-sky-100 text-sky-800', 'bg-amber-100 text-amber-800', 'bg-violet-100 text-violet-800'];
  const c = palette[[...String(name)].reduce((s, ch) => s + ch.charCodeAt(0), 0) % palette.length];
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', c, className)} aria-hidden="true">
      {initials}
    </span>
  );
}
