// Fictional seed data for the public demo. Every person, email and phone number
// here is invented. Emails use the reserved example.com domain (RFC 2606) and
// phone numbers use the 555 fictional range.

const daysAgo = (d, h = 10) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, (d * 7) % 60, 0, 0);
  return t.toISOString();
};
const daysAhead = (d) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

export const SEED_JOBS = [
  {
    id: 'job-001',
    slug: 'senior-full-stack-engineer',
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 120000,
    salaryMax: 150000,
    summary:
      'Lead the design and delivery of client-facing platforms used by thousands of professionals every day. You will own features end-to-end, from database schema to polished UI.',
    responsibilities: [
      'Design, build and maintain React and Node.js services for our client delivery platform',
      'Own features end-to-end: technical design, implementation, testing and release',
      'Review code and mentor two to three mid-level engineers',
      'Partner with Design and Product to shape the roadmap each quarter',
      'Improve observability, performance and accessibility across the stack',
    ],
    qualifications: [
      '6+ years of professional software engineering experience',
      'Deep knowledge of TypeScript, React and a relational database (PostgreSQL preferred)',
      'Experience designing secure REST or GraphQL APIs',
      'Clear written communication and a habit of documenting decisions',
    ],
    niceToHave: ['Experience with Supabase or Firebase', 'Cloud infrastructure (AWS, GCP or Azure)'],
    status: 'published',
    postedAt: daysAgo(6),
    closesAt: daysAhead(30),
  },
  {
    id: 'job-002',
    slug: 'product-designer',
    title: 'Product Designer (UX/UI)',
    department: 'Design',
    location: 'Lakeview City (HQ)',
    employmentType: 'Full-time',
    salaryMin: 85000,
    salaryMax: 105000,
    summary:
      'Shape intuitive, accessible experiences for our advisory tools. You will run discovery, prototype quickly and ship polished interfaces with engineering.',
    responsibilities: [
      'Lead discovery interviews and usability tests with client users',
      'Produce flows, wireframes and high-fidelity prototypes in Figma',
      'Contribute to and maintain the Meridian design system',
      'Ensure every release meets WCAG 2.2 AA accessibility standards',
    ],
    qualifications: [
      '3+ years of product or UX/UI design experience',
      'A portfolio demonstrating end-to-end design process',
      'Strong interaction design and visual design skills',
      'Comfort presenting work to senior stakeholders',
    ],
    niceToHave: ['Experience designing data-heavy B2B tools', 'Basic HTML/CSS knowledge'],
    status: 'published',
    postedAt: daysAgo(10),
    closesAt: daysAhead(21),
  },
  {
    id: 'job-003',
    slug: 'digital-marketing-specialist',
    title: 'Digital Marketing Specialist',
    department: 'Marketing',
    location: 'Remote',
    employmentType: 'Full-time',
    salaryMin: 60000,
    salaryMax: 75000,
    summary:
      'Plan and run multi-channel campaigns that grow awareness of Meridian & Co. with mid-market and enterprise decision makers.',
    responsibilities: [
      'Plan and execute paid search, paid social and email campaigns',
      'Manage the content calendar for LinkedIn and the company blog',
      'Report on campaign performance and recommend optimisations weekly',
      'Coordinate with designers and freelance writers on campaign assets',
    ],
    qualifications: [
      '2+ years in B2B digital marketing',
      'Hands-on experience with Google Ads, LinkedIn Ads and an email platform',
      'Confident with analytics tools and spreadsheets',
      'Excellent written English',
    ],
    niceToHave: ['HubSpot certification', 'SEO experience'],
    status: 'published',
    postedAt: daysAgo(3),
    closesAt: daysAhead(28),
  },
  {
    id: 'job-004',
    slug: 'hr-generalist',
    title: 'HR Generalist',
    department: 'People & Culture',
    location: 'Northgate Office',
    employmentType: 'Full-time',
    salaryMin: 55000,
    salaryMax: 68000,
    summary:
      'Support every stage of the employee lifecycle, from onboarding to development, and help us keep Meridian a great place to work.',
    responsibilities: [
      'Coordinate onboarding and offboarding for new and departing employees',
      'Act as first point of contact for employee relations questions',
      'Maintain HR records and ensure policy compliance',
      'Support quarterly engagement surveys and action planning',
    ],
    qualifications: [
      '2+ years of generalist HR experience',
      'Working knowledge of employment law and HR best practice',
      'High discretion when handling confidential information',
      'Organised, empathetic and approachable',
    ],
    niceToHave: ['HR certification (e.g. SHRM-CP or equivalent)', 'Experience with an HRIS'],
    status: 'published',
    postedAt: daysAgo(14),
    closesAt: daysAhead(14),
  },
  {
    id: 'job-005',
    slug: 'financial-analyst',
    title: 'Financial Analyst',
    department: 'Finance',
    location: 'Lakeview City (HQ)',
    employmentType: 'Full-time',
    salaryMin: 70000,
    salaryMax: 88000,
    summary:
      'Turn numbers into decisions. Build forecasts, analyse engagement profitability and help leaders plan for growth.',
    responsibilities: [
      'Build and maintain monthly forecasts and annual budgets',
      'Analyse project profitability and present insights to practice leads',
      'Support month-end close and variance reporting',
      'Automate recurring reports to reduce manual effort',
    ],
    qualifications: [
      'Degree in Finance, Accounting, Economics or a related field',
      '2+ years in FP&A or a similar analytical role',
      'Advanced Excel / Google Sheets modelling skills',
    ],
    niceToHave: ['Power BI or Looker experience', 'Progress toward CFA or CPA'],
    status: 'published',
    postedAt: daysAgo(8),
    closesAt: daysAhead(25),
  },
  {
    id: 'job-006',
    slug: 'operations-coordinator',
    title: 'Operations Coordinator',
    department: 'Operations',
    location: 'Hybrid',
    employmentType: 'Part-time',
    salaryMin: 32000,
    salaryMax: 38000,
    summary:
      'Keep our offices and project teams running smoothly — 24 hours per week, with flexible scheduling.',
    responsibilities: [
      'Coordinate vendors, facilities requests and office supplies',
      'Schedule client workshops and book travel for project teams',
      'Maintain process documentation in our internal wiki',
    ],
    qualifications: [
      '1+ year in an administrative or coordination role',
      'Strong organisational and time-management skills',
      'Proficiency with Google Workspace or Microsoft 365',
    ],
    niceToHave: ['Event planning experience'],
    status: 'published',
    postedAt: daysAgo(2),
    closesAt: daysAhead(35),
  },
  {
    id: 'job-007',
    slug: 'data-analytics-intern',
    title: 'Data Analytics Intern',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Internship',
    salaryMin: 24000,
    salaryMax: null,
    summary:
      'A paid 6-month internship working alongside our data team on real client analytics projects. Mentorship and training included.',
    responsibilities: [
      'Clean, analyse and visualise datasets for client projects',
      'Write SQL queries and build dashboards',
      'Present findings to the analytics team every sprint',
    ],
    qualifications: [
      'Currently studying or recently graduated in a quantitative field',
      'Basic SQL and spreadsheet skills',
      'Curiosity and a willingness to learn',
    ],
    niceToHave: ['Python or R', 'Any dashboarding tool'],
    status: 'published',
    postedAt: daysAgo(1),
    closesAt: daysAhead(40),
  },
  {
    id: 'job-008',
    slug: 'account-executive',
    title: 'Account Executive',
    department: 'Sales',
    location: 'Northgate Office',
    employmentType: 'Full-time',
    salaryMin: 65000,
    salaryMax: 80000,
    summary: 'Draft role — compensation plan pending approval from Finance.',
    responsibilities: ['Own a book of mid-market accounts', 'Build pipeline through outbound and partner referrals'],
    qualifications: ['3+ years in B2B services sales'],
    niceToHave: [],
    status: 'draft',
    postedAt: null,
    closesAt: daysAhead(45),
  },
  {
    id: 'job-009',
    slug: 'it-support-specialist',
    title: 'IT Support Specialist',
    department: 'Operations',
    location: 'Lakeview City (HQ)',
    employmentType: 'Contract',
    salaryMin: 48000,
    salaryMax: 55000,
    summary: 'Twelve-month contract supporting our device refresh programme. This vacancy has been filled.',
    responsibilities: ['Provision and support laptops and peripherals', 'Resolve first-line support tickets'],
    qualifications: ['2+ years in IT support', 'Experience with Windows and macOS device management'],
    niceToHave: [],
    status: 'closed',
    postedAt: daysAgo(60),
    closesAt: daysAgo(20).slice(0, 10),
  },
];

