// ─────────────────────────────────────────────────────────────────────────────
// Transactional email templates. Shared by the Edge Functions (real sending via
// Resend) and by the demo mode (rendered as previews in the browser).
// All dynamic values are HTML-escaped.
// ─────────────────────────────────────────────────────────────────────────────

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' });

function layout({ preheader, heading, bodyHtml, footer }) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0b1a33">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e8f0">
<tr><td style="background:#0b1a33;padding:22px 28px;color:#fff;font-weight:700;font-size:18px">Meridian <span style="color:#10b981">&amp;</span> Co. <span style="font-weight:500;color:#aebfdc;font-size:13px">&nbsp;Careers</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0b1a33">${escapeHtml(heading)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:18px 28px;background:#f4f6fa;color:#5371a6;font-size:12px;line-height:1.5">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

const row = (k, v) =>
  `<tr><td style="padding:6px 0;color:#5371a6;font-size:13px;width:140px">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;font-weight:600">${escapeHtml(v)}</td></tr>`;

export function applicantAcknowledgementEmail({ fullName, email, reference, jobTitle, createdAt }) {
  const first = String(fullName).split(' ')[0];
  const subject = `Application received — ${jobTitle} (${reference})`;
  const text = `Hi ${first},

Thank you for applying for the ${jobTitle} role at Meridian & Co. We have received your application.

Reference number: ${reference}
Submitted: ${fmt(createdAt)}

What happens next:
1. Our Talent team reviews every application within 5 business days.
2. If your experience is a strong match, we will contact you to arrange a first conversation.
3. You will hear from us either way.

Please quote your reference number in any correspondence.

Warm regards,
Talent Acquisition, Meridian & Co.`;
  const html = layout({
    preheader: `We received your application for ${jobTitle}. Reference ${reference}.`,
    heading: `Thank you for applying, ${first}`,
    bodyHtml: `<p style="font-size:15px;line-height:1.6;margin:0 0 18px">We have received your application for the <strong>${escapeHtml(jobTitle)}</strong> role. Our Talent team personally reviews every application.</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px 18px;margin:0 0 20px">
<div style="font-size:12px;color:#047857;text-transform:uppercase;letter-spacing:.08em;font-weight:700">Your reference number</div>
<div style="font-size:22px;font-weight:800;letter-spacing:.04em;margin-top:4px">${escapeHtml(reference)}</div></div>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px">${row('Position', jobTitle)}${row('Submitted', fmt(createdAt))}</table>
<p style="font-size:14px;font-weight:700;margin:0 0 8px">What happens next</p>
<ol style="font-size:14px;line-height:1.7;margin:0 0 18px;padding-left:20px;color:#26406f"><li>We review applications within 5 business days.</li><li>Shortlisted candidates are invited to a first conversation.</li><li>You will hear from us either way.</li></ol>
<p style="font-size:14px;line-height:1.6;margin:0">Warm regards,<br><strong>Talent Acquisition</strong><br>Meridian &amp; Co.</p>`,
    footer: `You are receiving this email because an application was submitted with ${escapeHtml(email)}. Your data is processed according to our Applicant Privacy Notice and retained for 12 months.`,
  });
  return { to: email, subject, text, html, kind: 'applicant_acknowledgement' };
}

export function hrNotificationEmail({ hrEmail, fullName, email, phone, reference, jobTitle, department, experience, createdAt, dashboardUrl }) {
  const subject = `New application: ${fullName} → ${jobTitle} [${reference}]`;
  const text = `A new application was submitted.

Reference: ${reference}
Candidate: ${fullName}
Email: ${email}
Phone: ${phone}
Position: ${jobTitle} (${department})
Experience: ${experience}
Submitted: ${fmt(createdAt)}

Review it in the HR dashboard: ${dashboardUrl}
(The resume is stored privately and is only downloadable by signed-in HR administrators.)`;
  const html = layout({
    preheader: `${fullName} applied for ${jobTitle}`,
    heading: 'New application received',
    bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%">${row('Reference', reference)}${row('Candidate', fullName)}${row('Email', email)}${row('Phone', phone)}${row('Position', `${jobTitle} · ${department}`)}${row('Experience', experience)}${row('Submitted', fmt(createdAt))}</table>
<a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px">Open in HR dashboard</a>
<p style="font-size:12px;color:#5371a6;margin:16px 0 0">For privacy, the resume is not attached. It is stored in private storage and is only downloadable by signed-in HR administrators.</p>`,
    footer: 'Internal notification · Meridian &amp; Co. Recruitment System',
  });
  return { to: hrEmail, subject, text, html, kind: 'hr_notification' };
}

const STATUS_COPY = {
  shortlisted: ['You have been shortlisted', 'Good news — your application has been shortlisted. A member of our Talent team will contact you shortly to schedule an interview.'],
  interviewed: ['Thank you for interviewing with us', 'Thank you for taking the time to interview with us. The hiring team is completing its review and we will be in touch with an update soon.'],
  hired: ['Welcome to Meridian & Co.', 'Congratulations! We are delighted to confirm your offer. Our People team will send your onboarding pack separately.'],
  rejected: ['An update on your application', 'Thank you for your interest in Meridian & Co. After careful consideration, we have decided not to progress your application on this occasion. We will keep your details on file for 12 months and encourage you to apply for future roles.'],
};

export function statusUpdateEmail({ fullName, email, reference, jobTitle, status }) {
  const copy = STATUS_COPY[status];
  if (!copy) return null;
  const first = String(fullName).split(' ')[0];
  const subject = `${copy[0]} — ${jobTitle} (${reference})`;
  const text = `Hi ${first},\n\n${copy[1]}\n\nReference: ${reference}\n\nKind regards,\nTalent Acquisition, Meridian & Co.`;
  const html = layout({
    preheader: copy[0],
    heading: copy[0],
    bodyHtml: `<p style="font-size:15px;line-height:1.6;margin:0 0 16px">Hi ${escapeHtml(first)},</p><p style="font-size:15px;line-height:1.6;margin:0 0 16px">${escapeHtml(copy[1])}</p><p style="font-size:13px;color:#5371a6;margin:0 0 16px">Position: <strong>${escapeHtml(jobTitle)}</strong> · Reference: <strong>${escapeHtml(reference)}</strong></p><p style="font-size:14px;margin:0">Kind regards,<br><strong>Talent Acquisition</strong><br>Meridian &amp; Co.</p>`,
    footer: 'Meridian &amp; Co. · Applicant communications',
  });
  return { to: email, subject, text, html, kind: `status_${status}` };
}
