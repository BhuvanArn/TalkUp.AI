import { getUserNotes } from '@/services/notes/http';
import type { Note } from '@/services/notes/types';
import { useEffect, useState } from 'react';

const sortNotes = (notes: Note[]) => {
  return notes.sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
};

/**
 * Custom hook for managing the notes list.
 *
 * @param applicationId When set, only fetch notes for that application (its
 *   application-scoped and in-simulation notes) — used by the roadmap "My
 *   notes" deep-link. When undefined, fetch all of the user's notes.
 */
export const useNotesList = (applicationId?: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard against out-of-order responses when applicationId changes while a
    // fetch is in flight (scoped <-> unscoped on the same mounted route): only
    // the latest effect run may commit its result.
    let ignore = false;
    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedNotes = await getUserNotes(
          applicationId ? { applicationId } : undefined,
        );
        if (ignore) return;
        const sortedNotes = sortNotes(fetchedNotes);
        setNotes(sortedNotes);
      } catch (err) {
        if (ignore) return;
        console.error('Error fetching notes:', err);
        setError('Failed to load notes. Please try again.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchNotes();
    return () => {
      ignore = true;
    };
  }, [applicationId]);

  const addNote = (note: Note) => {
    setNotes((prevNotes) => [note, ...prevNotes]);
  };

  const updateNoteInList = (noteId: string, updates: Partial<Note>) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((n) =>
        n.note_id === noteId ? { ...n, ...updates } : n,
      );
      return sortNotes(updatedNotes);
    });
  };

  const revertNoteInList = (noteId: string, originalNote: Note) => {
    setNotes((prevNotes) => {
      const revertedNotes = prevNotes.map((n) =>
        n.note_id === noteId ? originalNote : n,
      );
      return sortNotes(revertedNotes);
    });
  };

  const deleteNoteFromList = (noteId: string) => {
    setNotes((prevNotes) => prevNotes.filter((n) => n.note_id !== noteId));
  };

  return {
    notes,
    isLoading,
    error,
    setError,
    addNote,
    updateNoteInList,
    revertNoteInList,
    deleteNoteFromList,
  };
};
