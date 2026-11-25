-- Seed vacancies for a fresh environment (fictional). Run with `supabase db reset`
-- locally, or paste into the SQL editor. No applicant data is seeded in production.

insert into public.jobs (slug, title, department, location, employment_type, salary_min, salary_max, summary, responsibilities, qualifications, nice_to_have, status, closes_at)
values
('senior-full-stack-engineer', 'Senior Full-Stack Engineer', 'Engineering', 'Hybrid', 'Full-time', 120000, 150000,
 'Lead the design and delivery of client-facing platforms used by thousands of professionals every day.',
 array['Design, build and maintain React and Node.js services','Own features end-to-end','Mentor mid-level engineers'],
 array['6+ years of professional software engineering experience','TypeScript, React and PostgreSQL'],
 array['Supabase or Firebase experience'], 'published', current_date + 30),
('product-designer', 'Product Designer (UX/UI)', 'Design', 'Lakeview City (HQ)', 'Full-time', 85000, 105000,
 'Shape intuitive, accessible experiences for our advisory tools.',
 array['Lead discovery interviews and usability tests','Produce flows and prototypes in Figma','Maintain the design system'],
 array['3+ years of product design experience','Portfolio demonstrating end-to-end process'],
 array['B2B data-heavy tools'], 'published', current_date + 21),
('digital-marketing-specialist', 'Digital Marketing Specialist', 'Marketing', 'Remote', 'Full-time', 60000, 75000,
 'Plan and run multi-channel campaigns that grow awareness with B2B decision makers.',
 array['Run paid search, social and email campaigns','Manage the content calendar','Report weekly on performance'],
 array['2+ years in B2B digital marketing','Google Ads and LinkedIn Ads'],
 array['HubSpot certification'], 'published', current_date + 28),
('hr-generalist', 'HR Generalist', 'People & Culture', 'Northgate Office', 'Full-time', 55000, 68000,
 'Support every stage of the employee lifecycle.',
 array['Coordinate onboarding and offboarding','First point of contact for employee relations','Maintain HR records'],
 array['2+ years of generalist HR experience','High discretion with confidential information'],
 array['SHRM-CP or equivalent'], 'published', current_date + 14),
('financial-analyst', 'Financial Analyst', 'Finance', 'Lakeview City (HQ)', 'Full-time', 70000, 88000,
 'Build forecasts, analyse engagement profitability and help leaders plan for growth.',
 array['Monthly forecasts and annual budgets','Project profitability analysis','Support month-end close'],
 array['Degree in Finance or related field','2+ years in FP&A'],
 array['Power BI or Looker'], 'published', current_date + 25),
('operations-coordinator', 'Operations Coordinator', 'Operations', 'Hybrid', 'Part-time', 32000, 38000,
 'Keep our offices and project teams running smoothly — 24 hours per week.',
 array['Coordinate vendors and facilities','Schedule client workshops','Maintain process documentation'],
 array['1+ year in an administrative role','Google Workspace or Microsoft 365'],
 array['Event planning'], 'published', current_date + 35),
('data-analytics-intern', 'Data Analytics Intern', 'Engineering', 'Remote', 'Internship', 24000, null,
 'A paid 6-month internship working on real client analytics projects.',
 array['Clean and visualise datasets','Write SQL and build dashboards'],
 array['Studying or recently graduated in a quantitative field','Basic SQL'],
 array['Python or R'], 'published', current_date + 40)
on conflict (slug) do nothing;

-- Grant dashboard access to an HR user AFTER creating them in Auth → Users:
-- insert into public.admin_users (user_id, full_name)
-- select id, 'Jane HR' from auth.users where email = 'hr@your-company.com';
