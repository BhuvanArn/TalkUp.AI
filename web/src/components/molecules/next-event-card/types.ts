/**
 * NextEventCard component props.
 */
export interface NextEventCardProps {
  /** The main title of the event. */
  title: string;
  /** The secondary subtitle or location of the event. */
  subtitle: string;
  /** The label for the event tag (e.g., 'TalkUp'). */
  tagLabel: string;
  /** The URL for viewing event details. */
  detailsUrl: string;
  /** The complete Date object of the event. */
  eventDate: Date;
}
