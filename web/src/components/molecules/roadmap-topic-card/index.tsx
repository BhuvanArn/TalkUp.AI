import type { RoadmapTopic } from '@/services/applications/types';

interface RoadmapTopicCardProps {
  /** 1-based position of this topic on the timeline. */
  step: number;
  topic: RoadmapTopic;
}

// HIGH -> error, MED -> warning (there is no `warn` token), LOW -> success.
const PRIORITY_STYLES: Record<RoadmapTopic['priority'], string> = {
  HIGH: 'bg-error-weak text-error',
  MED: 'bg-warning-weak text-warning',
  LOW: 'bg-success-weak text-success',
};

/**
 * One milestone card under a roadmap timeline node. Token-only styling.
 * `h-full` lets sibling cards match the tallest in a row (the timeline sets
 * `items-stretch`), so a long rationale no longer leaves a ragged bottom edge.
 * The gap note is pushed to the base with `mt-auto` so it aligns across cards.
 */
export const RoadmapTopicCard = ({ step, topic }: RoadmapTopicCardProps) => (
  <article className="bg-surface-raised border-border flex h-full w-full flex-col gap-2 rounded-2xl border p-4">
    <div className="flex items-center justify-between gap-2">
      <p className="text-label-s text-text-weaker">Step {step}</p>
      <span
        className={`text-label-s rounded-full px-2 py-0.5 ${PRIORITY_STYLES[topic.priority]}`}
      >
        {topic.priority}
      </span>
    </div>
    <h3 className="text-h6 text-text">{topic.title}</h3>
    <p className="text-body-s text-text-weak">{topic.rationale}</p>
    {topic.gap && (
      <p className="text-body-s text-error mt-auto pt-1">Gap to close</p>
    )}
  </article>
);

export default RoadmapTopicCard;
