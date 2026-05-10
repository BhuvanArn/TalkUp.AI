import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { IconName } from '@/components/atoms/icon/icon-map';
import reviews from '@/components/molecules/convincing-banner/reviews.json';
import LandingFooter from '@/components/organisms/landing-footer';
import LandingNav from '@/components/organisms/landing-nav';
import { Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import { FaCheck, FaStar } from 'react-icons/fa6';

interface Feature {
  icon: IconName;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'mic-on',
    title: 'Realistic interview simulations',
    body: 'Practice with an AI interviewer that adapts to your role, level, and target company.',
  },
  {
    icon: 'progression',
    title: 'Behavior & emotion analysis',
    body: 'Get feedback on tone, pacing, eye contact, and confidence after every session.',
  },
  {
    icon: 'app-notes',
    title: 'Notes & journaling',
    body: 'Capture takeaways with a rich editor synced to each simulation and application.',
  },
  {
    icon: 'schedule',
    title: 'Agenda & reminders',
    body: 'Plan mock interviews and deadlines on a calendar built for job hunting.',
  },
  {
    icon: 'edit',
    title: 'CV analysis',
    body: 'Upload your résumé and get tailored suggestions for the role you target.',
  },
  {
    icon: 'chat',
    title: 'AI coaching chat',
    body: 'Ask anything: behavioral prep, salary negotiation, follow-up emails — answered.',
  },
];

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Create your profile',
    body: 'Tell TalkUp about your target role, experience, and goals. Takes under two minutes.',
  },
  {
    title: 'Run a simulation',
    body: 'Pick a scenario — behavioral, technical, system design — and start a live mock interview.',
  },
  {
    title: 'Review and improve',
    body: 'Read your detailed report, save notes, and track your progression over time.',
  },
];

interface PricingTier {
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlight?: boolean;
}

type PricingAudience = 'candidates' | 'organizations';

const PRICING: Record<PricingAudience, PricingTier[]> = {
  candidates: [
    {
      name: 'Free',
      price: '€0',
      period: 'forever',
      blurb: 'Get a feel for TalkUp at your own pace.',
      features: [
        '3 simulations per month',
        'Text chatbot (limited)',
        'Basic feedback report',
        'Notes & agenda',
      ],
      cta: 'Start free',
      ctaHref: '/register',
    },
    {
      name: 'Lite',
      price: '€9',
      period: 'per month',
      blurb: 'For students prepping a few interviews per month.',
      features: [
        '10 simulations per month',
        'Standard voice (efficient TTS)',
        'Behavior & emotion analysis',
        'CV analysis & notes',
      ],
      cta: 'Start Lite',
      ctaHref: '/register',
      highlight: true,
    },
    {
      name: 'Pro',
      price: '€19',
      period: 'per month',
      blurb: 'For serious job seekers running daily simulations.',
      features: [
        '30 simulations per month (fair-use)',
        'Premium realistic voice',
        'Top-tier LLM for harder interviews',
        'Unlimited chatbot & priority support',
      ],
      cta: 'Try Pro',
      ctaHref: '/register',
    },
  ],
  organizations: [
    {
      name: 'Member',
      price: '€0',
      period: 'with org code',
      blurb: 'Join your organization and unlock everything they paid for.',
      features: [
        'Use your organization invite code',
        'All Pro features included',
        'Progress shared with your coach',
        'Priority support via your org',
      ],
      cta: 'I have a code',
      ctaHref: '/register',
    },
    {
      name: 'Business',
      price: '€8',
      period: 'per seat / month · min 5 seats',
      blurb: 'For schools, bootcamps, and career services.',
      features: [
        'Lite-tier features for each member',
        'Admin dashboard to manage seats',
        'Employee role to monitor candidates',
        'Custom invite codes & onboarding',
      ],
      cta: 'Start a 30-day trial',
      ctaHref: '/register',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      blurb: 'For HR teams and large recruiting programs.',
      features: [
        'Everything in Business',
        'Custom scenarios & branding',
        'SSO & advanced security',
        'Dedicated success manager',
      ],
      cta: 'Contact sales',
      ctaHref: 'mailto:contact@talkup.ai',
    },
  ],
};

const LandingPage = () => (
  <div className="flex min-h-screen flex-col bg-background text-text">
    <LandingNav />
    <main className="flex-1">
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FinalCta />
    </main>
    <LandingFooter />
  </div>
);