const people = [
  ['Avery Thompson', 'job-001', '10+ years', 'shortlisted', 2],
  ['Jordan Rivera', 'job-001', '6–9 years', 'interviewed', 5],
  ['Priya Natarajan', 'job-001', '6–9 years', 'new', 0],
  ['Marcus Bell', 'job-002', '3–5 years', 'new', 1],
  ['Sofia Lindqvist', 'job-002', '6–9 years', 'shortlisted', 4],
  ['Daniel Okafor', 'job-003', '1–2 years', 'rejected', 9],
  ['Hannah Kim', 'job-003', '3–5 years', 'new', 0],
  ['Leo Martins', 'job-004', '3–5 years', 'hired', 18],
  ['Grace Whitfield', 'job-004', '1–2 years', 'rejected', 12],
  ['Ethan Caldwell', 'job-005', '3–5 years', 'interviewed', 7],
  ['Mei Tanaka', 'job-005', '1–2 years', 'new', 3],
  ['Samuel Ortiz', 'job-006', 'Less than 1 year', 'new', 1],
  ['Chloe Dubois', 'job-007', 'Less than 1 year', 'shortlisted', 1],
  ['Noah Fischer', 'job-009', '3–5 years', 'hired', 35],
];

const REFS = ['K7Q2MX', 'P3ZT8H', 'W9DN4C', 'B6RJ2V', 'T4LX9E', 'H8MC3Q', 'N2VZ7K', 'F5QW8D', 'R3JH6T', 'C9XP2M', 'G7KD4W', 'L2TB8N', 'V6EH3R', 'Z4MQ9P'];

