// RFC 4180 CSV with spreadsheet formula-injection protection
// (cells beginning with = + - @ tab or CR are prefixed with an apostrophe).
export function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows, columns) {
  const header = columns.map((c) => csvCell(c.label)).join(',');
  const body = rows.map((r) =>
    columns.map((c) => csvCell(typeof c.value === 'function' ? c.value(r) : r[c.value])).join(','),
  );
  return '﻿' + [header, ...body].join('\r\n');
}

export const APPLICATION_CSV_COLUMNS = [
  { label: 'Reference', value: 'reference' },
  { label: 'Submitted (UTC)', value: (r) => new Date(r.createdAt).toISOString() },
  { label: 'Full name', value: 'fullName' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Position', value: 'jobTitle' },
  { label: 'Department', value: 'department' },
  { label: 'Experience', value: 'experience' },
  { label: 'Status', value: 'status' },
  { label: 'Resume file', value: 'resumeName' },
  { label: 'HR notes', value: 'notes' },
];
