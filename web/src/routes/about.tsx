import LandingFooter from '@/components/organisms/landing-footer';
import LandingNav from '@/components/organisms/landing-nav';
import {
  CONTACT_EMAIL,
  LANDING_FOCUS_RING,
} from '@/components/organisms/landing-nav/landing-links';
import { trackContactClick } from '@/utils/analytics';
import { createFileRoute } from '@tanstack/react-router';
import type { ParseKeys } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';

export const Route = createFileRoute('/about')({
  component: About,
});

type LandingKey = ParseKeys<'landing'>;

const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

const SECTION_TITLE = 'text-h3 md:text-h2 text-text tracking-[-0.015em]';

const VALUES: { titleKey: LandingKey; bodyKey: LandingKey }[] = [
  {
    titleKey: 'about.values.accessible.title',
    bodyKey: 'about.values.accessible.body',
  },
  {
    titleKey: 'about.values.personal.title',
    bodyKey: 'about.values.personal.body',
  },
  {
    titleKey: 'about.values.concrete.title',
    bodyKey: 'about.values.concrete.body',
  },
];

const TEAM: { initials: string; name: string; roleKey: LandingKey }[] = [
  {
    initials: 'ZB',
    name: 'Ziane Badarou',
    roleKey: 'about.team.roles.ziane',
  },
  {
    initials: 'TA',
    name: 'Toavina Andria',
    roleKey: 'about.team.roles.toavina',
  },
  {
    initials: 'RE',
    name: 'Regine Emagni',
    roleKey: 'about.team.roles.regine',
  },
  {
    initials: 'BA',
    name: 'Bhuvan Arnaud',
    roleKey: 'about.team.roles.bhuvan',
  },
];

const WORKING_TODAY: LandingKey[] = [
  'about.status.working.analysis',
  'about.status.working.path',
  'about.status.working.simulations',
  'about.status.working.board',
  'about.status.working.orgs',
];

const NEXT: LandingKey[] = [
  'about.status.upcoming.report',
  'about.status.upcoming.english',
  'about.status.upcoming.reliability',
];

const StatusList = ({
  title,
  items,
}: {
  title: string;
  items: LandingKey[];
}) => {
  const { t } = useTranslation('landing');
  return (
    <div>
      <h3 className="font-display text-body-xl-strong font-semibold text-text mb-2">
        {title}
      </h3>
      <ul className="list-disc space-y-1.5 pl-5 text-body-l text-text-weaker">
        {items.map((item) => (
          <li key={item}>{t(item)}</li>
        ))}
      </ul>
    </div>
  );
};

function About() {
  const { t } = useTranslation('landing');
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <LandingNav />
      <main className="flex-1">
        <section className="pt-12 pb-14">
          <div className={CONTAINER}>
            {/* Navy in light; the primary token is too dim on the dark canvas, so flip to text. */}
            <h1 className="font-display font-extrabold text-[length:clamp(44px,7vw,84px)] leading-[0.95] tracking-[-0.01em] text-primary [.dark_&]:text-text max-w-[14ch] text-balance">
              {t('about.title')}
            </h1>
            <p className="mt-5 max-w-[56ch] text-lg text-text-weaker">
              {t('about.lead')}
            </p>
          </div>
        </section>

        <section aria-label={t('about.valuesLabel')} className="pb-18">
          <div className={`${CONTAINER} grid grid-cols-1 gap-8 md:grid-cols-3`}>
            {VALUES.map((value) => (
              <div key={value.titleKey}>
                <h2 className="font-display text-body-xl-strong font-semibold text-text">
                  {t(value.titleKey)}
                </h2>
                <p className="mt-1.5 text-body-l text-text-weaker">
                  {t(value.bodyKey)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="about-team"
          className="border-y border-border bg-surface py-18"
        >
          <div className={CONTAINER}>
            <h2 id="about-team" className={SECTION_TITLE}>
              {t('about.team.title')}
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-6 min-[461px]:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member) => (
                <li key={member.name} className="grid gap-2.5">
                  <span
                    aria-hidden="true"
                    className="grid h-16 w-16 place-items-center rounded-full bg-primary font-display text-xl font-bold text-background [.dark_&]:bg-text"
                  >
                    {member.initials}
                  </span>
                  <span className="font-display text-body-xl-strong font-semibold leading-tight text-text">
                    {member.name}
                  </span>
                  <span className="text-body-m text-text-weaker">
                    {t(member.roleKey)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="about-status" className="py-18">
          <div className={CONTAINER}>
            <h2 id="about-status" className={SECTION_TITLE}>
              {t('about.status.title')}
            </h2>
            <div className="mt-7 grid grid-cols-1 gap-8 md:grid-cols-2">
              <StatusList
                title={t('about.status.workingToday')}
                items={WORKING_TODAY}
              />
              <StatusList title={t('about.status.next')} items={NEXT} />
            </div>

            <p className="mt-9 max-w-[56ch] text-lg text-text-weaker">
              {t('about.contact.question')}
            </p>
            <p className="mt-4 text-body-l text-text">
              <Trans
                ns="landing"
                i18nKey="about.contact.writeTo"
                values={{ email: CONTACT_EMAIL }}
                components={{
                  email: (
                    // Filled with the address by <Trans>.
                    // eslint-disable-next-line jsx-a11y/anchor-has-content
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      onClick={trackContactClick('about')}
                      className={`break-all rounded-sm font-semibold text-text-link underline underline-offset-4 hover:text-accent-hover ${LANDING_FOCUS_RING}`}
                    />
                  ),
                }}
              />
            </p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

export default About;
