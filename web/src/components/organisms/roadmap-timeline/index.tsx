import { iconMap } from '@/components/atoms/icon/icon-map';
import { MatchGauge } from '@/components/atoms/match-gauge';
import { RoadmapTopicCard } from '@/components/molecules/roadmap-topic-card';
import type { Roadmap } from '@/services/applications/types';
import { format } from 'date-fns';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const ScrollHintIcon = iconMap['arrow-right'];

interface RoadmapTimelineProps {
  roadmap: Roadmap;
  /** ISO string or null — drives the goal node label only. */
  interviewAt: string | null;
  /**
   * The page action bar. Rendered as a `sticky left-0` row INSIDE the same
   * horizontal scroll container as the rail, so it stays pinned in place while
   * the timeline scrolls sideways and the native scrollbar sits below it.
   */
  actions?: ReactNode;
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
      data-rail-dot
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
  actions,
}: RoadmapTimelineProps) => {
  const goalLabel = interviewAt
    ? `Job-ready by ${format(new Date(interviewAt), 'd MMM yyyy')}`
    : 'Job-ready goal';

  // Scroll-affordance: show a right-edge fade + animated chevron only while the
  // rail can still scroll right (there's off-screen content and we're not at the
  // end). Otherwise the horizontal scroll isn't discoverable.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLOListElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // The chevron is centered on the RAIL, not the frame — the frame is taller
  // than the rail (it also holds the pinned action bar + scrollbar), so
  // centering in the frame would drop the chevron below the line. `null` until
  // measured; the chevron stays hidden until then.
  const [railCenterY, setRailCenterY] = useState<number | null>(null);

  const syncScrollHint = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 2px slack so sub-pixel rounding at the end doesn't leave the hint stuck on.
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    // Rail center = the dot band's vertical middle, relative to the frame top
    // (measured via bounding rects so nested offsetParents don't matter).
    const dot = railRef.current?.querySelector<HTMLElement>('[data-rail-dot]');
    if (dot) {
      const dotRect = dot.getBoundingClientRect();
      const frameTop = el.getBoundingClientRect().top;
      setRailCenterY(dotRect.top - frameTop + dotRect.height / 2);
    }
  }, []);

  // Measure on mount and whenever the content/size changes (topic count, resize).
  useLayoutEffect(() => {
    syncScrollHint();
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(syncScrollHint);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncScrollHint, roadmap.topics.length]);

  return (
    // `relative` so the scroll-hint overlay can pin to the frame's right edge,
    // outside the scroll flow (it must not scroll away with the rail).
    <div className="relative h-full">
      {/* Single horizontal scroll container: the rail scrolls, the action bar is
          a `sticky left-0` row that stays put while it does, and the native
          scrollbar renders at the container's bottom edge — below the actions. */}
      <div
        ref={scrollerRef}
        onScroll={syncScrollHint}
        className="border-border flex h-full flex-col rounded-2xl border lg:overflow-x-auto"
      >
        <ol
          ref={railRef}
          data-testid="roadmap-timeline"
          className="relative flex w-full flex-1 flex-col gap-4 p-4 lg:h-auto lg:w-max lg:min-w-full lg:flex-row lg:items-stretch lg:gap-2 lg:p-0"
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

        {actions && (
          <div className="border-border bg-surface sticky left-0 z-20 shrink-0 border-t px-4 py-4 lg:w-screen lg:max-w-full">
            {actions}
          </div>
        )}
      </div>

      {/* Scroll affordance, two decorative layers shown only while more of the
          rail is off-screen (both `aria-hidden` + pointer-events-none so they
          never block the scrollbar/cards, and both fade out at the end):
          1. a full-height right-edge fade that signals "content continues"
             (behind the action bar it just blends into the surface);
          2. an animated chevron pinned to the RAIL's vertical center — not the
             frame center, which sits lower because the frame also holds the
             pinned action bar + scrollbar. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 hidden w-24 rounded-r-2xl transition-opacity duration-300 lg:block ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'linear-gradient(to left, var(--color-surface) 25%, transparent)',
        }}
      />
      {railCenterY !== null && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute right-2 hidden -translate-y-1/2 transition-opacity duration-300 lg:block ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ top: `${railCenterY}px` }}
        >
          <span className="border-border bg-surface-raised text-accent flex h-8 w-8 animate-[scroll-nudge_1.2s_ease-in-out_infinite] items-center justify-center rounded-full border shadow-sm">
            <ScrollHintIcon size={16} />
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * One column of the zig-zag, rendering `payload` exactly ONCE (no duplicate
 * DOM — matters for a11y and for tests that assert a single match).
 *
 * Desktop (`lg+`): a 3-row CSS grid `[minmax(0,1fr) auto minmax(0,1fr)]` —
 * top card row, the rail band, bottom card row. The two `1fr` rows split the
 * column's free space evenly, so the `auto` band (the dot) always sits on the
 * vertical midline; because the `<ol>` stretches every column to the tallest
 * one (`items-stretch`), those midlines align into one straight rail across all
 * columns. Cards live in a `1fr` row and grow to their content WITHOUT a fixed
 * height, so a long rationale can never clip past the frame. The rail line is
 * drawn per-column across the band and `edge` trims it at the first/last dot.
 *
 * Mobile: the grid collapses to a plain flex row (dot then payload) via
 * `order`, so the single payload instance flows inline regardless of `half`.
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

  // Card cell: top row (grid-row 1, aligned to the rail) or bottom row (row 3).
  // `order-2` keeps it after the dot on mobile's flex row.
  const cardCell =
    half === 'top'
      ? 'lg:row-start-1 lg:items-end lg:pb-6'
      : 'lg:row-start-3 lg:items-start lg:pt-6';

  return (
    <li className="relative flex min-w-0 items-center gap-4 lg:grid lg:w-[15.5rem] lg:shrink-0 lg:grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-0">
      <div
        className={`order-2 flex min-w-0 justify-center lg:px-2 ${cardCell}`}
      >
        {payload}
      </div>

      {/* Rail band (grid row 2): the line + the dot, on the column midline
          (desktop) or first in the row (mobile, via order-1). */}
      <div className="order-1 flex shrink-0 items-center justify-center lg:relative lg:row-start-2 lg:h-8">
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
