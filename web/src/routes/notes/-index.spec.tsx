import { useNoteCreation } from '@/hooks/notes/useNoteCreation';
import { useNoteFavorite } from '@/hooks/notes/useNoteFavorite';
import { useNoteNavigation } from '@/hooks/notes/useNoteNavigation';
import { useNotesList } from '@/hooks/notes/useNotesList';
import { useApplications } from '@/services/applications/hooks';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Notes } from './index';

// The page reads an optional ?applicationId scope and renders TanStack Links;
// stub the router surface so the component can render outside a RouterProvider.
let mockSearch: { applicationId?: string } = {};
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({ useSearch: () => mockSearch }),
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

// Mock hooks
vi.mock('@/hooks/notes/useNotesList');
vi.mock('@/hooks/notes/useNoteFavorite');
vi.mock('@/hooks/notes/useNoteNavigation');
vi.mock('@/hooks/notes/useNoteCreation');
vi.mock('@/services/applications/hooks');

describe('Notes Route', () => {
  const mockNotes = [
    {
      note_id: '1',
      title: 'Note 1',
      content: 'Content 1',
      color: 'blue',
      is_favorite: false,
      updated_at: new Date().toISOString(),
    },
    {
      note_id: '2',
      title: 'Note 2',
      content: 'Content 2',
      color: 'green',
      is_favorite: true,
      updated_at: new Date().toISOString(),
    },
  ];

  const mockAddNote = vi.fn();
  const mockNavigateToNote = vi.fn();
  const mockCreateNewNote = vi.fn();
  const mockToggleFavorite = vi.fn();
  const mockUpdateNoteInList = vi.fn();
  const mockRevertNoteInList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch = {};

    (useApplications as any).mockReturnValue({ data: [] });

    (useNotesList as any).mockReturnValue({
      notes: mockNotes,
      isLoading: false,
      error: null,
      setError: vi.fn(),
      addNote: mockAddNote,
      updateNoteInList: mockUpdateNoteInList,
      revertNoteInList: mockRevertNoteInList,
    });

    (useNoteFavorite as any).mockReturnValue({
      toggleFavorite: mockToggleFavorite,
    });

    (useNoteNavigation as any).mockReturnValue({
      navigateToNote: mockNavigateToNote,
    });

    (useNoteCreation as any).mockReturnValue({
      createNewNote: mockCreateNewNote,
    });
  });

  it('renders list of notes', () => {
    render(<Notes />);
    expect(screen.getByText('Note 1')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    (useNotesList as any).mockReturnValue({
      notes: [],
      isLoading: true,
      error: null,
    });
    render(<Notes />);
    expect(screen.getByText('Loading notes...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useNotesList as any).mockReturnValue({
      notes: [],
      isLoading: false,
      error: 'Failed to load',
    });
    render(<Notes />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    (useNotesList as any).mockReturnValue({
      notes: [],
      isLoading: false,
      error: null,
      addNote: mockAddNote,
    });
    render(<Notes />);
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create your first note/i }),
    ).toBeInTheDocument();
  });

  it('handles creating new note', async () => {
    const user = userEvent.setup();
    const newNote = { note_id: '3', title: 'New Note' };
    mockCreateNewNote.mockResolvedValue(newNote);

    render(<Notes />);
    const addBtn = screen.getByTitle('Add new note');
    await user.click(addBtn);

    expect(mockCreateNewNote).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockAddNote).toHaveBeenCalledWith(newNote);
      expect(mockNavigateToNote).toHaveBeenCalledWith('3');
    });
  });

  it('handles clicking a note', async () => {
    const user = userEvent.setup();
    render(<Notes />);
    await user.click(screen.getByText('Note 1'));
    expect(mockNavigateToNote).toHaveBeenCalledWith('1');
  });

  it('handles toggling favorite', async () => {
    const user = userEvent.setup();
    render(<Notes />);

    // Find the favorite button for the first note (not favorite)
    const favoriteBtns = screen.getAllByRole('button', {
      name: /add to favorites/i,
    });
    await user.click(favoriteBtns[0]);

    expect(mockUpdateNoteInList).toHaveBeenCalledWith('1', {
      is_favorite: true,
    });
    expect(mockToggleFavorite).toHaveBeenCalled();
  });

  describe('note kinds', () => {
    const typedNotes = [
      { ...mockNotes[0], note_id: 'g', title: 'General note' },
      {
        note_id: 'a',
        title: 'App note',
        content: '',
        color: 'blue',
        is_favorite: false,
        application_id: 'app-1',
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        note_id: 's',
        title: 'Sim note',
        content: '',
        color: 'green',
        is_favorite: false,
        interview_id: 'int-1',
        application_id: 'app-1',
        updated_at: new Date().toISOString(),
        created_at: '2026-07-01T00:00:00.000Z',
      },
    ];

    beforeEach(() => {
      (useNotesList as any).mockReturnValue({
        notes: typedNotes,
        isLoading: false,
        error: null,
        setError: vi.fn(),
        addNote: mockAddNote,
        updateNoteInList: mockUpdateNoteInList,
        revertNoteInList: mockRevertNoteInList,
      });
      (useApplications as any).mockReturnValue({
        data: [
          { applicationId: 'app-1', companyName: 'Datadog', jobTitle: 'SRE' },
        ],
      });
    });

    it('labels a simulation note with its provenance and application', () => {
      render(<Notes />);
      expect(screen.getByText(/taken during simulation/i)).toBeInTheDocument();
      // App label + a simulation date from created_at. The exact date format is
      // locale-dependent (CI vs local), so match the app label + year, not a
      // pinned format string.
      expect(
        screen.getByText(
          (text) => /SRE at Datadog/.test(text) && /2026/.test(text),
        ),
      ).toBeInTheDocument();
    });

    it('filters to a single kind via the chips', async () => {
      const user = userEvent.setup();
      render(<Notes />);
      // All three visible under "All".
      expect(screen.getByText('General note')).toBeInTheDocument();
      expect(screen.getByText('App note')).toBeInTheDocument();
      expect(screen.getByText('Sim note')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Simulation' }));
      expect(screen.getByText('Sim note')).toBeInTheDocument();
      expect(screen.queryByText('General note')).not.toBeInTheDocument();
      expect(screen.queryByText('App note')).not.toBeInTheDocument();
    });

    it('narrows to application-only notes via the Application chip', async () => {
      const user = userEvent.setup();
      render(<Notes />);

      await user.click(screen.getByRole('button', { name: 'Application' }));
      expect(screen.getByText('App note')).toBeInTheDocument();
      // The sim note carries application_id too, but its interview_id makes it a
      // simulation kind — it must not leak into the Application filter.
      expect(screen.queryByText('Sim note')).not.toBeInTheDocument();
      expect(screen.queryByText('General note')).not.toBeInTheDocument();
    });

    it('shows the empty state when a General chip matches nothing', async () => {
      const user = userEvent.setup();
      (useNotesList as any).mockReturnValue({
        notes: typedNotes.filter((n) => n.note_id !== 'g'),
        isLoading: false,
        error: null,
        setError: vi.fn(),
        addNote: mockAddNote,
        updateNoteInList: mockUpdateNoteInList,
        revertNoteInList: mockRevertNoteInList,
      });
      render(<Notes />);

      await user.click(screen.getByRole('button', { name: 'General' }));
      expect(screen.getByText(/no notes of this kind/i)).toBeInTheDocument();
    });
  });

  describe('application scope', () => {
    beforeEach(() => {
      mockSearch = { applicationId: 'app-1' };
      (useApplications as any).mockReturnValue({
        data: [
          { applicationId: 'app-1', companyName: 'Datadog', jobTitle: 'SRE' },
        ],
      });
    });

    it('shows the scope banner and a link back to all notes', () => {
      render(<Notes />);
      expect(screen.getByText(/showing notes for/i)).toBeInTheDocument();
      expect(screen.getByText('SRE at Datadog')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /back to all notes/i }),
      ).toHaveAttribute('href', '/notes');
    });

    it('creates a note scoped to the application in scope', async () => {
      const user = userEvent.setup();
      mockCreateNewNote.mockResolvedValue({ note_id: 'x' });
      render(<Notes />);
      await user.click(screen.getByTitle('Add new note'));
      expect(mockCreateNewNote).toHaveBeenCalledWith('app-1');
    });

    it('hides the General chip in application scope (it can never match)', () => {
      render(<Notes />);
      // A scoped fetch only returns this application's application- and
      // simulation-notes, so a General chip would always yield the empty state.
      expect(
        screen.queryByRole('button', { name: 'General' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Application' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Simulation' }),
      ).toBeInTheDocument();
    });
  });
});
