import { Bubble } from '@/components/atoms/bubble';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { formatRelativeDate } from '@/utils/time';
import DOMPurify from 'dompurify';
import { useState } from 'react';

import { NoteCardProps } from './types';

/**
 * NoteCard
 *
 * Renders a compact, interactive card representing a single note. The card displays:
 * - a colored "bubble" indicator,
 * - the note title (clamped to two lines),
 * - an HTML preview of the note (clamped to several lines),
 * - a favorite/bookmark toggle button,
 * - and the relative "last updated" time.
 *
 * The component handles hover state to adapt the bookmark icon color and provides
 * click handlers for both the whole card (navigational/select action) and the bookmark button
 * (favorite toggle). The bookmark button prevents the card click from firing when toggled.
 *
 * Important security note:
 * - The `preview` prop is injected into the DOM using `dangerouslySetInnerHTML`. The caller
 *   must ensure the HTML is sanitized or otherwise comes from a trusted source to avoid XSS.
 *
 * @param props : NoteCardProps - The props of the Note Card component
 *
 * @remarks
 * - Visual clamps for preview are implemented using CSS line-clamp (WebKit) and overflow-hidden
 *   to ensure the card stays a fixed height.
 * - The bookmark button includes an accessible `aria-label` that updates depending on the
 *   `isFavorite` state ("Add to favorites" / "Remove from favorites").
 *
 * @returns A React functional component rendering the described note card UI.
 *
 * @example
 * <NoteCard
 *   id="note-123"
 *   title="My Note"
 *   preview="<p>Some <strong>HTML</strong> content</p>"
 *   color="blue"
 *   lastUpdatedAt={new Date()}
 *   isFavorite={false}
 *   onToggleFavorite={(id) => console.log('toggle', id)}
 *   onClick={(id) => navigateToNote(id)}
 * />
 */
export const NoteCard = ({
  id,
  title,
  preview,
  color,
  lastUpdatedAt,
  isFavorite = false,
  badge,
  onToggleFavorite,
  onClick,
}: NoteCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(id);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  // Check if preview is empty or contains only empty HTML tags
  const isPreviewEmpty =
    !preview ||
    preview.trim() === '' ||
    preview.replace(/<[^>]*>/g, '').trim() === '';

  return (
    <div
      tabIndex={0}
      className={`bg-note-card ${!isBtnHovered ? 'hover:bg-note-card-hover' : ''} rounded-lg p-3 transition-all duration-200 cursor-pointer h-full flex flex-col gap-3`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="flex items-center pl-1 justify-between gap-3">
        <div className="flex items-center gap-4">
          <Bubble size="sm" color={color} />
          <h3 className="text-h3 text-text-idle font-semibold line-clamp-2 flex-1">
            {title}
          </h3>
        </div>
        <Button
          onClick={handleBookmarkClick}
          variant="text"
          color="neutral"
          size="sm"
          className="stop-propagation"
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
          onFocus={() => setIsBtnHovered(true)}
          onBlur={() => setIsBtnHovered(false)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Icon
            icon={isFavorite ? 'bookmark-filled' : 'bookmark'}
            className={`transition-colors ${
              isFavorite
                ? 'text-accent'
                : isHovered
                  ? 'text-text-idle'
                  : 'text-text-weaker'
            }`}
          />
        </Button>
      </div>

      {badge && (
        <div className="flex flex-wrap items-center gap-2 pl-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-s font-medium ${
              badge.tone === 'simulation'
                ? 'bg-accent-weak text-accent'
                : 'bg-primary-weak text-primary'
            }`}
          >
            <Icon
              icon={badge.tone === 'simulation' ? 'schedule' : 'applications'}
              className="w-3 h-3"
            />
            {badge.label}
          </span>
          {badge.sublabel && (
            <span className="text-body-s text-text-weaker truncate">
              {badge.sublabel}
            </span>
          )}
        </div>
      )}

      <div className="bg-white text-text-idle p-3 h-40 rounded-[10px] overflow-hidden relative">
        {isPreviewEmpty ? (
          <p className="text-text-weakest italic text-xs">
            Start writing your note...
          </p>
        ) : (
          <div
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            <div
              className="note-preview-content"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(preview),
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-body-s text-text-weakest mt-auto">
        <Icon icon="clock" className="w-3 h-3" />
        <span>Updated {formatRelativeDate(lastUpdatedAt)}</span>
      </div>
    </div>
  );
};
