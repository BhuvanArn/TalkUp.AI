import { createNote } from '@/services/notes/http';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNoteCreation } from './useNoteCreation';

// Mock dependencies
vi.mock('@/services/notes/http', () => ({
  createNote: vi.fn(),
}));

describe('useNoteCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with isCreating false', () => {
    const { result } = renderHook(() => useNoteCreation());
    expect(result.current.isCreating).toBe(false);
  });

  it('creates a new note successfully', async () => {
    const mockNote = {
      note_id: 'new-note-1',
      user_id: 'user-1',
      title: 'My Note',
      content: 'Content',
      color: 'red',
      is_favorite: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    (createNote as any).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return mockNote;
    });

    const { result } = renderHook(() => useNoteCreation());

    let note: any;
    await act(async () => {
      note = await result.current.createNewNote('My Note', 'Content', 'red');
    });

    expect(createNote).toHaveBeenCalledWith({
      title: 'My Note',
      content: 'Content',
      color: 'red',
    });
    expect(note).toEqual(mockNote);
    expect(result.current.isCreating).toBe(false);
  });

  it('handles creation errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (createNote as any).mockRejectedValue(new Error('Creation failed'));

    const { result } = renderHook(() => useNoteCreation());

    await act(async () => {
      await expect(result.current.createNewNote()).rejects.toThrow(
        'Creation failed',
      );
    });

    expect(result.current.isCreating).toBe(false);
    consoleSpy.mockRestore();
  });

  it('prevents multiple simultaneous creations', async () => {
    (createNote as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    const { result } = renderHook(() => useNoteCreation());

    let promise1: Promise<any>;
    let promise2: Promise<any>;

    await act(async () => {
      // Start first creation
      promise1 = result.current.createNewNote();

      // Try second creation immediately
      promise2 = result.current.createNewNote();

      expect(await promise2).toBeNull();
      await promise1;
    });
  });
});
