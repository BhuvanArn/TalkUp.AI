export interface Note {
  note_id: string;
  user_id: string;
  interview_id?: string | null;
  application_id?: string | null;
  title: string;
  content: string;
  color: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteDto {
  title: string;
  interviewId?: string;
  applicationId?: string;
  content?: string;
  color?: string;
  is_favorite?: boolean;
}

/**
 * The three note kinds, derived from a note's links:
 * - `simulation` — taken during a simulation (`interview_id` set); its
 *   application is denormalized onto `application_id`.
 * - `application` — scoped to an application (`application_id` set, no interview).
 * - `general` — neither link.
 */
export type NoteKind = 'general' | 'application' | 'simulation';

export const getNoteKind = (note: Note): NoteKind => {
  if (note.interview_id) return 'simulation';
  if (note.application_id) return 'application';
  return 'general';
};

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  color?: string;
  is_favorite?: boolean;
}
