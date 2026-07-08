import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInterviewNotes } from './useInterviewNotes';

const getUserNotesMock = vi.hoisted(() => vi.fn());
const createNoteMock = vi.hoisted(() => vi.fn());
const updateNoteMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/notes/http', () => ({
  getUserNotes: getUserNotesMock,
  createNote: createNoteMock,
  updateNote: updateNoteMock,
}));

const noteFor = (content: string) => ({
  note_id: 'n1',
  user_id: 'u1',
  interview_id: 'int-1',
  title: 'Simulation notes',
  content,
  color: 'blue',
  is_favorite: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
});

describe('useInterviewNotes', () => {
  beforeEach(() => {
    getUserNotesMock.mockReset().mockResolvedValue([]);
    createNoteMock.mockReset().mockResolvedValue(noteFor('<p></p>'));
    updateNoteMock.mockReset().mockResolvedValue(noteFor('<p></p>'));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is inert when interviewID is null', () => {
    const { result } = renderHook(() => useInterviewNotes(null));
    expect(getUserNotesMock).not.toHaveBeenCalled();
    expect(result.current.content).toBe('');
  });

  it('loads the existing note for the interview on mount', async () => {
    getUserNotesMock.mockResolvedValue([noteFor('<p>hello</p>')]);
    const { result } = renderHook(() => useInterviewNotes('int-1'));
    await vi.waitFor(() =>
      expect(getUserNotesMock).toHaveBeenCalledWith({ interviewId: 'int-1' }),
    );
    await vi.waitFor(() => expect(result.current.content).toBe('hello'));
  });

  it('creates a note with interviewId and fixed title on first save', async () => {
    const { result } = renderHook(() => useInterviewNotes('int-1'));
    await vi.waitFor(() => expect(getUserNotesMock).toHaveBeenCalled());
    act(() => result.current.setContent('typed'));
    await act(async () => {
      await result.current.saveNow();
    });
    expect(createNoteMock).toHaveBeenCalledWith({
      title: 'Simulation notes',
      content: '<p>typed</p>',
      interviewId: 'int-1',
    });
  });

  it('updates the same note on the second save', async () => {
    createNoteMock.mockResolvedValue(noteFor('<p>typed</p>'));
    const { result } = renderHook(() => useInterviewNotes('int-1'));
    await vi.waitFor(() => expect(getUserNotesMock).toHaveBeenCalled());
    act(() => result.current.setContent('typed'));
    await act(async () => {
      await result.current.saveNow();
    });
    act(() => result.current.setContent('typed more'));
    await act(async () => {
      await result.current.saveNow();
    });
    expect(updateNoteMock).toHaveBeenCalledWith('n1', {
      content: '<p>typed more</p>',
    });
  });

  it('does not save when content is unchanged (dirty gating)', async () => {
    const { result } = renderHook(() => useInterviewNotes('int-1'));
    await vi.waitFor(() => expect(getUserNotesMock).toHaveBeenCalled());
    await act(async () => {
      await result.current.saveNow();
    });
    expect(createNoteMock).not.toHaveBeenCalled();
    expect(updateNoteMock).not.toHaveBeenCalled();
  });

  it('in-flight lock: two saves before create resolves call createNote once', async () => {
    let resolveCreate: (v: unknown) => void = () => {};
    createNoteMock.mockImplementation(
      () =>
        new Promise((res) => {
          resolveCreate = res;
        }),
    );
    const { result } = renderHook(() => useInterviewNotes('int-1'));
    await vi.waitFor(() => expect(getUserNotesMock).toHaveBeenCalled());
    act(() => result.current.setContent('typed'));
    // fire two saves without awaiting the first
    let firstSave: Promise<void>;
    act(() => {
      firstSave = result.current.saveNow();
      void result.current.saveNow();
    });
    resolveCreate(noteFor('<p>typed</p>'));
    await act(async () => {
      await firstSave;
    });
    expect(createNoteMock).toHaveBeenCalledTimes(1);
  });

  it('stops autosaving after 3 consecutive failures until saveNow', async () => {
    createNoteMock.mockRejectedValue(new Error('down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useInterviewNotes('int-1'));
    await vi.waitFor(() => expect(getUserNotesMock).toHaveBeenCalled());
    act(() => result.current.setContent('typed'));
    // three autosave ticks, each fails
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }
    expect(createNoteMock).toHaveBeenCalledTimes(3);
    expect(result.current.saveStatus).toBe('error');

    // saveNow resets the failure counter and forces a retry past the cap,
    // even though the timer would otherwise stay halted.
    await act(async () => {
      await result.current.saveNow();
    });
    expect(createNoteMock).toHaveBeenCalledTimes(4);

    consoleSpy.mockRestore();
  });

  it('flushes unsaved edits for the outgoing interview when interviewID changes (no data loss)', async () => {
    const { result, rerender } = renderHook(
      ({ interviewID }) => useInterviewNotes(interviewID),
      { initialProps: { interviewID: 'int-1' as string | null } },
    );
    await vi.waitFor(() => expect(getUserNotesMock).toHaveBeenCalled());

    act(() => result.current.setContent('unsaved edit'));
    expect(createNoteMock).not.toHaveBeenCalled();

    // Simulation stops: interviewID goes to null without unmounting the
    // panel. The pending edit for 'int-1' must be flushed, not dropped.
    await act(async () => {
      rerender({ interviewID: null });
    });

    expect(createNoteMock).toHaveBeenCalledWith({
      title: 'Simulation notes',
      content: '<p>unsaved edit</p>',
      interviewId: 'int-1',
    });
  });
});
