import { Button } from '@/components/atoms/button';
import LandingFooter from '@/components/organisms/landing-footer';
import LandingNav from '@/components/organisms/landing-nav';
import {
  type CtaLocation,
  type HeroVariant,
  getHeroVariant,
  trackCtaClick,
  trackHeroView,
} from '@/utils/analytics';
import { Link } from '@tanstack/react-router';
import type { ParseKeys } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AccountCounter from './account-counter';
import HeroRoadmapMock from './hero-roadmap-mock';
import MembersTableMock from './members-table-mock';
import VerbalPanelMock from './verbal-panel-mock';

type LandingKey = ParseKeys<'landing'>;

/* Shared layout / type recipes. Token classes only, so every block flips
   with the `.dark` class on the document root. */
const WRAP = 'mx-auto w-full max-w-6xl px-4 sm:px-6';
const SECTION = 'py-14 sm:py-18';
const H2 =
  'font-display text-[clamp(28px,4vw,40px)] font-bold leading-[1.1] tracking-[-0.015em] text-balance text-text';
const DISPLAY =
  'font-display font-extrabold tracking-[-0.01em] text-balance text-primary [.dark_&]:text-text';
const LEAD = 'max-w-[56ch] text-lg text-text-weaker';
const FINE = 'mt-3.5 text-[13px] text-text-weaker';
const CTAS = 'mt-7 flex flex-wrap gap-3';
const BULLETS = 'mt-[18px] list-disc space-y-1.5 pl-[18px] text-text-weaker';

const PROBLEMS: { termKey: LandingKey; detailKey: LandingKey }[] = [
  { termKey: 'problem.stress.term', detailKey: 'problem.stress.detail' },
  {
    termKey: 'problem.improvising.term',
    detailKey: 'problem.improvising.detail',
  },
  {
    termKey: 'problem.noFeedback.term',
    detailKey: 'problem.noFeedback.detail',
  },
];

const STEPS: {
  titleKey: LandingKey;
  bodyKey: LandingKey;
  whereKey: LandingKey;
}[] = [
  {
    titleKey: 'howItWorks.analyze.title',
    bodyKey: 'howItWorks.analyze.body',
    whereKey: 'howItWorks.analyze.where',
  },
  {
    titleKey: 'howItWorks.prepare.title',
    bodyKey: 'howItWorks.prepare.body',
    whereKey: 'howItWorks.prepare.where',
  },
  {
    titleKey: 'howItWorks.rehearse.title',
    bodyKey: 'howItWorks.rehearse.body',
    whereKey: 'howItWorks.rehearse.where',
  },
  {
    titleKey: 'howItWorks.adjust.title',
    bodyKey: 'howItWorks.adjust.body',
    whereKey: 'howItWorks.adjust.where',
  },
];

const LIVE_FACTS: LandingKey[] = [
  'liveFeedback.facts.scores',
  'liveFeedback.facts.register',
  'liveFeedback.facts.tics',
  'liveFeedback.facts.tip',
];

const TALKING_POINTS: { missionKey: LandingKey; answerKey: LandingKey }[] = [
  {
    missionKey: 'talkingPoints.api.mission',
    answerKey: 'talkingPoints.api.answer',
  },
  {
    missionKey: 'talkingPoints.pairing.mission',
    answerKey: 'talkingPoints.pairing.answer',
  },
  {
    missionKey: 'talkingPoints.tests.mission',
    answerKey: 'talkingPoints.tests.answer',
  },
];

const AUDIENCES: { titleKey: LandingKey; bodyKey: LandingKey }[] = [
  { titleKey: 'audiences.students.title', bodyKey: 'audiences.students.body' },
  {
    titleKey: 'audiences.graduates.title',
    bodyKey: 'audiences.graduates.body',
  },
  {
    titleKey: 'audiences.careerChangers.title',
    bodyKey: 'audiences.careerChangers.body',
  },
];

const ORG_FEATURES: LandingKey[] = [
  'organizations.features.invites',
  'organizations.features.roles',
  'organizations.features.stats',
];

interface Plan {
  nameKey: LandingKey;
  featureKeys: LandingKey[];
  ctaKey: LandingKey;
  to: '/register' | '/register-organization';
  location: CtaLocation;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    nameKey: 'pricing.candidates.name',
    featureKeys: [
      'pricing.candidates.features.analysis',
      'pricing.candidates.features.path',
      'pricing.candidates.features.simulations',
      'pricing.candidates.features.tools',
    ],
    ctaKey: 'actions.createAccount',
    to: '/register',
    location: 'pricing_candidates',
    highlight: true,
  },
  {
    nameKey: 'pricing.orgs.name',
    featureKeys: [
      'pricing.orgs.features.invites',
      'pricing.orgs.features.roles',
      'pricing.orgs.features.stats',
    ],
    ctaKey: 'actions.createOrganization',
    to: '/register-organization',
    location: 'pricing_orgs',
  },
];

