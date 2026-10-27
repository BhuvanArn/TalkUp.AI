import { Button } from '@/components/atoms/button';
import LandingFooter from '@/components/organisms/landing-footer';
import LandingNav from '@/components/organisms/landing-nav';
import { type CtaLocation, trackCtaClick } from '@/utils/analytics';
import { Link } from '@tanstack/react-router';

import AccountCounter from './account-counter';
import HeroRoadmapMock from './hero-roadmap-mock';
import MembersTableMock from './members-table-mock';
import VerbalPanelMock from './verbal-panel-mock';

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

const PROBLEMS: { term: string; detail: string }[] = [
  {
    term: 'Stress',
    detail:
      'You know your background by heart, then lose your footing at the second question.',
  },
  {
    term: 'Improvising',
    detail:
      '"Tell me about a mistake you made." Without preparation, the answer goes everywhere.',
  },
  {
    term: 'No feedback',
    detail:
      'After a rejection, nobody tells you what went wrong, so you repeat it at the next one.',
  },
];

const STEPS: { title: string; body: string; where: string }[] = [
  {
    title: 'Analyze',
    body: 'Drop your CV and paste the offer link from LinkedIn or Welcome to the Jungle. Talkup compares them and gives you a match score.',
    where: 'Compatibility analysis',
  },
  {
    title: 'Prepare',
    body: 'Get a preparation path ranked by priority, with the gaps flagged, and talking points that pair each mission with something from your CV.',
    where: 'Roadmap',
  },
  {
    title: 'Rehearse',
    body: 'Talk with Sophie, the AI recruiter. She asks about this role and your background, out loud, and follows up on your answers.',
    where: 'Voice simulation',
  },
  {
    title: 'Adjust',
    body: 'See your scores move as you speak, take notes during the call, and ask the assistant what to work on next.',
    where: 'Live analysis, notes, assistant',
  },
];

const LIVE_FACTS = [
  'Clarity, politeness and vocabulary scores for every answer',
  'Register detection: professional, neutral or too casual',
  'Your most frequent verbal tics, named',
  'One concrete tip after each answer',
];

const TALKING_POINTS: { mission: string; answer: string }[] = [
  {
    mission: 'Maintain and extend our REST API',
    answer:
      'Your end-of-year project: a Node.js API used by 40 students, which you deployed and monitored.',
  },
  {
    mission: 'Work in pairs with a senior developer',
    answer: 'Your hackathon team of four, where you handled code reviews.',
  },
  {
    mission: 'Write automated tests',
    answer:
      'The Jest suite you added to your school project. Say what it caught.',
  },
];

const AUDIENCES: { title: string; body: string }[] = [
  {
    title: 'Students',
    body: "First internship or apprenticeship. You've never done a real interview.",
  },
  {
    title: 'Recent graduates',
    body: 'First job. Interviews keep coming and you want to know why they stall.',
  },
  {
    title: 'Career changers',
    body: 'New field, new vocabulary. You need to tell your story differently.',
  },
];

const ORG_FEATURES = [
  'Invite codes by email, with a role for each person',
  'Admin, employee and user roles',
  'Interviews, completion and average score per member',
];

