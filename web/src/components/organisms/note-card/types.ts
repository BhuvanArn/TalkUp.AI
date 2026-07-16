import { BubbleProps } from '@/components/atoms/bubble/types';

/**
 * @property id - Unique identifier for the note.
 * @property title - Title of the note displayed on the card.
 * @property preview - Short excerpt or preview of the note content.
 * @property color - Visual color variant for the note bubble (uses BubbleProps['color']).
 * @property lastUpdatedAt - Date object representing when the note was last updated.
 * @property isFavorite - Optional boolean indicating if the note is marked as a favorite.
 * @property onToggleFavorite - Optional callback invoked when the favorite state is toggled; receives the note id.
 * @property onClick - Optional callback invoked when the card is clicked; receives the note id.
 */
/**
 * Small provenance badge shown on a note card: a pill (e.g. "Simulation",
 * "Application") plus an optional secondary line (the application name, the
 * simulation date). Omitted for general notes.
 */
export interface NoteCardBadge {
  label: string;
  tone: 'application' | 'simulation';
  sublabel?: string;
}

export interface NoteCardProps {
  id: string;
  title: string;
  preview: string;
  color: BubbleProps['color'];
  lastUpdatedAt: Date;
  isFavorite?: boolean;
  badge?: NoteCardBadge;
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
}
