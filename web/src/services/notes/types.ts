export interface Note {
  note_id: string;
  user_id: string;
  interview_id?: string | null;
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
  content?: string;
  color?: string;
  is_favorite?: boolean;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  color?: string;
  is_favorite?: boolean;
}
