import LandingFooter from '@/components/organisms/landing-footer';
import LandingNav from '@/components/organisms/landing-nav';
import {
  CONTACT_EMAIL,
  LANDING_FOCUS_RING,
} from '@/components/organisms/landing-nav/landing-links';
import { trackContactClick } from '@/utils/analytics';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
});

const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

const SECTION_TITLE = 'text-h3 md:text-h2 text-text tracking-[-0.015em]';

const VALUES = [
  {
    title: 'Accessible',
    body: "Practice shouldn't depend on paying a coach. Talkup is free while in beta.",
  },
  {
    title: 'Personal',
    body: 'Every preparation starts from your CV and a real job offer, not a generic question list.',
  },
  {
    title: 'Concrete',
    body: 'Feedback names the habit to change: a verbal tic, a casual register, too many filler words.',
  },
];

const TEAM = [
  {
    initials: 'ZB',
    name: 'Ziane Badarou',
    role: 'Frontend developer, communication lead',
  },
  {
    initials: 'TA',
    name: 'Toavina Andria',
    role: 'AI engineer, data analyst, DevOps',
  },
  { initials: 'RE', name: 'Regine Emagni', role: 'Backend, server lead' },
  { initials: 'BA', name: 'Bhuvan Arnaud', role: 'Frontend, backend, DevOps' },
];

const WORKING_TODAY = [
  'CV and job offer analysis with a match score',
  'Preparation path and interview talking points',
  'Voice simulations in French with live verbal analysis',
  'Application board, notes, agenda and assistant',
  'Organizations with invite codes and member stats',
];

const NEXT = [
  'A report after each simulation, and progress over time',
  'Simulations in English',
  'Faster, more reliable AI sessions',
];

const StatusList = ({ title, items }: { title: string; items: string[] }) => (
  <div>
    <h3 className="font-display text-body-xl-strong font-semibold text-text mb-2">
      {title}
    </h3>
    <ul className="list-disc space-y-1.5 pl-5 text-body-l text-text-weaker">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

function About() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <LandingNav />
      <main className="flex-1">
        <section className="pt-12 pb-14">
          <div className={CONTAINER}>
            {/* Navy in light; the primary token is too dim on the dark canvas, so flip to text. */}
            <h1 className="font-display font-extrabold text-[length:clamp(44px,7vw,84px)] leading-[0.95] tracking-[-0.01em] text-primary [.dark_&]:text-text max-w-[14ch] text-balance">
              We built the interview coach we couldn&apos;t afford.
            </h1>
            <p className="mt-5 max-w-[56ch] text-lg text-text-weaker">
              Talkup started as our Epitech Innovative Project. We kept seeing
              friends with good profiles lose internships at the interview
              stage, with no idea what went wrong. Coaching exists, but
              it&apos;s expensive and rarely tied to the job you&apos;re
              applying for.
            </p>
          </div>
        </section>

        <section aria-label="Our values" className="pb-18">
          <div className={`${CONTAINER} grid grid-cols-1 gap-8 md:grid-cols-3`}>
            {VALUES.map((value) => (
              <div key={value.title}>
                <h2 className="font-display text-body-xl-strong font-semibold text-text">
                  {value.title}
                </h2>
                <p className="mt-1.5 text-body-l text-text-weaker">
                  {value.body}
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
              The team
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
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="about-status" className="py-18">
          <div className={CONTAINER}>
            <h2 id="about-status" className={SECTION_TITLE}>
              Where we are
            </h2>
            <div className="mt-7 grid grid-cols-1 gap-8 md:grid-cols-2">
              <StatusList title="Working today" items={WORKING_TODAY} />
              <StatusList title="Next" items={NEXT} />
            </div>

            <p className="mt-9 max-w-[56ch] text-lg text-text-weaker">
              Questions, a school partnership, or feedback on the beta?
            </p>
            <p className="mt-4 text-body-l text-text">
              Write to us at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                onClick={trackContactClick('about')}
                className={`break-all rounded-sm font-semibold text-text-link underline underline-offset-4 hover:text-accent-hover ${LANDING_FOCUS_RING}`}
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

export default About;