const LandingPage = () => (
  <div className="flex min-h-screen flex-col overflow-x-clip bg-background text-text">
    <LandingNav />
    <main className="flex-1">
      <Hero />
      <ProblemBand />
      <HowItWorks />
      <LiveFeedback />
      <TalkingPoints />
      <Audiences />
      <Organizations />
      <Pricing />
      <FinalCta />
    </main>
    <LandingFooter />
  </div>
);

/**
 * Hero headline A/B test, measured in Umami (see `web/ANALYTICS.md`). Only the
 * text is translated: the variant ids stay `a` and `b` in every language.
 */
const HERO_HEADLINES = {
  a: 'hero.headline.a',
  b: 'hero.headline.b',
} as const satisfies Record<HeroVariant, LandingKey>;

const Hero = () => {
  const { t } = useTranslation('landing');
  const [variant] = useState(getHeroVariant);
  const viewTracked = useRef(false);

  useEffect(() => {
    // StrictMode replays effects in dev: report one view per mount.
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackHeroView(variant);
  }, [variant]);

  return (
    <section className="pt-10 pb-14 sm:pb-20">
      <div
        className={`${WRAP} grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12`}
      >
        <div className="min-w-0">
          <h1
            className={`${DISPLAY} text-[clamp(44px,6.4vw,76px)] leading-[0.95]`}
          >
            {t(HERO_HEADLINES[variant])}
          </h1>
          <p className={`${LEAD} mt-[22px]`}>{t('hero.lead')}</p>
          <div className={CTAS}>
            <Button asChild variant="contained" color="accent" size="lg">
              <Link to="/register" onClick={trackCtaClick('hero', '/register')}>
                {t('actions.analyzeCv')}
              </Link>
            </Button>
            <Button asChild variant="outlined" color="neutral" size="lg">
              <Link
                to="/"
                hash="how"
                resetScroll={false}
                onClick={trackCtaClick('hero', '#how')}
              >
                {t('hero.secondaryCta')}
              </Link>
            </Button>
          </div>
          <AccountCounter variant="hero" className="mt-4" />
          <p className="mt-1 text-[13px] text-text-weaker">{t('hero.fine')}</p>
        </div>
        <HeroRoadmapMock />
      </div>
    </section>
  );
};

/* Deep navy band: primary in light, the darker primary-weaker in dark so the
   light text keeps > 7:1 contrast in both themes. */
