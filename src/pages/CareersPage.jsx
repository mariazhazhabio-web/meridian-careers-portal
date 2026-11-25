import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, HeartPulse, Plane, GraduationCap, Laptop, PiggyBank, Baby, Sparkles, Target, Handshake, Leaf,
  FileText, ClipboardCheck, MessagesSquare, Users, BadgeCheck, ChevronDown, Mail, Phone, Clock, MapPin, Building2, Globe2, Award,
} from 'lucide-react';
import JobBrowser from '../components/careers/JobBrowser.jsx';
import { PageLoader } from '../components/ui/index.jsx';
import { api } from '../services/api.js';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { COMPANY, HR_EMAIL } from '../lib/config.js';
import { cx } from '../lib/utils.js';

function SectionHeader({ eyebrow, title, lead, center }) {
  return (
    <div className={cx(center && 'mx-auto text-center')}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {lead && <p className={cx('section-lead', center && 'mx-auto')}>{lead}</p>}
    </div>
  );
}

function Hero({ count }) {
  return (
    <section className="hero-grid relative overflow-hidden bg-navy-900 text-white">
      <div className="container-x grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> We're hiring · {count} open {count === 1 ? 'role' : 'roles'}
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            Do the best work <br className="hidden sm:block" />
            of your career, <span className="text-emerald-400">with people who care.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">
            Join Meridian &amp; Co. — 420 advisors, engineers and operators helping organisations grow with clarity. Flexible work, real ownership and a team that has your back.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/jobs" className="btn-primary px-6 py-3 text-base">
              Explore open roles <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#process" className="btn px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/10">
              How we hire
            </a>
          </div>
        </div>
        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="absolute -inset-6 rounded-[2rem] bg-emerald-500/10 blur-2xl" />
          <div className="relative grid grid-cols-2 gap-4">
            {[
              ['4.7 / 5', 'Employee rating', Award],
              ['92%', 'Would recommend us', Users],
              ['18', 'Countries we serve', Globe2],
              ['30 days', 'Paid time off', Plane],
            ].map(([v, l, I], i) => (
              <div key={l} className={cx('rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur', i % 2 && 'translate-y-8')}>
                <I className="h-6 w-6 text-emerald-400" />
                <p className="mt-6 font-display text-3xl font-extrabold">{v}</p>
                <p className="mt-1 text-sm text-navy-200">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const stats = [['420+', 'Team members'], ['2004', 'Founded'], ['3', 'Offices & remote hubs'], ['46%', 'Women in leadership']];
  return (
    <section id="about" className="section scroll-mt-20">
      <div className="container-x grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeader
            eyebrow="About Meridian & Co."
            title="Practical expertise. Lasting impact."
            lead="For two decades we have helped mid-market and enterprise clients modernise their operations, finances and technology. We are independent, employee-led and obsessed with doing work that still matters five years from now."
          />
          <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map(([v, l]) => (
              <div key={l}>
                <dt className="text-xs font-medium text-navy-400">{l}</dt>
                <dd className="mt-1 font-display text-2xl font-extrabold text-navy-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [Building2, 'Advisory', 'Strategy, finance and organisational design for growing businesses.'],
            [Laptop, 'Technology', 'Platforms, data and automation delivered by in-house engineers.'],
            [ClipboardCheck, 'Operations', 'Process excellence that turns plans into everyday results.'],
            [Leaf, 'Sustainability', 'Measurable ESG programmes for clients and for ourselves.'],
          ].map(([I, t, d]) => (
            <div key={t} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><I className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-4 font-semibold text-navy-900">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    [HeartPulse, 'Health & wellbeing', 'Comprehensive medical, dental and vision cover for you and your dependants, plus a monthly wellness allowance.'],
    [Plane, '30 days paid leave', 'Thirty days of annual leave plus public holidays, and a paid week off between Christmas and New Year.'],
    [Laptop, 'Flexible & hybrid', 'Choose the mix of home and office that works for you. Core hours 10–3, everything else is yours.'],
    [GraduationCap, '$2,500 learning budget', 'Annual budget for courses, certifications and conferences, plus two paid study days.'],
    [PiggyBank, 'Retirement matching', '6% retirement contribution matching from day one, with financial planning sessions.'],
    [Baby, 'Family first', '20 weeks fully paid parental leave for all parents, and a phased return-to-work programme.'],
  ];
  return (
    <section id="benefits" className="section scroll-mt-20 bg-mist">
      <div className="container-x">
        <SectionHeader center eyebrow="Benefits" title="We invest in you, inside and outside of work" lead="Competitive pay is the starting point. These benefits apply to every permanent employee from their first day." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(([I, t, d]) => (
            <div key={t} className="card p-6 sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-emerald-400"><I className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-5 text-lg font-bold text-navy-900">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Culture() {
  const values = [
    [Target, 'Own the outcome', 'We take responsibility from first draft to final result — and we celebrate the people who do.'],
    [Handshake, 'Candour with care', 'We give honest feedback kindly, and we expect the same in return.'],
    [Sparkles, 'Keep getting better', 'Curiosity is a job requirement. Every team runs regular retrospectives and learning sessions.'],
    [Users, 'Belong, as you are', 'Employee resource groups, inclusive hiring panels and transparent pay bands.'],
  ];
  return (
    <section id="culture" className="section scroll-mt-20">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="relative order-2 lg:order-1">
          <div className="rounded-3xl bg-navy-900 p-8 text-white sm:p-10">
            <p className="font-display text-2xl font-semibold leading-snug sm:text-3xl">
              “I was trusted with a client workstream in my second month. The support from my team made it feel like an opportunity, not a risk.”
            </p>
            <div className="mt-8 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 font-bold text-navy-950" aria-hidden="true">RA</span>
              <div>
                <p className="font-semibold">Riya Anand</p>
                <p className="text-sm text-navy-300">Senior Consultant, joined 2023 · fictional testimonial</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            {[['11', 'Employee groups'], ['38 hrs', 'Avg. learning / yr'], ['24', 'Volunteer days']].map(([v, l]) => (
              <div key={l} className="card px-2 py-4">
                <p className="font-display text-xl font-extrabold text-navy-900">{v}</p>
                <p className="mt-0.5 text-xs text-navy-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <SectionHeader eyebrow="Our culture" title="The way we work together" lead="Our values are not posters on a wall — they are how we hire, promote and make decisions." />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {values.map(([I, t, d]) => (
              <div key={t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><I className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <h3 className="font-semibold text-navy-900">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy-500">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OpenPositions() {
  const { data: jobs, loading, error } = useAsync(() => api.listPublishedJobs(), []);
  return (
    <section id="positions" className="section scroll-mt-20 bg-mist">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader eyebrow="Open positions" title="Find your next role" lead="Search by title or filter by department, employment type and location." />
        </div>
        <div className="mt-10">
          {loading ? <PageLoader label="Loading roles…" /> : error ? <p className="text-red-600">{error.message}</p> : <JobBrowser jobs={jobs} limit={6} />}
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    [FileText, 'Apply online', 'Submit your application and resume in about 10 minutes. You will receive a reference number instantly.', '10 min'],
    [ClipboardCheck, 'Application review', 'A recruiter reads every application — no automated rejections. We reply within 5 business days.', '≤ 5 days'],
    [MessagesSquare, 'First conversation', 'A 30-minute video call with your recruiter about your goals and the role.', '30 min'],
    [Users, 'Team interview', 'Meet your future manager and teammates. Some roles include a short, paid practical exercise.', '1–2 hrs'],
    [BadgeCheck, 'Offer & onboarding', 'We make a transparent offer and guide you through a structured 90-day onboarding plan.', '1 week'],
  ];
  return (
    <section id="process" className="section scroll-mt-20">
      <div className="container-x">
        <SectionHeader center eyebrow="Recruitment process" title="A clear, respectful hiring process" lead="Most candidates go from application to offer in three to four weeks. You will always know where you stand." />
        <ol className="relative mt-14 grid gap-6 md:grid-cols-5">
          <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 md:block" aria-hidden="true" />
          {steps.map(([I, t, d, time], i) => (
            <li key={t} className="relative flex gap-4 md:flex-col md:gap-0">
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-900 text-emerald-400 ring-8 ring-white"><I className="h-5 w-5" aria-hidden="true" /></span>
              <div className="md:mt-5">
                <p className="text-xs font-semibold text-emerald-600">Step {i + 1} · {time}</p>
                <h3 className="mt-1 font-bold text-navy-900">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQS = [
  ['Can I apply for more than one role?', 'Yes. You can apply for up to three roles at a time. Each application receives its own reference number and is reviewed independently.'],
  ['What file formats do you accept for resumes?', 'PDF, DOC and DOCX files up to 5 MB. PDF is recommended so your formatting is preserved.'],
  ['How long does the hiring process take?', 'Typically three to four weeks from application to offer. We reply to every application within five business days.'],
  ['Do you offer remote or hybrid work?', 'Yes. Each listing shows whether the role is on-site, hybrid or remote. Most teams work hybrid with core hours of 10 AM – 3 PM.'],
  ['Do you sponsor work visas?', 'For selected senior roles we can support visa sponsorship. Please mention it in your cover letter so we can confirm early.'],
  ['How is my personal data used?', 'Your data is used only to assess your application, stored securely with restricted access, and deleted after 12 months unless you ask us to keep it longer. See our Applicant Privacy Notice.'],
  ['I need an adjustment during the process. Who do I contact?', `Email ${HR_EMAIL} and we will gladly arrange reasonable adjustments, such as extra time or an alternative interview format.`],
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section scroll-mt-20 bg-mist">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions" lead="Can't find what you are looking for? Our Talent team is happy to help." />
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q}>
                <h3>
                  <button
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-navy-900 hover:bg-mist/60 sm:px-6"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    {q}
                    <ChevronDown className={cx('h-5 w-5 shrink-0 text-navy-400 transition', isOpen && 'rotate-180 text-emerald-600')} aria-hidden="true" />
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!isOpen} className="px-5 pb-5 text-sm leading-relaxed text-navy-500 sm:px-6">
                  {a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section scroll-mt-20">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-white sm:px-12 sm:py-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow text-emerald-400">HR contact</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Questions? Talk to our Talent team.</h2>
              <p className="mt-4 max-w-lg text-navy-200">Whether you are unsure which role fits, need an adjustment, or want to follow up on an application, we are here to help.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={`mailto:${HR_EMAIL}`} className="btn-primary px-6 py-3"><Mail className="h-4 w-4" /> Email the Talent team</a>
                <Link to="/jobs" className="btn px-6 py-3 text-white ring-1 ring-white/25 hover:bg-white/10">Browse roles</Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                [Mail, 'Email', HR_EMAIL],
                [Phone, 'Phone', COMPANY.hrPhone],
                [Clock, 'Hours', COMPANY.hrHours],
                [MapPin, 'Office', COMPANY.address],
              ].map(([I, l, v]) => (
                <li key={l} className="flex items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                  <I className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-navy-300">{l}</p>
                    <p className="mt-0.5 break-words font-medium">{v}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CareersPage() {
  useDocumentTitle('');
  const { data: jobs } = useAsync(() => api.listPublishedJobs(), []);
  return (
    <>
      <Hero count={jobs?.length ?? 0} />
      <About />
      <Benefits />
      <Culture />
      <OpenPositions />
      <Process />
      <FAQ />
      <Contact />
    </>
  );
}
