import LandingFooter from '@/components/organisms/landing-footer';
import LandingNav from '@/components/organisms/landing-nav';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

const LAST_UPDATED = 'July 15, 2026';

interface LegalSection {
  title: string;
  paragraphs: string[];
  list?: string[];
}

const SECTIONS: LegalSection[] = [
  {
    title: '1. Introduction',
    paragraphs: [
      'TalkUp.AI ("TalkUp", "we", "us") helps candidates prepare for interviews through AI-powered simulations, CV analysis, coaching tools, and related career features.',
      'This Privacy Policy explains what personal data we collect, why we use it, how long we keep it, and what rights you have. By creating an account or using TalkUp, you acknowledge that you have read this policy.',
    ],
  },
  {
    title: '2. Data controller',
    paragraphs: [
      'TalkUp.AI is the data controller for the personal data processed through our platform.',
      'For privacy-related requests, contact us at contact@talkup.ai. We are based in Paris, France.',
    ],
  },
  {
    title: '3. Personal data we collect',
    paragraphs: ['Depending on how you use TalkUp, we may process the following categories of data:'],
    list: [
      'Account information: name, email address, password hash, and profile details you choose to provide.',
      'Career data: CV or résumé files, parsed CV content, job applications, target roles, notes, and interview preparation history.',
      'Simulation data: audio, video, transcripts, and behavioral feedback generated during mock interviews.',
      'Usage data: pages visited, features used, device and browser information, and approximate log timestamps.',
      'Communication data: messages you send to our support team or through in-app coaching features.',
    ],
  },
  {
    title: '4. How we use your data',
    paragraphs: ['We use personal data to:'],
    list: [
      'Create and manage your account.',
      'Analyze your CV against job offers and generate compatibility insights.',
      'Run interview simulations and provide personalized feedback.',
      'Save your notes, applications, agenda items, and progression over time.',
      'Improve product reliability, security, and user experience.',
      'Respond to support requests and send essential service communications.',
      'Comply with legal obligations and enforce our terms.',
    ],
  },
  {
    title: '5. Legal basis for processing',
    paragraphs: [
      'Where applicable under the GDPR, we rely on one or more of the following legal bases:',
    ],
    list: [
      'Performance of a contract — to provide the TalkUp services you sign up for.',
      'Consent — for example, when you upload a CV for analysis or enable optional features.',
      'Legitimate interests — to secure our platform, prevent abuse, and improve our product, balanced against your rights.',
      'Legal obligation — when we must retain or disclose data to comply with applicable law.',
    ],
  },
  {
    title: '6. AI processing',
    paragraphs: [
      'TalkUp uses artificial intelligence to parse CVs, extract job-offer details, generate interview questions, analyze responses, and produce coaching feedback.',
      'Your content may be processed by automated systems to deliver these features. We do not use your personal data to train public third-party models unless we explicitly tell you otherwise and obtain your consent where required.',
    ],
  },
  {
    title: '7. Sharing and subprocessors',
    paragraphs: [
      'We do not sell your personal data. We may share data with trusted service providers that help us host the platform, send emails, process AI workloads, or provide analytics — only under contracts that require appropriate safeguards.',
      'We may also disclose data if required by law, to protect the rights and safety of TalkUp and its users, or in connection with a merger, acquisition, or asset sale subject to continued protection of your information.',
    ],
  },
  {
    title: '8. Data retention',
    paragraphs: [
      'We keep personal data only for as long as necessary to provide the service, meet legal requirements, or resolve disputes.',
      'You may delete your account at any time. When you do, we delete or anonymize your personal data within a reasonable period, except where retention is required by law or for legitimate backup and security purposes.',
    ],
  },
  {
    title: '9. Your rights',
    paragraphs: [
      'Depending on your location, you may have the right to access, rectify, erase, restrict, or object to certain processing of your personal data, as well as the right to data portability.',
      'You can update much of your information directly in your account settings. To exercise other rights, email contact@talkup.ai. You may also lodge a complaint with your local supervisory authority.',
    ],
  },
  {
    title: '10. Security',
    paragraphs: [
      'We implement technical and organizational measures designed to protect personal data against unauthorized access, loss, or misuse. No online service can guarantee absolute security, but we work continuously to reduce risk.',
    ],
  },
  {
    title: '11. Cookies and similar technologies',
    paragraphs: [
      'TalkUp uses cookies and similar technologies to keep you signed in, remember preferences, and understand how the product is used.',
      'For more detail on the cookies we use and how to manage them, see our Cookies policy (coming soon).',
    ],
  },
  {
    title: '12. International transfers',
    paragraphs: [
      'Your data may be processed in the European Economic Area and, where necessary, in other countries with appropriate safeguards such as standard contractual clauses or equivalent mechanisms.',
    ],
  },
  {
    title: '13. Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. When we make material changes, we will post the updated version on this page and adjust the "Last updated" date. Continued use of TalkUp after an update means you accept the revised policy.',
    ],
  },
  {
    title: '14. Contact',
    paragraphs: [
      'Questions about this Privacy Policy or your personal data? Email us at contact@talkup.ai.',
    ],
  },
];

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <LandingNav />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
          <header className="mb-10 border-b border-border pb-8">
            <p className="text-body-s text-text-weakest uppercase tracking-wider">
              Legal
            </p>
            <h1 className="text-h2 text-text mt-2">Privacy Policy</h1>
            <p className="text-body-m text-text-weaker mt-3">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <div className="flex flex-col gap-10">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-h5 text-text mb-3">{section.title}</h2>
                <div className="flex flex-col gap-3">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-body-m text-text-weaker leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.list && (
                    <ul className="text-body-m text-text-weaker ml-5 list-disc space-y-2 leading-relaxed">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