const ProblemBand = () => {
  const { t } = useTranslation('landing');
  return (
    <section
      className={`${SECTION} bg-primary text-background [.dark_&]:bg-primary-weaker [.dark_&]:text-text`}
    >
      <div
        className={`${WRAP} grid items-start gap-12 md:grid-cols-[1fr_1.3fr]`}
      >
        <p className="font-display text-[clamp(30px,4.2vw,48px)] font-bold leading-[1.08] text-balance">
          {t('problem.statement')}
        </p>
        <dl className="grid gap-[22px]">
          {PROBLEMS.map(({ termKey, detailKey }) => (
            <div key={termKey}>
              <dt className="font-display text-lg font-semibold leading-snug">
                {t(termKey)}
              </dt>
              <dd className="mt-1 text-primary-weak [.dark_&]:text-text-weak">
                {t(detailKey)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const { t } = useTranslation('landing');
  return (
    <section id="how" className={`${SECTION} scroll-mt-20`}>
      <div className={WRAP}>
        <h2 className={H2}>{t('howItWorks.title')}</h2>
        <p className={`${LEAD} mt-3`}>{t('howItWorks.lead')}</p>
        <ol className="mt-11 grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.titleKey}
              className="min-w-0 border-t-2 border-border pt-4"
            >
              <span
                aria-hidden="true"
                className="font-display text-[32px] font-extrabold leading-none tabular-nums text-accent"
              >
                {index + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold leading-tight text-text">
                {t(step.titleKey)}
              </h3>
              <p className="mt-2 text-[15px] text-text-weaker">
                {t(step.bodyKey)}
              </p>
              <p className="mt-3 text-[13px] text-text-weaker">
                {t(step.whereKey)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

const LiveFeedback = () => {
  const { t } = useTranslation('landing');
  return (
    <section className={`${SECTION} border-y border-border bg-surface`}>
      <div
        className={`${WRAP} grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]`}
      >
        <div className="min-w-0">
          <h2 className={H2}>{t('liveFeedback.title')}</h2>
          <p className={`${LEAD} mt-3`}>{t('liveFeedback.lead')}</p>
          <ul className={BULLETS}>
            {LIVE_FACTS.map((fact) => (
              <li key={fact}>{t(fact)}</li>
            ))}
          </ul>
        </div>
        <VerbalPanelMock />
      </div>
    </section>
  );
};

const TalkingPoints = () => {
  const { t } = useTranslation('landing');
  return (
    <section className={SECTION}>
      <div className={`${WRAP} grid items-start gap-12 md:grid-cols-2`}>
        <div className="min-w-0">
          <h2 className={H2}>{t('talkingPoints.title')}</h2>
          <p className={`${LEAD} mt-3`}>{t('talkingPoints.lead')}</p>
        </div>
        <ul
          aria-label={t('talkingPoints.listLabel')}
          className="min-w-0 divide-y divide-border overflow-hidden rounded-2xl border border-border"
        >
          {TALKING_POINTS.map(({ missionKey, answerKey }) => (
            <li key={missionKey} className="grid gap-1.5 px-[18px] py-4">
              <span className="text-[13px] text-text-weaker">
                {t('talkingPoints.mission', { mission: t(missionKey) })}
              </span>
              <span className="text-[15px] text-text">{t(answerKey)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

const Audiences = () => {
  const { t } = useTranslation('landing');
  return (
    <section className={SECTION}>
      <div className={WRAP}>
        <h2 className={H2}>{t('audiences.title')}</h2>
        <div className="mt-9 grid gap-8 md:grid-cols-3">
          {AUDIENCES.map(({ titleKey, bodyKey }) => (
            <div key={titleKey} className="border-t-2 border-text pt-4">
              <h3 className="font-display text-xl font-semibold leading-tight text-text">
                {t(titleKey)}
              </h3>
              <p className="mt-1.5 text-[15px] text-text-weaker">
                {t(bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Organizations = () => {
  const { t } = useTranslation('landing');
  return (
    <section
      id="orgs"
      className={`${SECTION} scroll-mt-20 border-y border-border bg-surface`}
    >
      <div
        className={`${WRAP} grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr]`}
      >
        <div className="min-w-0">
          <h2 className={H2}>{t('organizations.title')}</h2>
          <p className={`${LEAD} mt-3`}>{t('organizations.lead')}</p>
          <ul className={BULLETS}>
            {ORG_FEATURES.map((feature) => (
              <li key={feature}>{t(feature)}</li>
            ))}
          </ul>
          <div className={CTAS}>
            <Button asChild variant="contained" color="accent" size="lg">
              <Link
                to="/register-organization"
                onClick={trackCtaClick('orgs', '/register-organization')}
              >
                {t('actions.createOrganization')}
              </Link>
            </Button>
            <Button asChild variant="outlined" color="neutral" size="lg">
              <Link
                to="/register"
                search={{ code: '' }}
                onClick={trackCtaClick('orgs', '/register')}
              >
                {t('organizations.inviteCode')}
              </Link>
            </Button>
          </div>
        </div>
        <MembersTableMock />
      </div>
    </section>
  );
};

const Pricing = () => {
  const { t } = useTranslation('landing');
  return (
    <section id="pricing" className={`${SECTION} scroll-mt-20`}>
      <div className={WRAP}>
        <h2 className={H2}>{t('pricing.title')}</h2>
        <p className={`${LEAD} mt-3`}>{t('pricing.lead')}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.nameKey}
              className={`flex flex-col gap-2.5 rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-accent bg-accent-weak'
                  : 'border-border bg-background'
              }`}
            >
              <h3 className="font-display text-xl font-semibold leading-tight text-text">
                {t(plan.nameKey)}
              </h3>
              <p className="font-display text-[40px] font-extrabold leading-none text-text">
                {t('pricing.free')}
                <small className="ml-1.5 font-body text-sm font-normal text-text-weaker">
                  {t('pricing.duringBeta')}
                </small>
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-[18px] text-[15px] text-text-weaker">
                {plan.featureKeys.map((feature) => (
                  <li key={feature}>{t(feature)}</li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlight ? 'contained' : 'outlined'}
                color={plan.highlight ? 'accent' : 'neutral'}
                size="md"
                className="mt-auto self-start"
              >
                <Link
                  to={plan.to}
                  onClick={trackCtaClick(plan.location, plan.to)}
                >
                  {t(plan.ctaKey)}
                </Link>
              </Button>
            </div>
          ))}
        </div>
        <p className={FINE}>{t('pricing.queue')}</p>
      </div>
    </section>
  );
};

const FinalCta = () => {
  const { t } = useTranslation('landing');
  return (
    <section className="py-16 sm:py-22">
      <div className={WRAP}>
        <h2
          className={`${DISPLAY} max-w-[16ch] text-[clamp(36px,6vw,64px)] leading-none`}
        >
          {t('finalCta.title')}
        </h2>
        <div className={CTAS}>
          <Button asChild variant="contained" color="accent" size="lg">
            <Link to="/register" onClick={trackCtaClick('final', '/register')}>
              {t('actions.analyzeCv')}
            </Link>
          </Button>
          <Button asChild variant="outlined" color="neutral" size="lg">
            <Link to="/login" onClick={trackCtaClick('final', '/login')}>
              {t('actions.logIn')}
            </Link>
          </Button>
        </div>
        <AccountCounter variant="final" className="mt-4" />
      </div>
    </section>
  );
};

export default LandingPage;