export const SEED_APPLICATIONS = people.map(([fullName, jobId, experience, status, ago], i) => {
  const [first, last] = fullName.toLowerCase().split(' ');
  return {
    id: `app-${String(i + 1).padStart(3, '0')}`,
    reference: `MC-${new Date().getFullYear()}-${REFS[i]}`,
    fullName,
    email: `${first}.${last}@example.com`,
    phone: `+1 (555) ${200 + i * 7}-${1000 + i * 137}`,
    jobId,
    experience,
    coverLetter: `Dear Hiring Team,\n\nI am excited to apply for this role at Meridian & Co. Over the past few years I have delivered projects that closely match the responsibilities in your listing, and I admire the way your teams combine advisory depth with practical delivery.\n\nI would welcome the chance to discuss how I can contribute.\n\nKind regards,\n${fullName}`,
    status,
    notes: status === 'hired' ? 'Offer accepted. Start date confirmed.' : status === 'interviewed' ? 'Strong technical round. Awaiting panel feedback.' : '',
    resumeName: `${first}-${last}-resume.pdf`,
    resumeSize: 48000 + i * 3100,
    resumeType: 'application/pdf',
    consent: true,
    createdAt: daysAgo(ago, 9 + (i % 8)),
    updatedAt: daysAgo(Math.max(0, ago - 1), 15),
  };
});

/** Builds a tiny but valid one-page PDF so seeded resumes are genuinely downloadable. */
export function makeDemoResumePdf(app, jobTitle) {
  const esc = (s) => String(s).replace(/[()\\]/g, (c) => `\\${c}`);
  const lines = [
    [24, 760, app.fullName],
    [12, 738, `${app.email}  |  ${app.phone}`],
    [11, 712, `Applying for: ${jobTitle}`],
    [11, 694, `Relevant experience: ${app.experience}`],
    [11, 660, 'FICTIONAL DEMO RESUME - generated by the Meridian & Co. careers portfolio demo.'],
    [11, 642, 'This person does not exist. No real applicant data is stored in the public demo.'],
  ];
  const stream = lines.map(([size, y, t]) => `BT /F1 ${size} Tf 56 ${y} Td (${esc(t)}) Tj ET`).join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}