const Hero = () => (
  <section className="relative overflow-hidden">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-accent-weaker via-background to-background"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -top-32 -right-24 -z-10 h-[420px] w-[420px] rounded-full bg-accent/15 blur-3xl"
    />
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
      <div className="flex flex-col gap-6">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-body-s text-text-weaker">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          New · AI-powered interview coaching
        </span>
        <h1 className="text-h1 text-text">
          Ace your next interview with{' '}
          <span className="text-accent">AI you can talk to.</span>
        </h1>
        <p className="text-body-l text-text-weaker max-w-xl">
          TalkUp turns interview prep into a daily habit: realistic simulations,
          instant behavior feedback, and a coach that helps you improve between
          sessions.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="contained"
            color="accent"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link to="/register">Get started — it's free</Link>
          </Button>
          <Button
            asChild
            variant="outlined"
            color="neutral"
            size="lg"
            className="w-full sm:w-auto"
          >
            <a href="#how">See how it works</a>
          </Button>
        </div>
        <ul className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-body-s text-text-weaker">
          <li className="flex items-center gap-2">
            <FaCheck className="text-success" /> No credit card required
          </li>
          <li className="flex items-center gap-2">
            <FaCheck className="text-success" /> Works in your browser
          </li>
          <li className="flex items-center gap-2">
            <FaCheck className="text-success" /> Private & secure
          </li>
        </ul>
      </div>

      <HeroVisual />
    </div>
  </section>
);

const HeroVisual = () => (
  <div className="relative">
    <div className="relative rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-2 text-body-s text-text-weakest">
          Mock interview · Senior Frontend
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            AI
          </div>
          <div className="rounded-lg rounded-tl-none bg-surface-raised px-4 py-3 text-body-m text-text">
            Tell me about a time you disagreed with a teammate on a technical
            decision.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            You
          </div>
          <div className="flex items-center gap-2 rounded-lg rounded-tl-none border border-border bg-background px-4 py-3 text-body-m text-text-weaker">
            <Icon icon="mic-on" size="sm" color="accent" />
            <span>Listening…</span>
            <Waveform />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metric label="Confidence" value="82%" />
        <Metric label="Pace" value="Steady" />
        <Metric label="Clarity" value="High" />
      </div>
    </div>
  </div>
);

const Waveform = () => (
  <div className="ml-2 flex items-end gap-0.5" aria-hidden>
    {[6, 14, 9, 18, 11, 22, 8, 16, 10].map((h, i) => (
      <span
        key={i}
        className="block w-1 rounded-sm bg-accent/70 animate-pulse"
        style={{
          height: `${h}px`,
          animationDelay: `${i * 80}ms`,
          animationDuration: '1.2s',
        }}
      />
    ))}
  </div>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-background px-3 py-2">
    <div className="text-body-s text-text-weakest">{label}</div>
    <div className="text-body-l-strong text-text">{value}</div>
  </div>
);

const Features = () => (
  <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-body-s-strong uppercase tracking-wider text-accent">
        Features
      </p>
      <h2 className="mt-2 text-h2 text-text">
        Everything you need to interview better
      </h2>
      <p className="mt-3 text-body-l text-text-weaker">
        TalkUp pairs realistic practice with the kind of feedback you'd only get
        from a senior coach.
      </p>
    </div>
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f) => (
        <article
          key={f.title}
          className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/60"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-weaker text-accent">
            <Icon icon={f.icon} size="md" color="accent" />
          </div>
          <h3 className="mt-4 text-h5 text-text">{f.title}</h3>
          <p className="mt-2 text-body-m text-text-weaker">{f.body}</p>
        </article>
      ))}
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how" className="bg-surface">
    <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-body-s-strong uppercase tracking-wider text-accent">
          How it works
        </p>
        <h2 className="mt-2 text-h2 text-text">From zero to interview-ready</h2>
        <p className="mt-3 text-body-l text-text-weaker">
          Three steps. No setup headaches. You can run your first simulation
          today.
        </p>
      </div>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <li
            key={step.title}
            className="relative rounded-xl border border-border bg-background p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-h5 text-white">
              {idx + 1}
            </div>
            <h3 className="mt-4 text-h5 text-text">{step.title}</h3>
            <p className="mt-2 text-body-m text-text-weaker">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

const PricingCta = ({ tier }: { tier: PricingTier }) => (
  <Button
    asChild
    variant={tier.highlight ? 'contained' : 'outlined'}
    color="accent"
    size="md"
    className="w-full"
  >
    {tier.ctaHref.startsWith('/') ? (
      <Link to={tier.ctaHref}>{tier.cta}</Link>
    ) : (
      <a href={tier.ctaHref}>{tier.cta}</a>
    )}
  </Button>
);

const PricingCard = ({ tier }: { tier: PricingTier }) => (
  <article
    className={`flex flex-col rounded-xl border p-6 ${
      tier.highlight
        ? 'border-accent bg-accent-weaker shadow-sm'
        : 'border-border bg-surface'
    }`}
  >
    <div className="flex items-center justify-between">
      <h3 className="text-h4 text-text">{tier.name}</h3>
      {tier.highlight && (
        <span className="rounded-full bg-accent px-3 py-1 text-body-s text-white">
          Most popular
        </span>
      )}
    </div>
    <p className="mt-2 text-body-m text-text-weaker">{tier.blurb}</p>
    <div className="mt-4 flex items-baseline gap-2">
      <span className="text-h2 text-text">{tier.price}</span>
      <span className="text-body-m text-text-weakest">{tier.period}</span>
    </div>
    <ul className="mt-6 flex flex-col gap-2">
      {tier.features.map((feat) => (
        <li
          key={feat}
          className="flex items-start gap-2 text-body-m text-text-weak"
        >
          <FaCheck className="mt-1 shrink-0 text-success" />
          {feat}
        </li>
      ))}
    </ul>
    <div className="mt-8">
      <PricingCta tier={tier} />
    </div>
  </article>
);

