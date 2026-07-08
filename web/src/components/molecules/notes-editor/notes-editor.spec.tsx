import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useInterviewNotesMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/notes/useInterviewNotes', () => ({
  useInterviewNotes: useInterviewNotesMock,
}));

import NotesEditor from './notes-editor';

describe('NotesEditor', () => {
  const setContent = vi.fn();
  const saveNow = vi.fn();

  beforeEach(() => {
    setContent.mockReset();
    saveNow.mockReset();
    useInterviewNotesMock.mockReset().mockReturnValue({
      content: 'loaded text',
      setContent,
      saveStatus: 'saved',
      saveNow,
    });
  });

  const openPanel = () => {
    // FAB opens the panel
    fireEvent.click(screen.getByRole('button'));
  };

  it('passes interviewID to the hook', () => {
    render(<NotesEditor interviewID="int-1" />);
    expect(useInterviewNotesMock).toHaveBeenCalledWith('int-1');
  });

  it('passes null to the hook when interviewID is undefined', () => {
    render(<NotesEditor />);
    expect(useInterviewNotesMock).toHaveBeenCalledWith(null);
  });

  it('renders hook content in the textarea and calls setContent on typing', () => {
    render(<NotesEditor interviewID="int-1" />);
    openPanel();
    const textarea = screen.getByPlaceholderText('Type here...');
    expect(textarea).toHaveValue('loaded text');
    fireEvent.change(textarea, { target: { value: 'new text' } });
    expect(setContent).toHaveBeenCalledWith('new text');
  });

  it('calls saveNow when Save is clicked', () => {
    render(<NotesEditor interviewID="int-1" />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(saveNow).toHaveBeenCalled();
  });
});
