import axiosInstance from '../axiosInstance';
import { API_ROUTES } from '../api';
import { CreateNoteDto, Note, UpdateNoteDto } from './types';

/**
 * Retrieves the authenticated user's notes.
 * - no params: all notes
 * - { interviewId }: only notes linked to that interview
 * - { standalone: true }: only notes with no interview link
 */
export const getUserNotes = async (params?: {
  interviewId?: string;
  standalone?: boolean;
}): Promise<Note[]> => {
  try {
    let url = API_ROUTES.notes;
    if (params?.interviewId !== undefined) {
      url = `${API_ROUTES.notes}?interviewId=${encodeURIComponent(params.interviewId)}`;
    } else if (params?.standalone === true) {
      url = `${API_ROUTES.notes}?standalone=true`;
    }
    const { data } = await axiosInstance.get<Note[]>(url);
    return data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

/** Retrieves a single note by ID. */
export const getNoteById = async (noteId: string): Promise<Note> => {
  try {
    const { data } = await axiosInstance.get<Note>(
      `${API_ROUTES.notes}/${noteId}`,
    );
    return data;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  }
};

/** Creates a new note. */
export const createNote = async (dto: CreateNoteDto): Promise<Note> => {
  try {
    const { data } = await axiosInstance.post<Note>(API_ROUTES.notes, dto);
    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

/** Updates an existing note. */
export const updateNote = async (
  noteId: string,
  dto: UpdateNoteDto,
): Promise<Note> => {
  try {
    const { data } = await axiosInstance.put<Note>(
      `${API_ROUTES.notes}/${noteId}`,
      dto,
    );
    return data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

/** Deletes a note. */
export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`${API_ROUTES.notes}/${noteId}`);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};
