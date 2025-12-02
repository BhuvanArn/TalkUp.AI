import { updateNote } from '@/services/notes/http';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNoteAutoSave } from './useNoteAutoSave';

// Mock dependencies
vi.mock('@/services/notes/http', () => ({
  updateNote: vi.fn(),
}));

describe('useNoteAutoSave', () => {
  const mockNote = {
    note_id: 'note-1',
    user_id: 'user-1',
    title: 'Test Note',
    content: '<p>Initial content</p>',
    color: 'blue' as const,
    is_favorite: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockEditor = {
    commands: {
      setContent: vi.fn(),
    },
    getHTML: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with saved status', () => {
    const { result } = renderHook(() =>
      useNoteAutoSave('note-1', mockNote, mockEditor as any, 'Test Note'),
    );

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.hasUnsavedChanges.current).toBe(false);
  });

  it('sets editor content on initialization', () => {
    renderHook(() =>
      useNoteAutoSave('note-1', mockNote, mockEditor as any, 'Test Note'),
    );

    expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
      mockNote.content,
    );
  });

  it('updates status when editor content changes', () => {
    const { result } = renderHook(() =>
      useNoteAutoSave('note-1', mockNote, mockEditor as any, 'Test Note'),
    );

    // Simulate editor update
    mockEditor.getHTML.mockReturnValue('<p>New content</p>');
    const updateHandler = mockEditor.on.mock.calls[0][1];
    act(() => {
      updateHandler();
    });

    expect(result.current.saveStatus).toBe('unsaved');
    expect(result.current.hasUnsavedChanges.current).toBe(true);
  });

  it('auto-saves after interval', async () => {
    mockEditor.getHTML.mockReturnValue('<p>New content</p>');

    renderHook(() =>
      useNoteAutoSave('note-1', mockNote, mockEditor as any, 'Test Note'),
    );

    // Trigger update
    const updateHandler = mockEditor.on.mock.calls[0][1];
    act(() => {
      updateHandler();
    });

    // Fast-forward time by 1 second to trigger the interval
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(updateNote).toHaveBeenCalledWith('note-1', {
      title: 'Test Note',
      content: '<p>New content</p>',
    });
  });

  it('handles save errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (updateNote as any).mockRejectedValue(new Error('Save failed'));
    mockEditor.getHTML.mockReturnValue('<p>New content</p>');

    const { result, unmount } = renderHook(() =>
      useNoteAutoSave('note-1', mockNote, mockEditor as any, 'Test Note'),
    );

    // Trigger update
    const updateHandler = mockEditor.on.mock.calls[0][1];
    act(() => {
      updateHandler();
    });

    // Fast-forward time by 1 second to trigger the interval
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('error');

    // Reset mock to avoid errors on unmount
    (updateNote as any).mockResolvedValue(undefined);

    // Clean unmount
    unmount();
    consoleSpy.mockRestore();
  });

  it('saves immediately when saveNow is called', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (updateNote as any).mockResolvedValue(undefined);
    mockEditor.getHTML.mockReturnValue('<p>Immediate content</p>');

    const { result, unmount } = renderHook(() =>
      useNoteAutoSave('note-1', mockNote, mockEditor as any, 'Test Note'),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(updateNote).toHaveBeenCalledWith('note-1', {
      title: 'Test Note',
      content: '<p>Immediate content</p>',
    });
    expect(result.current.saveStatus).toBe('saved');

    // Clean unmount to avoid error logs
    unmount();
    consoleSpy.mockRestore();
  });
});
