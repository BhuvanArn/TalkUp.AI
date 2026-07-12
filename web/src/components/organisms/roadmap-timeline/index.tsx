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

/** The end/origin fixed-width nodes (gauge, goal) share this column width so
 * the rail's start/end insets line up with their dot centers. */
const EDGE_W = 'lg:w-44';
const STEP_W = 'lg:w-64';

/**
 * Preparation rail: the signature element. A single continuous accent line
 * threads through every node — origin gauge → one numbered step per topic →
 * job-ready goal — so the page reads as a walkable route rather than a wall of
 * cards. The dots sit ON the rail (dot `z-10` over the line at `z-0`); cards
 * hang beneath.
 *
 * Horizontal on `lg+` (scrolls when it overflows, with a right-edge fade hint
 * so hidden steps are discoverable); collapses to a vertical stepper below,
 * where the rail runs down the left gutter instead. Token-only — every color
 * theme-flips, so dark mode needs no special-casing.
 *
 * The rail is drawn ONCE per orientation (not per node) to avoid Tailwind
 * utility-ordering collisions between trimmed segments; the fixed edge-column
 * width (`lg:w-44` → 176px) lets the horizontal line inset exactly to the first
 * and last dot centers (88px = half that column).
 */
export const RoadmapTimeline = ({
  roadmap,
  interviewAt,
}: RoadmapTimelineProps) => {
  const goalLabel = interviewAt
    ? `Job-ready by ${format(new Date(interviewAt), 'd MMM yyyy')}`
    : 'Job-ready goal';

  return (
    // Outer wrapper holds the fade hint (pinned to the visible edge, outside
    // the scroller). The middle div is the scroller; the <ol> shrinks to its
    // content width (`lg:w-max`) so the absolute rail insets from the true
    // content edges (last dot), not the viewport edge.
    <div className="relative">
      <div className="lg:overflow-x-auto lg:pb-1">
        <ol
          data-testid="roadmap-timeline"
          className="relative flex flex-col gap-4 lg:w-max lg:flex-row lg:items-stretch lg:gap-0 lg:pb-4"
        >
          {/* Vertical rail (mobile): runs down the left dot gutter. Dot center is
            at 16px (top-4) from each row's top; left-4 aligns to the 32px dot's
            center. Sits behind the dots. */}
          <span
            aria-hidden="true"
            className="bg-accent-weak absolute top-4 bottom-4 left-4 w-0.5 lg:hidden"
          />
          {/* Horizontal rail (lg+): one line at dot-center height, inset to the
            first/last dot centers (half of the 176px edge column). */}
          <span
            aria-hidden="true"
            className="bg-accent-weak absolute top-4 left-[88px] right-[88px] hidden h-0.5 lg:block"
          />

          {/* Origin — the match gauge, anchored to the start of the rail. */}
          <li
            className={`flex items-start gap-4 ${EDGE_W} lg:shrink-0 lg:flex-col lg:items-center lg:gap-3`}
          >
            <RailDot variant="origin">%</RailDot>
            <div className="flex flex-col items-center gap-1 lg:pt-2">
              <MatchGauge score={roadmap.match_score} />
              <p className="text-label-m text-text-weak">Match score</p>
            </div>
          </li>

          {roadmap.topics.map((topic, index) => (
            <li
              key={`${index}-${topic.title}`}
              className={`flex items-start gap-4 ${STEP_W} lg:shrink-0 lg:flex-col lg:items-center lg:gap-3`}
            >
              <RailDot variant="step">{index + 1}</RailDot>
              <RoadmapTopicCard step={index + 1} topic={topic} />
            </li>
          ))}

          {/* Goal — the end of the route. */}
          <li
            className={`flex items-start gap-4 ${EDGE_W} lg:shrink-0 lg:flex-col lg:items-center lg:gap-3`}
          >
            <RailDot variant="goal">✓</RailDot>
            <p className="text-label-m text-text pt-1 lg:pt-2 lg:text-center">
              {goalLabel}
            </p>
          </li>
        </ol>
      </div>

      {/* Right-edge fade: hints that the rail scrolls to more steps (lg+). */}
      <span
        aria-hidden="true"
        className="from-surface pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l to-transparent lg:block"
      />
    </div>
  );
};

export default RoadmapTimeline;