interface Plan {
  name: string;
  features: string[];
  cta: string;
  to: '/register' | '/register-organization';
  location: CtaLocation;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Candidates',
    features: [
      'CV and job offer analysis',
      'Preparation path and talking points',
      'Voice simulations with live analysis',
      'Notes, agenda and assistant',
    ],
    cta: 'Create an account',
    to: '/register',
    location: 'pricing_candidates',
    highlight: true,
  },
  {
    name: 'Organizations',
    features: [
      'Organization with invite codes',
      'Admin, employee and user roles',
      'Progress stats for each member',
    ],
    cta: 'Create an organization',
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

const Hero = () => (
  <section className="pt-10 pb-14 sm:pb-20">
    <div
      className={`${WRAP} grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12`}
    >
      <div className="min-w-0">
        <h1
          className={`${DISPLAY} text-[clamp(44px,6.4vw,76px)] leading-[0.95]`}
        >
          Your interview is on Thursday. Walk in ready.
        </h1>
        <p className={`${LEAD} mt-[22px]`}>
          Add your CV and the link to the job offer. Talkup builds a prep path
          for that exact role, then interviews you out loud with an AI recruiter
          who has read both.
        </p>
        <div className={CTAS}>
          <Button asChild variant="contained" color="accent" size="lg">
            <Link to="/register" onClick={trackCtaClick('hero', '/register')}>
              Analyze my CV and an offer
            </Link>
          </Button>
          <Button asChild variant="outlined" color="neutral" size="lg">
            <Link
              to="/"
              hash="how"
              resetScroll={false}
              onClick={trackCtaClick('hero', '#how')}
            >
              See how it works
            </Link>
          </Button>
        </div>
        <AccountCounter variant="hero" className="mt-4" />
        <p className="mt-1 text-[13px] text-text-weaker">
          CV in PDF. Simulations are held in French for now.
        </p>
      </div>
      <HeroRoadmapMock />
    </div>
  </section>
);

/* Deep navy band: primary in light, the darker primary-weaker in dark so the
   light text keeps > 7:1 contrast in both themes. */
const ProblemBand = () => (
  <section
    className={`${SECTION} bg-primary text-background [.dark_&]:bg-primary-weaker [.dark_&]:text-text`}
  >
    <div className={`${WRAP} grid items-start gap-12 md:grid-cols-[1fr_1.3fr]`}>
      <p className="font-display text-[clamp(30px,4.2vw,48px)] font-bold leading-[1.08] text-balance">
        A strong profile can still lose the job in a bad interview.
      </p>
      <dl className="grid gap-[22px]">
        {PROBLEMS.map(({ term, detail }) => (
          <div key={term}>
            <dt className="font-display text-lg font-semibold leading-snug">
              {term}
            </dt>
            <dd className="mt-1 text-primary-weak [.dark_&]:text-text-weak">
              {detail}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how" className={`${SECTION} scroll-mt-20`}>
    <div className={WRAP}>
      <h2 className={H2}>From job offer to interview</h2>
      <p className={`${LEAD} mt-3`}>
        Each application gets its own preparation, built from the offer and your
        CV.
      </p>
      <ol className="mt-11 grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="min-w-0 border-t-2 border-border pt-4"
          >
            <span
              aria-hidden="true"
              className="font-display text-[32px] font-extrabold leading-none tabular-nums text-accent"
            >
              {index + 1}
            </span>
            <h3 className="mt-3 font-display text-lg font-semibold leading-tight text-text">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] text-text-weaker">{step.body}</p>
            <p className="mt-3 text-[13px] text-text-weaker">{step.where}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

const LiveFeedback = () => (
  <section className={`${SECTION} border-y border-border bg-surface`}>
    <div
      className={`${WRAP} grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]`}
    >
      <div className="min-w-0">
        <h2 className={H2}>Feedback while you speak</h2>
        <p className={`${LEAD} mt-3`}>
          Each answer is scored as soon as you finish it. You see which habits
          to drop before the next question.
        </p>
        <ul className={BULLETS}>
          {LIVE_FACTS.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
      <VerbalPanelMock />
    </div>
  </section>
);

const TalkingPoints = () => (
  <section className={SECTION}>
    <div className={`${WRAP} grid items-start gap-12 md:grid-cols-2`}>
      <div className="min-w-0">
        <h2 className={H2}>Know what to bring up</h2>
        <p className={`${LEAD} mt-3`}>
          For every mission in the offer, Talkup suggests the part of your
          experience that answers it. Check the sources it used at any time.
        </p>
      </div>
      <ul
        aria-label="Example interview talking points"
        className="min-w-0 divide-y divide-border overflow-hidden rounded-2xl border border-border"
      >
        {TALKING_POINTS.map(({ mission, answer }) => (
          <li key={mission} className="grid gap-1.5 px-[18px] py-4">
            <span className="text-[13px] text-text-weaker">
              Mission · {mission}
            </span>
            <span className="text-[15px] text-text">{answer}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const Audiences = () => (
  <section className={SECTION}>
    <div className={WRAP}>
      <h2 className={H2}>Built for people with everything to prove out loud</h2>
      <div className="mt-9 grid gap-8 md:grid-cols-3">
        {AUDIENCES.map(({ title, body }) => (
          <div key={title} className="border-t-2 border-text pt-4">
            <h3 className="font-display text-xl font-semibold leading-tight text-text">
              {title}
            </h3>
            <p className="mt-1.5 text-[15px] text-text-weaker">{body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Organizations = () => (
  <section
    id="orgs"
    className={`${SECTION} scroll-mt-20 border-y border-border bg-surface`}
  >
    <div
      className={`${WRAP} grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr]`}
    >
      <div className="min-w-0">
        <h2 className={H2}>For schools, bootcamps and career services</h2>
        <p className={`${LEAD} mt-3`}>
          Create an organization, send invite codes, and follow how each member
          is preparing.
        </p>
        <ul className={BULLETS}>
          {ORG_FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <div className={CTAS}>
          <Button asChild variant="contained" color="accent" size="lg">
            <Link
              to="/register-organization"
              onClick={trackCtaClick('orgs', '/register-organization')}
            >
              Create an organization
            </Link>
          </Button>
          <Button asChild variant="outlined" color="neutral" size="lg">
            <Link
              to="/register"
              search={{ code: '' }}
              onClick={trackCtaClick('orgs', '/register')}
            >
              I have an invite code
            </Link>
          </Button>
        </div>
      </div>
      <MembersTableMock />
    </div>
  </section>
);

const Pricing = () => (
  <section id="pricing" className={`${SECTION} scroll-mt-20`}>
    <div className={WRAP}>
      <h2 className={H2}>Pricing</h2>
      <p className={`${LEAD} mt-3`}>
        Talkup is free while in beta. Paid plans will come later, and we&apos;ll
        announce them before anything changes.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col gap-2.5 rounded-2xl border p-6 ${
              plan.highlight
                ? 'border-accent bg-accent-weak'
                : 'border-border bg-background'
            }`}
          >
            <h3 className="font-display text-xl font-semibold leading-tight text-text">
              {plan.name}
            </h3>
            <p className="font-display text-[40px] font-extrabold leading-none text-text">
              Free
              <small className="ml-1.5 font-body text-sm font-normal text-text-weaker">
                during the beta
              </small>
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-[18px] text-[15px] text-text-weaker">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
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
                {plan.cta}
              </Link>
            </Button>
          </div>
        ))}
      </div>
      <p className={FINE}>
        Simulations run on shared servers. At busy times you may wait in a short
        queue before your session starts.
      </p>
    </div>
  </section>
);

const FinalCta = () => (
  <section className="py-16 sm:py-22">
    <div className={WRAP}>
      <h2
        className={`${DISPLAY} max-w-[16ch] text-[clamp(36px,6vw,64px)] leading-none`}
      >
        Speak with confidence. Land the job.
      </h2>
      <div className={CTAS}>
        <Button asChild variant="contained" color="accent" size="lg">
          <Link to="/register" onClick={trackCtaClick('final', '/register')}>
            Analyze my CV and an offer
          </Link>
        </Button>
        <Button asChild variant="outlined" color="neutral" size="lg">
          <Link to="/login" onClick={trackCtaClick('final', '/login')}>
            Log in
          </Link>
        </Button>
      </div>
      <AccountCounter variant="final" className="mt-4" />
    </div>
  </section>
);

export default LandingPage;
