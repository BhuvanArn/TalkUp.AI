import { changeLanguage } from '@/i18n';
import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

import { SaveStatus } from './index';
import type { SaveStatusType } from './index';

describe('SaveStatus', () => {
  describe('Status: saving', () => {
    it('renders saving status with loader', () => {
      render(<SaveStatus status="saving" />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('displays loader with correct styles', () => {
      const { container } = render(<SaveStatus status="saving" />);

      const loader = container.querySelector('.loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveStyle({
        width: '12px',
        height: '12px',
        borderWidth: '2px',
      });
    });

    it('applies correct text color for saving status', () => {
      const { container } = render(<SaveStatus status="saving" />);

      const statusContainer = container.querySelector('.text-text-weaker');
      expect(statusContainer).toBeInTheDocument();
    });
  });

  describe('Status: saved', () => {
    it('renders saved status with check icon', () => {
      render(<SaveStatus status="saved" />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('applies success color for saved status', () => {
      const { container } = render(<SaveStatus status="saved" />);

      const statusContainer = container.querySelector('.text-success');
      expect(statusContainer).toBeInTheDocument();
    });

    it('renders check icon with correct size', () => {
      const { container } = render(<SaveStatus status="saved" />);

      const icon = container.querySelector('.w-4.h-4');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Status: unsaved', () => {
    it('renders unsaved status with warning icon', () => {
      render(<SaveStatus status="unsaved" />);

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('applies warning color for unsaved status', () => {
      const { container } = render(<SaveStatus status="unsaved" />);

      const statusContainer = container.querySelector('.text-warning');
      expect(statusContainer).toBeInTheDocument();
    });

    it('renders warning icon with correct size', () => {
      const { container } = render(<SaveStatus status="unsaved" />);

      const icon = container.querySelector('.w-4.h-4');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Status: error', () => {
    it('renders error status with error icon', () => {
      render(<SaveStatus status="error" />);

      expect(screen.getByText('Failed to save')).toBeInTheDocument();
    });

    it('applies error color for error status', () => {
      const { container } = render(<SaveStatus status="error" />);

      const statusContainer = container.querySelector('.text-error');
      expect(statusContainer).toBeInTheDocument();
    });

    it('renders error icon with correct size', () => {
      const { container } = render(<SaveStatus status="error" />);

      const icon = container.querySelector('.w-4.h-4');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies flex layout for all statuses', () => {
      const statuses: SaveStatusType[] = [
        'saved',
        'saving',
        'unsaved',
        'error',
      ];

      statuses.forEach((status) => {
        const { container } = render(<SaveStatus status={status} />);
        const statusContainer = container.querySelector(
          '.flex.items-center.gap-2',
        );
        expect(statusContainer).toBeInTheDocument();
      });
    });

    it('applies correct text size for all statuses', () => {
      const statuses: SaveStatusType[] = [
        'saved',
        'saving',
        'unsaved',
        'error',
      ];

      statuses.forEach((status) => {
        const { container } = render(<SaveStatus status={status} />);
        const statusContainer = container.querySelector('.text-body-sm');
        expect(statusContainer).toBeInTheDocument();
      });
    });
  });

  describe('Status Transitions', () => {
    it('updates from saving to saved', () => {
      const { rerender } = render(<SaveStatus status="saving" />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      rerender(<SaveStatus status="saved" />);

      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('updates from saved to unsaved', () => {
      const { rerender } = render(<SaveStatus status="saved" />);

      expect(screen.getByText('Saved')).toBeInTheDocument();

      rerender(<SaveStatus status="unsaved" />);

      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('updates from unsaved to saving', () => {
      const { rerender } = render(<SaveStatus status="unsaved" />);

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

      rerender(<SaveStatus status="saving" />);

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('updates from saving to error', () => {
      const { rerender } = render(<SaveStatus status="saving" />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      rerender(<SaveStatus status="error" />);

      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      expect(screen.getByText('Failed to save')).toBeInTheDocument();
    });

    it('updates from error to saved', () => {
      const { rerender } = render(<SaveStatus status="error" />);

      expect(screen.getByText('Failed to save')).toBeInTheDocument();

      rerender(<SaveStatus status="saved" />);

      expect(screen.queryByText('Failed to save')).not.toBeInTheDocument();
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('shows different visual indicators for each status', () => {
      const statuses: { status: SaveStatusType; text: string }[] = [
        { status: 'saved', text: 'Saved' },
        { status: 'saving', text: 'Saving...' },
        { status: 'unsaved', text: 'Unsaved changes' },
        { status: 'error', text: 'Failed to save' },
      ];

      statuses.forEach(({ status, text }) => {
        const { unmount } = render(<SaveStatus status={status} />);
        expect(screen.getByText(text)).toBeInTheDocument();
        unmount();
      });
    });

    it('displays loader only for saving status', () => {
      const { container: savingContainer } = render(
        <SaveStatus status="saving" />,
      );
      expect(savingContainer.querySelector('.loader')).toBeInTheDocument();

      const { container: savedContainer } = render(
        <SaveStatus status="saved" />,
      );
      expect(savedContainer.querySelector('.loader')).not.toBeInTheDocument();

      const { container: unsavedContainer } = render(
        <SaveStatus status="unsaved" />,
      );
      expect(unsavedContainer.querySelector('.loader')).not.toBeInTheDocument();

      const { container: errorContainer } = render(
        <SaveStatus status="error" />,
      );
      expect(errorContainer.querySelector('.loader')).not.toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('renders without errors for all valid statuses', () => {
      const statuses: SaveStatusType[] = [
        'saved',
        'saving',
        'unsaved',
        'error',
      ];

      statuses.forEach((status) => {
        expect(() => render(<SaveStatus status={status} />)).not.toThrow();
      });
    });

    it('unmounts cleanly', () => {
      const { unmount } = render(<SaveStatus status="saving" />);
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid status changes', () => {
      const { rerender } = render(<SaveStatus status="saved" />);

      rerender(<SaveStatus status="unsaved" />);
      rerender(<SaveStatus status="saving" />);
      rerender(<SaveStatus status="saved" />);
      rerender(<SaveStatus status="error" />);
      rerender(<SaveStatus status="saving" />);
      rerender(<SaveStatus status="saved" />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('displays correct text for saved status', () => {
      render(<SaveStatus status="saved" />);
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('displays correct text for saving status', () => {
      render(<SaveStatus status="saving" />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('displays correct text for unsaved status', () => {
      render(<SaveStatus status="unsaved" />);
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('displays correct text for error status', () => {
      render(<SaveStatus status="error" />);
      expect(screen.getByText('Failed to save')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('uses success color for saved status', () => {
      const { container } = render(<SaveStatus status="saved" />);
      const element = container.querySelector('.text-success');
      expect(element).toBeInTheDocument();
    });

    it('uses weaker text color for saving status', () => {
      const { container } = render(<SaveStatus status="saving" />);
      const element = container.querySelector('.text-text-weaker');
      expect(element).toBeInTheDocument();
    });

    it('uses warning color for unsaved status', () => {
      const { container } = render(<SaveStatus status="unsaved" />);
      const element = container.querySelector('.text-warning');
      expect(element).toBeInTheDocument();
    });

    it('uses error color for error status', () => {
      const { container } = render(<SaveStatus status="error" />);
      const element = container.querySelector('.text-error');
      expect(element).toBeInTheDocument();
    });
  });
});

describe('SaveStatus in French', () => {
  afterEach(async () => {
    await act(() => i18next.changeLanguage('en'));
    localStorage.clear();
  });

  it('renders the French labels', async () => {
    await act(() => changeLanguage('fr'));
    const { rerender } = render(<SaveStatus status="unsaved" />);

    expect(
      screen.getByText('Modifications non enregistrées'),
    ).toBeInTheDocument();

    rerender(<SaveStatus status="error" />);
    expect(screen.getByText('Échec de l’enregistrement')).toBeInTheDocument();
  });
});
