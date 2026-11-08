import type { RoadmapTopic } from '@/services/applications/types';
import type { ParseKeys } from 'i18next';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RoadmapTopicCardProps {
  /** 1-based position of this topic on the timeline. */
  step: number;
  topic: RoadmapTopic;
}

// HIGH -> error, MED -> warning (there is no `warn` token), LOW -> success.
// `-active` text shades keep the small labels above 4.5:1 on their weak
// backgrounds in both themes (the base status tokens fall short). Also used by
// the landing roadmap mock, so the two stay in sync.
export const PRIORITY_STYLES: Record<RoadmapTopic['priority'], string> = {
  HIGH: 'bg-error-weak text-error-active',
  MED: 'bg-warning-weak text-warning-active',
  LOW: 'bg-success-weak text-success-active',
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
const PRIORITY_LABEL_KEYS = {
  HIGH: 'roadmap.priority.high',
  MED: 'roadmap.priority.med',
  LOW: 'roadmap.priority.low',
} as const satisfies Record<RoadmapTopic['priority'], ParseKeys<'app'>>;

export const RoadmapTopicCard = ({ step, topic }: RoadmapTopicCardProps) => {
  const { t } = useTranslation(['app', 'common']);
  const rationaleRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [isTruncated, setIsTruncated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // A block is clamped when its rendered content is taller/wider than the box.
  useLayoutEffect(() => {
    const clamped = (el: HTMLElement | null) =>
      !!el && el.scrollHeight > el.clientHeight + 1;
    setIsTruncated(clamped(rationaleRef.current) || clamped(titleRef.current));
  }, [topic.title, topic.rationale]);

  // The card goes `inert` while the popover is open, which drops focus to
  // <body>. Hand it to the panel on open and take it back on close so keyboard
  // users stay on this card.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    } else if (wasOpen.current && document.activeElement === document.body) {
      articleRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

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
      {t(PRIORITY_LABEL_KEYS[topic.priority])}
    </span>
  );

  return (
    <div ref={rootRef} className="relative w-full">
      <article
        ref={articleRef}
        className={`bg-surface-raised border-border flex w-full flex-col gap-2 rounded-2xl border p-4 ${
          isTruncated
            ? 'hover:border-accent cursor-pointer transition-colors'
            : ''
        } ${isOpen ? 'invisible' : ''}`}
        aria-hidden={isOpen}
        // While the popover is open the card is `invisible` (kept in flow so
        // the timeline row does not reflow), so it must not be focusable.
        inert={isOpen ? true : undefined}
        onClick={isTruncated ? () => setIsOpen((v) => !v) : undefined}
        role={isTruncated ? 'button' : undefined}
        tabIndex={isTruncated ? 0 : undefined}
        aria-expanded={isTruncated ? isOpen : undefined}
        aria-controls={isTruncated ? panelId : undefined}
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
          <p className="text-label-s text-text-weaker">
            {t('roadmap.topic.step', { step })}
          </p>
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
            <p className="text-body-s text-error">{t('roadmap.topic.gap')}</p>
          ) : (
            <span />
          )}
          {isTruncated && (
            <span className="text-body-s text-accent">
              {t('roadmap.topic.readMore')}
            </span>
          )}
        </div>
      </article>

      {isOpen && (
        <div
          id={panelId}
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-label={t('roadmap.topic.details', { title: topic.title })}
          className="bg-surface-raised border-border absolute top-0 left-0 z-30 flex w-[min(20rem,80vw)] min-w-full flex-col gap-2 rounded-2xl border p-4 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-s text-text-weaker">
              {t('roadmap.topic.step', { step })}
            </p>
            {priorityChip}
          </div>
          <h3 className="text-h6 text-text">{topic.title}</h3>
          <p className="text-body-s text-text-weak">{topic.rationale}</p>
          {topic.gap && (
            <p className="text-body-s text-error">{t('roadmap.topic.gap')}</p>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-body-s text-accent self-start pt-1"
          >
            {t('common:actions.close')}
          </button>
        </div>
      )}
    </div>
  );
};

export default RoadmapTopicCard;
