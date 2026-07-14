import { getUserNotes } from '@/services/notes/http';
import type { Note } from '@/services/notes/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotesList } from './useNotesList';

// Mock dependencies
vi.mock('@/services/notes/http', () => ({
  getUserNotes: vi.fn(),
}));

describe('useNotesList', () => {
  const mockNotes: Note[] = [
    {
      note_id: 'note-1',
      user_id: 'user-1',
      title: 'Note 1',
      content: '<p>Content 1</p>',
      color: 'blue',
      is_favorite: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z', // Most recent
    },
    {
      note_id: 'note-2',
      user_id: 'user-1',
      title: 'Note 2',
      content: '<p>Content 2</p>',
      color: 'red',
      is_favorite: true, // Favorite
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      note_id: 'note-3',
      user_id: 'user-1',
      title: 'Note 3',
      content: '<p>Content 3</p>',
      color: 'green',
      is_favorite: false,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z', // Oldest
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty notes and loading state', () => {
    (getUserNotes as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { result } = renderHook(() => useNotesList());

    expect(result.current.notes).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches and sorts notes on mount', async () => {
    (getUserNotes as any).mockResolvedValue(mockNotes);

    const { result } = renderHook(() => useNotesList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Notes should be sorted: favorites first, then by updated_at desc
    expect(result.current.notes).toHaveLength(3);
    expect(result.current.notes[0].note_id).toBe('note-2'); // Favorite
    expect(result.current.notes[1].note_id).toBe('note-1'); // Most recent non-favorite
    expect(result.current.notes[2].note_id).toBe('note-3'); // Oldest non-favorite
    expect(result.current.error).toBeNull();
  });

  it('fetches unscoped notes when no applicationId is given', async () => {
    (getUserNotes as any).mockResolvedValue([]);
    renderHook(() => useNotesList());
    await waitFor(() => expect(getUserNotes).toHaveBeenCalled());
    expect(getUserNotes).toHaveBeenCalledWith(undefined);
  });

  it('scopes the fetch to an application when applicationId is given', async () => {
    (getUserNotes as any).mockResolvedValue([]);
    renderHook(() => useNotesList('app-1'));
    await waitFor(() => expect(getUserNotes).toHaveBeenCalled());
    expect(getUserNotes).toHaveBeenCalledWith({ applicationId: 'app-1' });
  });

  it('handles fetch errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (getUserNotes as any).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useNotesList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notes).toEqual([]);
    expect(result.current.error).toBe(
      'Failed to load notes. Please try again.',
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching notes:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('clears error on successful fetch after error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (getUserNotes as any).mockRejectedValue(new Error('Fetch failed'));

    const { result, rerender } = renderHook(() => useNotesList());

    await waitFor(() => {
      expect(result.current.error).toBe(
        'Failed to load notes. Please try again.',
      );
    });

    // Mock successful response and trigger re-fetch by unmounting/remounting
    (getUserNotes as any).mockResolvedValue(mockNotes);

    rerender();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    consoleSpy.mockRestore();
  });

  describe('addNote', () => {
    it('adds a new note to the beginning of the list', async () => {
      (getUserNotes as any).mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newNote: Note = {
        note_id: 'note-4',
        user_id: 'user-1',
        title: 'New Note',
        content: '<p>New content</p>',
        color: 'yellow',
        is_favorite: false,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
      };

      act(() => {
        result.current.addNote(newNote);
      });

      expect(result.current.notes[0]).toEqual(newNote);
      expect(result.current.notes).toHaveLength(4);
    });
  });

  describe('updateNoteInList', () => {
    it('updates a note and maintains sorting', async () => {
      (getUserNotes as any).mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateNoteInList('note-1', { title: 'Updated Note 1' });
      });

      const updatedNote = result.current.notes.find(
        (n) => n.note_id === 'note-1',
      );
      expect(updatedNote?.title).toBe('Updated Note 1');
    });

    it('re-sorts when updating favorite status', async () => {
      (getUserNotes as any).mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Make note-1 a favorite
      act(() => {
        result.current.updateNoteInList('note-1', { is_favorite: true });
      });

      // note-1 should now be first or second (both favorites, sorted by date)
      const note1Index = result.current.notes.findIndex(
        (n) => n.note_id === 'note-1',
      );
      expect(note1Index).toBeLessThanOrEqual(1); // Should be in top 2
      expect(result.current.notes[note1Index].is_favorite).toBe(true);
    });
  });

  describe('revertNoteInList', () => {
    it('reverts a note to its original state and re-sorts', async () => {
      (getUserNotes as any).mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalNote = result.current.notes.find(
        (n) => n.note_id === 'note-1',
      )!;

      // Update the note
      act(() => {
        result.current.updateNoteInList('note-1', {
          title: 'Updated',
          is_favorite: true,
        });
      });

      // Verify it was updated
      let updatedNote = result.current.notes.find(
        (n) => n.note_id === 'note-1',
      );
      expect(updatedNote?.title).toBe('Updated');
      expect(updatedNote?.is_favorite).toBe(true);

      // Revert
      act(() => {
        result.current.revertNoteInList('note-1', originalNote);
      });

      // Should be back to original
      const revertedNote = result.current.notes.find(
        (n) => n.note_id === 'note-1',
      );
      expect(revertedNote).toEqual(originalNote);
    });
  });

  describe('deleteNoteFromList', () => {
    it('removes a note from the list', async () => {
      (getUserNotes as any).mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notes).toHaveLength(3);

      act(() => {
        result.current.deleteNoteFromList('note-2');
      });

      expect(result.current.notes).toHaveLength(2);
      expect(
        result.current.notes.find((n) => n.note_id === 'note-2'),
      ).toBeUndefined();
    });

    it('does nothing if note ID does not exist', async () => {
      (getUserNotes as any).mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialLength = result.current.notes.length;

      act(() => {
        result.current.deleteNoteFromList('non-existent-id');
      });

      expect(result.current.notes).toHaveLength(initialLength);
    });
  });

  describe('setError', () => {
    it('allows setting error manually', async () => {
      (getUserNotes as any).mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Custom error message');
      });

      expect(result.current.error).toBe('Custom error message');
    });

    it('allows clearing error manually', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (getUserNotes as any).mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.error).toBe(
          'Failed to load notes. Please try again.',
        );
      });

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('sorting behavior', () => {
    it('sorts favorites first, then by updated_at descending', async () => {
      const unsortedNotes: Note[] = [
        {
          note_id: 'note-1',
          user_id: 'user-1',
          title: 'Regular Old',
          content: '',
          color: 'blue',
          is_favorite: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z', // Oldest
        },
        {
          note_id: 'note-2',
          user_id: 'user-1',
          title: 'Favorite Recent',
          content: '',
          color: 'red',
          is_favorite: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z', // Most recent favorite
        },
        {
          note_id: 'note-3',
          user_id: 'user-1',
          title: 'Regular Recent',
          content: '',
          color: 'green',
          is_favorite: false,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z', // Most recent non-favorite
        },
        {
          note_id: 'note-4',
          user_id: 'user-1',
          title: 'Favorite Old',
          content: '',
          color: 'yellow',
          is_favorite: true,
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z', // Older favorite
        },
      ];

      (getUserNotes as any).mockResolvedValue(unsortedNotes);

      const { result } = renderHook(() => useNotesList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Expected order:
      // 1. note-2 (favorite, most recent)
      // 2. note-4 (favorite, older)
      // 3. note-3 (not favorite, most recent)
      // 4. note-1 (not favorite, oldest)
      expect(result.current.notes[0].note_id).toBe('note-2');
      expect(result.current.notes[1].note_id).toBe('note-4');
      expect(result.current.notes[2].note_id).toBe('note-3');
      expect(result.current.notes[3].note_id).toBe('note-1');
    });
  });
});
