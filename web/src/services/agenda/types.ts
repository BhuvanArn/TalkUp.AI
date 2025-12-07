/**
 * Data Transfer Object for creating a new agenda event.
 */
export interface CreateEventDto {
  /** The title of the event. */
  title: string;
  /** A brief description of the event. */
  description?: string;
  /** The start date and time of the event in ISO 8601 format. */
  start_at: string;
  /** The end date and time of the event in ISO 8601 format. */
  end_at?: string;
  /** The location where the event will take place. */
  location?: string;
  /** Indicates if the event lasts all day. */
  all_day?: boolean;
  /** The color associated with the event (e.g., hex code or color name). */
  color?: string;
  /** The timezone of the event. */
  timezone?: string;
}

/**
 * Data Transfer Object for updating an existing agenda event.
 * All fields are optional.
 */
export interface UpdateEventDto extends Partial<CreateEventDto> {}

/**
 * Represents an agenda event as returned by the API.
 */
export interface AgendaEvent {
  /** The unique identifier of the event. */
  event_id: string;
  /** The title of the event. */
  title: string;
  /** A brief description of the event. */
  description?: string;
  /** The start date and time of the event in ISO 8601 format. */
  start_at: string;
  /** The end date and time of the event in ISO 8601 format. */
  end_at?: string;
  /** The location where the event will take place. */
  location?: string;
  /** Indicates if the event lasts all day. */
  all_day?: boolean;
  /** The color associated with the event. */
  color?: string;
  /** The timezone of the event. */
  timezone?: string;
  /** The unique identifier of the user who owns the event. */
  user_id: string;
  /** The timestamp when the event was created. */
  created_at: string;
  /** The timestamp when the event was last updated. */
  updated_at: string;
}

/**
 * Data Transfer Object for querying events.
 * Used to filter events within a specific date range.
 */
export interface GetEventsQueryDto {
  /** The start of the date range to filter events. */
  start_at?: string;
  /** The end of the date range to filter events. */
  end_at?: string;
}
