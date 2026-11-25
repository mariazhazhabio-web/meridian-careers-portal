// Central runtime configuration. Only VITE_* variables reach the browser.
// The Supabase service-role key is NEVER read here — it only exists inside Edge Functions.
const env = import.meta.env;

export const APP_MODE = env.VITE_APP_MODE === 'production' ? 'production' : 'demo';
export const IS_DEMO = APP_MODE === 'demo';
export const ROUTER = env.VITE_ROUTER === 'browser' ? 'browser' : 'hash';

export const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';
export const TURNSTILE_SITE_KEY = env.VITE_TURNSTILE_SITE_KEY || '';
export const HR_EMAIL = env.VITE_HR_EMAIL || 'careers@meridian-co.example';

export const COMPANY = {
  name: 'Meridian & Co.',
  tagline: 'Advisory, technology and operations for organisations that build what lasts.',
  agency: 'ZC Smart Digital',
  hrPhone: '+1 (555) 014-2290',
  hrHours: 'Mon–Fri, 9:00 AM – 5:00 PM',
  address: '400 Harbour Point, Suite 1200, Lakeview City',
};