const PRICING_TABS: { id: PricingAudience; label: string }[] = [
  { id: 'candidates', label: 'For candidates' },
  { id: 'organizations', label: 'For organizations' },
];

const tabId = (id: PricingAudience) => `pricing-tab-${id}`;
const panelId = (id: PricingAudience) => `pricing-panel-${id}`;

const PricingTabs = ({
  audience,
  onChange,
}: {
  audience: PricingAudience;
  onChange: (a: PricingAudience) => void;
}) => {
  const tabRefs = React.useRef<
    Record<PricingAudience, HTMLButtonElement | null>
  >({
    candidates: null,
    organizations: null,
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (
      e.key !== 'ArrowLeft' &&
      e.key !== 'ArrowRight' &&
      e.key !== 'Home' &&
      e.key !== 'End'
    ) {
      return;
    }
    e.preventDefault();
    const idx = PRICING_TABS.findIndex((t) => t.id === audience);
    let nextIdx = idx;
    if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + PRICING_TABS.length) % PRICING_TABS.length;
    } else if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % PRICING_TABS.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = PRICING_TABS.length - 1;
    }
    const next = PRICING_TABS[nextIdx].id;
    onChange(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Pricing audience"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1"
    >
      {PRICING_TABS.map((tab) => {
        const active = audience === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            aria-selected={active}
            aria-controls={panelId(tab.id)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={onKeyDown}
            className={`rounded-full px-4 py-1.5 text-body-m transition-colors ${
              active
                ? 'bg-accent text-white'
                : 'text-text-weaker hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const Pricing = () => {
  const [audience, setAudience] = useState<PricingAudience>('candidates');
  const tiers = PRICING[audience];
  const cols = tiers.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="text-body-s-strong uppercase tracking-wider text-accent">
          Pricing
        </p>
        <h2 className="mt-2 text-h2 text-text">Plans for every path</h2>
        <p className="mt-3 text-body-l text-text-weaker">
          Whether you're preparing on your own or rolling out TalkUp across an
          organization, there's a plan that fits.
        </p>
        <div className="mt-6">
          <PricingTabs audience={audience} onChange={setAudience} />
        </div>
      </div>
      <div
        role="tabpanel"
        id={panelId(audience)}
        aria-labelledby={tabId(audience)}
        className={`mt-12 grid gap-6 ${cols} ${
          tiers.length === 2 ? 'mx-auto max-w-4xl' : ''
        }`}
      >
        {tiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
        ))}
      </div>
      {audience === 'organizations' && (
        <p className="mt-8 text-center text-body-s text-text-weaker">
          Already invited?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Sign up with your organization code
          </Link>
          .
        </p>
      )}
    </section>
  );
};

const Testimonials = () => (
  <section id="testimonials" className="bg-surface">
    <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-body-s-strong uppercase tracking-wider text-accent">
          Testimonials
        </p>
        <h2 className="mt-2 text-h2 text-text">Users land offers, faster</h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {reviews.map((r) => (
          <figure
            key={r.name}
            className="flex h-full flex-col rounded-xl border border-border bg-background p-6"
          >
            <div className="flex items-center gap-1 text-warning">
              {Array.from({ length: 5 }).map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.floor(r.review) ? '' : 'opacity-30'}
                />
              ))}
            </div>
            <blockquote className="mt-4 text-body-l text-text">
              "{r.text}"
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-weaker text-body-l-strong text-accent">
                {r.name.charAt(0)}
              </div>
              <div>
                <div className="text-body-l-strong text-text">{r.name}</div>
                <div className="text-body-s text-text-weakest">
                  Verified user
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

const FinalCta = () => {
  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2b70c9]';

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="relative overflow-hidden rounded-2xl bg-[#2b70c9] px-8 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-[#ffffff1a] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-[#ffffff1a] blur-2xl"
        />
        <h2 className="text-h2 text-[#fff]">Ready to talk up your career?</h2>
        <p className="mx-auto mt-3 max-w-xl text-body-l text-[#ffffffe6]">
          Join TalkUp and turn interview prep into a habit you actually enjoy.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className={`inline-flex h-12 items-center justify-center rounded-md bg-[#fff] px-6 text-base font-medium text-[#205497] transition-colors hover:bg-[#f1f5fa] active:bg-[#e4ecf6] ${focusRing} w-full sm:w-auto`}
          >
            Create your free account
          </Link>
          <Link
            to="/login"
            className={`inline-flex h-12 items-center justify-center rounded-md border-2 border-[#fff] bg-transparent px-6 text-base font-medium text-[#fff] transition-colors hover:bg-[#ffffff1a] active:bg-[#ffffff33] ${focusRing} w-full sm:w-auto`}
          >
            I already have an account
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
