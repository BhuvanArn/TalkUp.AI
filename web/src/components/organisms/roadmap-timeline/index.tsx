import { MatchGauge } from '@/components/atoms/match-gauge';
import { RoadmapTopicCard } from '@/components/molecules/roadmap-topic-card';
import type { Roadmap } from '@/services/applications/types';
import { format } from 'date-fns';
import type { ReactNode } from 'react';

interface RoadmapTimelineProps {
  roadmap: Roadmap;
  /** ISO string or null — drives the goal node label only. */
  interviewAt: string | null;
}

type RailDotVariant = 'origin' | 'step' | 'goal';

/** A dot sitting on the shared rail; `variant` picks its themed color. */
const RailDot = ({
  variant,
  children,
}: {
  variant: RailDotVariant;
  children?: ReactNode;
}) => {
  const styles: Record<RailDotVariant, string> = {
    origin: 'bg-accent-weak text-accent border-accent',
    step: 'bg-accent text-white border-accent',
    goal: 'bg-success-weak text-success border-success',
  };
  return (
    <span
      aria-hidden="true"
      className={`text-label-s relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

/**
 * Preparation rail — the signature element. On `lg+` it's a zig-zag timeline:
 * a single accent line runs the full width, the gauge anchors the start and the
 * job-ready node the end, and the numbered step cards alternate ABOVE and BELOW
 * the line (odd above, even below) so the eye walks the route left-to-right.
 *
 * Each column reserves equal space above and below the centered rail; a step
 * renders its card in one half and leaves the other empty. Columns `flex-1` to
 * fill the width when there are few topics, but keep a min-width so with many
 * topics the row overflows and the timeline scrolls horizontally — the scroll
 * lives inside this component, so the page CTAs below stay put.
 *
 * Below `lg` it collapses to a vertical stepper: rail down the left gutter,
 * cards stacked. Token-only — every color theme-flips, no dark-mode casing.
 */
export const RoadmapTimeline = ({
  roadmap,
  interviewAt,
}: RoadmapTimelineProps) => {
  const goalLabel = interviewAt
    ? `Job-ready by ${format(new Date(interviewAt), 'd MMM yyyy')}`
    : 'Job-ready goal';

  return (
    <div className="h-full lg:flex lg:items-center lg:overflow-x-auto">
      <ol
        data-testid="roadmap-timeline"
        className="relative flex h-full w-full flex-col gap-4 lg:h-auto lg:w-max lg:min-w-full lg:flex-row lg:items-stretch lg:gap-2"
      >
        {/* Vertical rail (mobile): down the left dot gutter, behind the dots. */}
        <span
          aria-hidden="true"
          className="bg-accent-weak absolute top-4 bottom-4 left-4 w-0.5 lg:hidden"
        />

        {/* Origin — match gauge. Anchors the start; its label sits below. */}
        <ZigNode
          half="bottom"
          edge="start"
          dot={<RailDot variant="origin">%</RailDot>}
          payload={
            <div className="flex flex-col items-center gap-1">
              <MatchGauge score={roadmap.match_score} />
              <p className="text-label-m text-text-weak">Match score</p>
            </div>
          }
        />

        {roadmap.topics.map((topic, index) => (
          <ZigNode
            key={`${index}-${topic.title}`}
            half={index % 2 === 0 ? 'top' : 'bottom'}
            dot={<RailDot variant="step">{index + 1}</RailDot>}
            payload={<RoadmapTopicCard step={index + 1} topic={topic} />}
          />
        ))}

        {/* Goal — the end of the route; label sits below the node. */}
        <ZigNode
          half="bottom"
          edge="end"
          dot={<RailDot variant="goal">✓</RailDot>}
          payload={
            <p className="text-label-m text-text max-w-[9rem] text-center">
              {goalLabel}
            </p>
          }
        />
      </ol>
    </div>
  );
};

/**
 * One column of the zig-zag, rendering `payload` exactly ONCE (no duplicate
 * DOM — matters for a11y and for tests that assert a single match).
 *
 * Desktop (`lg+`): the column is a flex column of three cells —
 * [top slot | rail band | bottom slot]. Each of the top/bottom slots keeps an
 * equal min-height so every column is the same height and the rail line stays
 * vertically centered; the payload occupies the slot named by `half` and the
 * opposite slot is an empty spacer. The rail line is drawn per-column across the
 * band, so columns tile into one continuous line with no viewport-edge
 * clipping; `edge` trims it at the first/last column so it starts/ends on a dot.
 *
 * Mobile: the column becomes a plain flex row (dot then payload). The empty
 * spacer slot collapses (`min-h-0`) and CSS `order` pulls the payload up next
 * to the dot, so the single payload instance flows inline regardless of `half`.
 */
const ZigNode = ({
  half,
  edge,
  dot,
  payload,
}: {
  half: 'top' | 'bottom';
  edge?: 'start' | 'end';
  dot: ReactNode;
  payload: ReactNode;
}) => {
  const railLine =
    edge === 'start'
      ? 'left-1/2 right-0'
      : edge === 'end'
        ? 'left-0 right-1/2'
        : 'inset-x-0';

  // Single payload instance. Mobile: static, inline after the dot (order-2).
  // Desktop: absolutely positioned into the top or bottom half of the
  // fixed-height column, so the dot stays exactly on the midline (one straight
  // rail through all dots) while the cards zig-zag above/below it.
  const payloadPlacement =
    half === 'top'
      ? 'lg:absolute lg:inset-x-0 lg:top-0 lg:bottom-1/2 lg:flex lg:items-end lg:justify-center lg:px-2 lg:pb-6'
      : 'lg:absolute lg:inset-x-0 lg:top-1/2 lg:bottom-0 lg:flex lg:items-start lg:justify-center lg:px-2 lg:pt-6';

  return (
    <li className="relative flex min-w-0 items-center gap-4 lg:h-[26rem] lg:w-[15.5rem] lg:shrink-0 lg:flex-col lg:items-stretch lg:justify-center lg:gap-0">
      <div className={`order-2 min-w-0 ${payloadPlacement}`}>{payload}</div>

      {/* Rail band: the line + the dot, on the column midline (desktop) or first
          in the row (mobile, via order-1). */}
      <div className="order-1 flex shrink-0 items-center justify-center lg:relative lg:h-8">
        <span
          aria-hidden="true"
          className={`bg-accent-weak absolute top-1/2 hidden h-0.5 -translate-y-1/2 lg:block ${railLine}`}
        />
        {dot}
      </div>
    </li>
  );
};

export default RoadmapTimeline;
