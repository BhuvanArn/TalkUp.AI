import type { RoadmapTopic } from '@/services/applications/types';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
 * Width is driven by the timeline column; the card fills it. The rationale is
 * clamped to a few lines so a long sentence keeps the card a bounded height —
 * otherwise the two stacked zig-zag halves would exceed the frame and force a
 * vertical scrollbar. When the text is actually clamped, the card becomes a
 * button that opens a popover with the full title + rationale, so nothing is
 * permanently hidden.
 */
export const RoadmapTopicCard = ({ step, topic }: RoadmapTopicCardProps) => {
  const rationaleRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // A block is clamped when its rendered content is taller/wider than the box.
  useLayoutEffect(() => {
    const clamped = (el: HTMLElement | null) =>
      !!el && el.scrollHeight > el.clientHeight + 1;
    setIsTruncated(clamped(rationaleRef.current) || clamped(titleRef.current));
  }, [topic.title, topic.rationale]);

  // Close the popover on outside-click or Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [isOpen]);

  const priorityChip = (
    <span
      className={`text-label-s rounded-full px-2 py-0.5 ${PRIORITY_STYLES[topic.priority]}`}
    >
      {topic.priority}
    </span>
  );

  return (
    <div ref={rootRef} className="relative w-full">
      <article
        className={`bg-surface-raised border-border flex w-full flex-col gap-2 rounded-2xl border p-4 ${
          isTruncated
            ? 'hover:border-accent cursor-pointer transition-colors'
            : ''
        }`}
        onClick={isTruncated ? () => setIsOpen((v) => !v) : undefined}
        role={isTruncated ? 'button' : undefined}
        tabIndex={isTruncated ? 0 : undefined}
        aria-expanded={isTruncated ? isOpen : undefined}
        onKeyDown={
          isTruncated
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsOpen((v) => !v);
                }
              }
            : undefined
        }
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-label-s text-text-weaker">Step {step}</p>
          {priorityChip}
        </div>
        <h3 ref={titleRef} className="text-h6 text-text line-clamp-2">
          {topic.title}
        </h3>
        <p
          ref={rationaleRef}
          className="text-body-s text-text-weak line-clamp-3"
        >
          {topic.rationale}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {topic.gap ? (
            <p className="text-body-s text-error">Gap to close</p>
          ) : (
            <span />
          )}
          {isTruncated && (
            <span className="text-body-s text-accent">Read more</span>
          )}
        </div>
      </article>

      {isOpen && (
        <div
          role="dialog"
          aria-label={`${topic.title} details`}
          className="bg-surface-raised border-border absolute top-0 left-0 z-30 flex w-[min(20rem,80vw)] flex-col gap-2 rounded-2xl border p-4 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-s text-text-weaker">Step {step}</p>
            {priorityChip}
          </div>
          <h3 className="text-h6 text-text">{topic.title}</h3>
          <p className="text-body-s text-text-weak">{topic.rationale}</p>
          {topic.gap && <p className="text-body-s text-error">Gap to close</p>}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-body-s text-accent self-start pt-1"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default RoadmapTopicCard;
