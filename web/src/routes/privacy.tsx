import LandingFooter from '@/components/organisms/landing-footer';
import LandingNav from '@/components/organisms/landing-nav';
import { useLocale } from '@/hooks/i18n/useLocale';
import { createFileRoute } from '@tanstack/react-router';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

/** October 26, 2026, formatted in the active language at render. */
const LAST_UPDATED = new Date(2026, 9, 26);

type LandingKey = ParseKeys<'landing'>;

interface LegalSection {
  titleKey: LandingKey;
  paragraphKeys: LandingKey[];
  listKeys?: LandingKey[];
}

const SECTIONS: LegalSection[] = [
  {
    titleKey: 'privacy.sections.introduction.title',
    paragraphKeys: [
      'privacy.sections.introduction.p1',
      'privacy.sections.introduction.p2',
    ],
  },
  {
    titleKey: 'privacy.sections.controller.title',
    paragraphKeys: [
      'privacy.sections.controller.p1',
      'privacy.sections.controller.p2',
    ],
  },
  {
    titleKey: 'privacy.sections.collected.title',
    paragraphKeys: ['privacy.sections.collected.p1'],
    listKeys: [
      'privacy.sections.collected.list.account',
      'privacy.sections.collected.list.career',
      'privacy.sections.collected.list.simulation',
      'privacy.sections.collected.list.usage',
      'privacy.sections.collected.list.communication',
    ],
  },
  {
    titleKey: 'privacy.sections.use.title',
    paragraphKeys: ['privacy.sections.use.p1'],
    listKeys: [
      'privacy.sections.use.list.account',
      'privacy.sections.use.list.analysis',
      'privacy.sections.use.list.simulations',
      'privacy.sections.use.list.history',
      'privacy.sections.use.list.improvement',
      'privacy.sections.use.list.support',
      'privacy.sections.use.list.legal',
    ],
  },
  {
    titleKey: 'privacy.sections.legalBasis.title',
    paragraphKeys: ['privacy.sections.legalBasis.p1'],
    listKeys: [
      'privacy.sections.legalBasis.list.contract',
      'privacy.sections.legalBasis.list.consent',
      'privacy.sections.legalBasis.list.legitimateInterests',
      'privacy.sections.legalBasis.list.legalObligation',
    ],
  },
  {
    titleKey: 'privacy.sections.ai.title',
    paragraphKeys: ['privacy.sections.ai.p1', 'privacy.sections.ai.p2'],
  },
  {
    titleKey: 'privacy.sections.sharing.title',
    paragraphKeys: [
      'privacy.sections.sharing.p1',
      'privacy.sections.sharing.p2',
    ],
  },
  {
    titleKey: 'privacy.sections.retention.title',
    paragraphKeys: [
      'privacy.sections.retention.p1',
      'privacy.sections.retention.p2',
    ],
  },
  {
    titleKey: 'privacy.sections.rights.title',
    paragraphKeys: ['privacy.sections.rights.p1', 'privacy.sections.rights.p2'],
  },
  {
    titleKey: 'privacy.sections.security.title',
    paragraphKeys: ['privacy.sections.security.p1'],
  },
  {
    titleKey: 'privacy.sections.cookies.title',
    paragraphKeys: [
      'privacy.sections.cookies.p1',
      'privacy.sections.cookies.p2',
      'privacy.sections.cookies.p3',
      'privacy.sections.cookies.p4',
    ],
  },
  {
    titleKey: 'privacy.sections.transfers.title',
    paragraphKeys: ['privacy.sections.transfers.p1'],
  },
  {
    titleKey: 'privacy.sections.changes.title',
    paragraphKeys: ['privacy.sections.changes.p1'],
  },
  {
    titleKey: 'privacy.sections.contact.title',
    paragraphKeys: ['privacy.sections.contact.p1'],
  },
];

function PrivacyPage() {
  const { t } = useTranslation('landing');
  const { intlLocale } = useLocale();
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <LandingNav />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
          <header className="mb-10 border-b border-border pb-8">
            <p className="text-body-s text-text-weakest uppercase tracking-wider">
              {t('privacy.eyebrow')}
            </p>
            <h1 className="text-h2 text-text mt-2">{t('privacy.title')}</h1>
            <p className="text-body-m text-text-weaker mt-3">
              {t('privacy.lastUpdated', {
                date: LAST_UPDATED.toLocaleDateString(intlLocale, {
                  dateStyle: 'long',
                }),
              })}
            </p>
          </header>

          <div className="flex flex-col gap-10">
            {SECTIONS.map((section) => (
              <section key={section.titleKey}>
                <h2 className="text-h5 text-text mb-3">
                  {t(section.titleKey)}
                </h2>
                <div className="flex flex-col gap-3">
                  {section.paragraphKeys.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-body-m text-text-weaker leading-relaxed"
                    >
                      {t(paragraph)}
                    </p>
                  ))}
                  {section.listKeys && (
                    <ul className="text-body-m text-text-weaker ml-5 list-disc space-y-2 leading-relaxed">
                      {section.listKeys.map((item) => (
                        <li key={item}>{t(item)}</li>
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

export default PrivacyPage;
