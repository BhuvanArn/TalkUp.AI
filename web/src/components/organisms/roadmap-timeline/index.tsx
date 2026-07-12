import { MatchGauge } from '@/components/atoms/match-gauge';
import { RoadmapTopicCard } from '@/components/molecules/roadmap-topic-card';
import type { Roadmap } from '@/services/applications/types';
import { format } from 'date-fns';

interface RoadmapTimelineProps {
  roadmap: Roadmap;
  /** ISO string or null — drives the goal node label only. */
  interviewAt: string | null;
}

/**
 * Horizontal preparation rail: match-score gauge -> one card per topic (array
 * order = step order) -> job-ready goal node, with a colored fill segment
 * above each milestone. Collapses to a vertical stepper below lg. Token-only.
 */
export const RoadmapTimeline = ({
  roadmap,
  interviewAt,
}: RoadmapTimelineProps) => (
  <ol
    data-testid="roadmap-timeline"
    className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:overflow-x-auto lg:pb-4"
  >
    <li className="flex flex-col items-center gap-2 lg:w-40 lg:shrink-0">
      <MatchGauge score={roadmap.match_score} />
      <p className="text-label-m text-text-weak">Match score</p>
    </li>
    {roadmap.topics.map((topic, index) => (
      <li
        key={`${index}-${topic.title}`}
        className="flex flex-col items-center lg:w-64 lg:shrink-0"
      >
        <span
          aria-hidden="true"
          className="bg-accent mb-2 hidden h-1 w-full rounded-full lg:block"
        />
        <RoadmapTopicCard step={index + 1} topic={topic} />
      </li>
    ))}
    <li className="flex flex-col items-center justify-center gap-2 lg:w-40 lg:shrink-0">
      <span
        aria-hidden="true"
        className="bg-success-weak text-success flex h-14 w-14 items-center justify-center rounded-full"
      >
        ✓
      </span>
      <p className="text-label-m text-text text-center">
        {interviewAt
          ? `Job-ready by ${format(new Date(interviewAt), 'd MMM yyyy')}`
          : 'Job-ready goal'}
      </p>
    </li>
  </ol>
);

export default RoadmapTimeline;
