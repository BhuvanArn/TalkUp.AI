import { changeLanguage } from '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NoteCard } from './index';

// Mock Button component to avoid issues with complex button logic/styles
vi.mock('@/components/atoms/button', () => ({
  Button: ({ onClick, children, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('NoteCard', () => {
  const defaultProps = {
    id: 'note-1',
    title: 'Test Note',
    preview: '<p>This is a test note</p>',
    color: 'blue' as const,
    lastUpdatedAt: new Date('2024-01-01T12:00:00Z'),
    isFavorite: false,
    onToggleFavorite: vi.fn(),
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('in French', () => {
    afterEach(async () => {
      await act(() => i18next.changeLanguage('en'));
      localStorage.clear();
    });

    it('renders the empty preview, favorite label and badge in French', async () => {
      await act(() => changeLanguage('fr'));
      render(<NoteCard {...defaultProps} preview="" />);

      expect(
        screen.getByText('Commencez à rédiger votre note…'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Ajouter aux favoris' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/^Mise à jour/)).toBeInTheDocument();
    });
  });

  it('renders title and preview content', () => {
    render(<NoteCard {...defaultProps} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('This is a test note')).toBeInTheDocument();
  });

  it('renders empty state when preview is empty', () => {
    render(<NoteCard {...defaultProps} preview="" />);
    expect(screen.getByText('Start writing your note...')).toBeInTheDocument();
  });

  it('sanitizes HTML content', () => {
    const maliciousContent = '<img src=x onerror=alert(1)>';
    render(<NoteCard {...defaultProps} preview={maliciousContent} />);
    const img = screen.queryByRole('img');
    expect(img).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    render(<NoteCard {...defaultProps} />);
    await user.click(screen.getByText('Test Note'));
    expect(defaultProps.onClick).toHaveBeenCalledWith('note-1');
  });

  it('calls onToggleFavorite when bookmark button is clicked', async () => {
    const user = userEvent.setup();
    render(<NoteCard {...defaultProps} />);
    const bookmarkBtn = screen.getByRole('button', {
      name: /add to favorites/i,
    });
    await user.click(bookmarkBtn);
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('note-1');
  });

  it('does not trigger card click when bookmark is clicked', () => {
    render(<NoteCard {...defaultProps} />);
    const bookmarkBtn = screen.getByRole('button', {
      name: /add to favorites/i,
    });
    fireEvent.click(bookmarkBtn);
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  it('shows filled bookmark icon when favorite', () => {
    render(<NoteCard {...defaultProps} isFavorite={true} />);
    const bookmarkBtn = screen.getByRole('button', {
      name: /remove from favorites/i,
    });
    expect(bookmarkBtn).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(<NoteCard {...defaultProps} />);
    const card = screen.getByText('Test Note').closest('div[tabindex="0"]');
    fireEvent.keyDown(card!, { key: 'Enter' });
    expect(defaultProps.onClick).toHaveBeenCalledWith('note-1');
  });
});
