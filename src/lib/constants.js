export { EXPERIENCE_LEVELS } from '../../supabase/functions/_shared/rules.js';

export const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Operations', 'Finance', 'People & Culture', 'Sales'];
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
export const LOCATIONS = ['Lakeview City (HQ)', 'Northgate Office', 'Remote', 'Hybrid'];

export const JOB_STATUSES = {
  draft: { label: 'Draft', tone: 'gray' },
  published: { label: 'Published', tone: 'emerald' },
  closed: { label: 'Closed', tone: 'red' },
};

export const APPLICATION_STATUSES = {
  new: { label: 'New', tone: 'blue' },
  shortlisted: { label: 'Shortlisted', tone: 'amber' },
  interviewed: { label: 'Interviewed', tone: 'violet' },
  hired: { label: 'Hired', tone: 'emerald' },
  rejected: { label: 'Rejected', tone: 'red' },
};
export const APPLICATION_STATUS_KEYS = Object.keys(APPLICATION_STATUSES);
