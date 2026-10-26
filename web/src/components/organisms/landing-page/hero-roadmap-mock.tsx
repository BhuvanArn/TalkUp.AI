import { MatchGauge } from '@/components/atoms/match-gauge';
import { PRIORITY_STYLES } from '@/components/molecules/roadmap-topic-card';
import type { RoadmapTopic } from '@/services/applications/types';

interface PathItem {
  title: string;
  detail: string;
  priority: RoadmapTopic['priority'];
  gap?: boolean;
}

const PATH: PathItem[] = [
  {
    title: 'PostgreSQL indexing and queries',
    detail: 'Listed as required. Your CV only mentions MongoDB.',
    priority: 'HIGH',
    gap: true,
  },
  {
    title: 'Writing unit tests in Node.js',
    detail: 'You used Jest on one school project. Prepare a concrete example.',
    priority: 'MED',
  },
  {
    title: 'Why an apprenticeship',
    detail: 'The offer stresses long-term team fit.',
    priority: 'LOW',
  },
];

const MATCH_SCORE = 72;

const MockButton = ({
  children,
  primary = false,
}: {
  children: string;
  primary?: boolean;
}) => (
  <span
    className={`inline-flex h-[34px] items-center rounded-md px-3 font-display text-[13px] font-semibold ${
      primary ? 'bg-accent text-white' : 'border border-border-strong text-text'
    }`}
  >
    {children}
  </span>
);

/**
 * Static picture of the roadmap screen for one application. Purely visual:
 * exposed as a single image so its fake tabs and buttons are never focusable
 * or announced as controls. The gauge and priority chips are the app's own
 * (`MatchGauge`, `PRIORITY_STYLES`) so the picture follows the product; the
 * timeline layout is simplified to fit the hero.
 */
const HeroRoadmapMock = () => (
  <div
    role="img"
    aria-label="Example roadmap for a Junior Backend Developer apprenticeship: match score 72, interview on October 23, three preparation topics ranked by priority."
    className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--color-primary)_35%,transparent)]"
  >
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-[18px]">
      <div className="min-w-0">
        <div className="text-[13px] text-text-weaker">
          Atelier Nord · Lyon · Apprenticeship
        </div>
        <div className="mt-0.5 font-display text-lg font-semibold leading-tight text-text">
          Junior Backend Developer
        </div>
        <span className="mt-2.5 inline-flex flex-wrap gap-x-2 gap-y-1 rounded-full bg-accent-weak px-2.5 py-[5px] text-xs tabular-nums text-accent-active">
          <span>Interview Oct 23</span>
          <span>5 days left</span>
          <span>≈4 topics/week</span>
        </span>
      </div>
      <div className="flex-none">
        <MatchGauge score={MATCH_SCORE} />
      </div>
    </div>

    <div className="flex gap-[18px] border-b border-border px-5 text-[13px]">
      <span className="py-2.5 font-medium text-text shadow-[inset_0_-2px_0_var(--color-accent)]">
        Preparation path
      </span>
      <span className="py-2.5 text-text-weaker">Interview talking points</span>
    </div>

    <div className="px-5 pt-1.5 pb-2">
      {PATH.map((item, index) => (
        <div
          key={item.title}
          className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-3.5 py-3"
        >
          <span
            className={`absolute left-1.5 w-0.5 bg-border ${
              index === 0 ? 'top-[18px] bottom-0' : 'inset-y-0'
            }`}
          />
          <span className="relative mt-1 size-3.5 rounded-full border-2 border-border-strong bg-background" />
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[15px] font-medium text-text">
              {item.title}
              <span
                className={`rounded px-1.5 py-[3px] text-[11px] font-semibold leading-none ${PRIORITY_STYLES[item.priority]}`}
              >
                {item.priority}
              </span>
              {item.gap && (
                <span className="rounded border border-border px-1.5 py-0.5 text-[11px] leading-none text-text-weaker">
                  Gap
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[13px] text-text-weaker">
              {item.detail}
            </div>
          </div>
        </div>
      ))}
      <div className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-3.5 py-3">
        <span className="absolute inset-y-0 left-1.5 w-0.5 bg-border" />
        <span className="relative mt-1 size-3.5 rounded-full border-2 border-text bg-text" />
        <div className="text-[15px] font-medium text-text">
          Job-ready by Oct 23
        </div>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 border-t border-border bg-surface px-5 py-3.5">
      <MockButton primary>Start simulation</MockButton>
      <MockButton>My notes</MockButton>
      <MockButton>Sources</MockButton>
    </div>
  </div>
);

export default HeroRoadmapMock;
