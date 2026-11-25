import { APPLICATION_STATUS_KEYS } from './constants.js';

/** Pure recruitment statistics — unit tested in tests/unit/stats.test.js */
export function computeStats(applications, jobs, now = new Date()) {
  const DAY = 86400e3;
  const byStatus = Object.fromEntries(APPLICATION_STATUS_KEYS.map((k) => [k, 0]));
  const byDepartment = {};
  const byJob = {};
  for (const a of applications) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byDepartment[a.department] = (byDepartment[a.department] || 0) + 1;
    byJob[a.jobId] = (byJob[a.jobId] || 0) + 1;
  }
  const last7 = applications.filter((a) => now - new Date(a.createdAt) < 7 * DAY).length;
  const prev7 = applications.filter((a) => {
    const age = now - new Date(a.createdAt);
    return age >= 7 * DAY && age < 14 * DAY;
  }).length;

  // Daily submissions for the last 14 days (oldest → newest)
  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    const next = new Date(d.getTime() + DAY);
    return { date: d.toISOString(), count: applications.filter((a) => new Date(a.createdAt) >= d && new Date(a.createdAt) < next).length };
  });

  const decided = byStatus.hired + byStatus.rejected;
  const progressed = byStatus.shortlisted + byStatus.interviewed + byStatus.hired;
  return {
    total: applications.length,
    openJobs: jobs.filter((j) => j.status === 'published').length,
    draftJobs: jobs.filter((j) => j.status === 'draft').length,
    closedJobs: jobs.filter((j) => j.status === 'closed').length,
    last7,
    prev7,
    inPipeline: byStatus.new + byStatus.shortlisted + byStatus.interviewed,
    byStatus,
    byDepartment: Object.entries(byDepartment).sort((a, b) => b[1] - a[1]),
    topJobs: Object.entries(byJob)
      .map(([id, count]) => ({ job: jobs.find((j) => j.id === id), count }))
      .filter((x) => x.job)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    daily,
    hireRate: decided ? Math.round((byStatus.hired / decided) * 100) : 0,
    progressionRate: applications.length ? Math.round((progressed / applications.length) * 100) : 0,
  };
}

export function filterApplications(apps, { q = '', status = '', jobId = '', department = '' }) {
  const n = q.trim().toLowerCase();
  return apps.filter(
    (a) =>
      (!n || [a.fullName, a.email, a.reference, a.jobTitle, a.phone].some((x) => String(x).toLowerCase().includes(n))) &&
      (!status || a.status === status) &&
      (!jobId || a.jobId === jobId) &&
      (!department || a.department === department),
  );
}
