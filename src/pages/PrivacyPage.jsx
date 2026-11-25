import { HR_EMAIL } from '../lib/config.js';
import { useDocumentTitle } from '../lib/hooks.js';

export function PrivacyContent() {
  const sections = [
    ['Who we are', 'Meridian & Co. (a fictional company used in this portfolio demonstration) is the data controller for personal data you submit through this careers website.'],
    ['What we collect', 'Your name, email address, phone number, the role you apply for, your relevant experience, your resume and your cover letter. We also record the date and time of submission and basic technical data used to prevent spam and abuse.'],
    ['Why we use it', 'Solely to assess your suitability for the role you applied for, to communicate with you about your application and, if you are hired, to begin onboarding. Our legal basis is your consent and our legitimate interest in recruiting.'],
    ['Who can see it', 'Only authorised members of our HR and hiring teams. Resumes are stored in private, access-controlled storage and are never publicly accessible. We do not sell your data or share it with third parties except our hosting and email providers, who act under contract.'],
    ['How long we keep it', 'Unsuccessful applications are deleted 12 months after the role closes. You can ask us to delete your data sooner at any time.'],
    ['Your rights', `You may request access to, correction of, or deletion of your personal data, and you may withdraw consent at any time by emailing ${HR_EMAIL}.`],
  ];
  return (
    <div className="space-y-5 text-sm leading-relaxed text-navy-600">
      {sections.map(([h, p]) => (
        <section key={h}>
          <h3 className="font-semibold text-navy-900">{h}</h3>
          <p className="mt-1">{p}</p>
        </section>
      ))}
      <p className="text-xs text-navy-400">Template text for demonstration only. A real deployment should have this notice reviewed by legal counsel for the applicable jurisdiction (e.g. GDPR, CCPA, PDPA).</p>
    </div>
  );
}

export default function PrivacyPage() {
  useDocumentTitle('Applicant privacy notice');
  return (
    <div className="container-x max-w-3xl py-14">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-3xl font-extrabold text-navy-900">Applicant Privacy Notice</h1>
      <div className="mt-8">
        <PrivacyContent />
      </div>
    </div>
  );
}
