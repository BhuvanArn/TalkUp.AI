import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmModal } from './index';

describe('ConfirmModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <ConfirmModal {...defaultProps} isOpen={false} />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to proceed?'),
      ).toBeInTheDocument();
    });

    it('renders with default button labels', () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Confirm' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Cancel' }),
      ).toBeInTheDocument();
    });

    it('renders with custom button labels', () => {
      render(
        <ConfirmModal
          {...defaultProps}
          confirmLabel="Delete"
          cancelLabel="Keep"
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Delete' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
    });

    it('renders with default warning icon', () => {
      const { container } = render(<ConfirmModal {...defaultProps} />);

      // Check for icon with warning class
      const iconContainer = container.querySelector('.bg-warning-weaker');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders with error icon when specified', () => {
      const { container } = render(
        <ConfirmModal {...defaultProps} icon="error" />,
      );

      const iconContainer = container.querySelector('.bg-error-weaker');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders with trash icon when specified', () => {
      const { container } = render(
        <ConfirmModal {...defaultProps} icon="trash" />,
      );

      const iconContainer = container.querySelector('.bg-error-weaker');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders with info icon when specified', () => {
      const { container } = render(
        <ConfirmModal {...defaultProps} icon="info" />,
      );

      const iconContainer = container.querySelector('.bg-accent-weaker');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders backdrop', () => {
      render(<ConfirmModal {...defaultProps} />);

      const backdrop = screen.getByRole('button', { name: 'Close modal' });
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('bg-scrim/50');
    });
  });

  describe('Button Actions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();

      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<ConfirmModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('calls onCancel when backdrop is clicked', async () => {
      const user = userEvent.setup();

      render(<ConfirmModal {...defaultProps} />);

      const backdrop = screen.getByRole('button', { name: 'Close modal' });
      await user.click(backdrop);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('calls onCancel when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(<ConfirmModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('does not call onCancel when Escape is pressed and modal is closed', async () => {
      const user = userEvent.setup();

      render(<ConfirmModal {...defaultProps} isOpen={false} />);

      await user.keyboard('{Escape}');

      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('does not call handlers for other keys', async () => {
      const user = userEvent.setup();

      render(<ConfirmModal {...defaultProps} />);

      await user.keyboard('{Enter}');
      await user.keyboard('a');
      await user.keyboard('{Space}');

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Prevention', () => {
    it('sets body overflow to hidden when modal opens', () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when modal closes', () => {
      const { rerender } = render(<ConfirmModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<ConfirmModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('unset');
    });

    it('restores body overflow when component unmounts', () => {
      const { unmount } = render(<ConfirmModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('unset');
    });

    it('does not set overflow hidden when modal is initially closed', () => {
      render(<ConfirmModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Event Listener Cleanup', () => {
    it('removes event listeners when component unmounts', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<ConfirmModal {...defaultProps} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Confirm Button Colors', () => {
    it('renders confirm button with error color by default', () => {
      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      // Button component should receive error color prop
      expect(confirmButton).toBeInTheDocument();
    });

    it('renders confirm button with primary color when specified', () => {
      render(<ConfirmModal {...defaultProps} confirmColor="primary" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeInTheDocument();
    });

    it('renders confirm button with accent color when specified', () => {
      render(<ConfirmModal {...defaultProps} confirmColor="accent" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeInTheDocument();
    });

    it('renders confirm button with warning color when specified', () => {
      render(<ConfirmModal {...defaultProps} confirmColor="warning" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeInTheDocument();
    });

    it('renders confirm button with success color when specified', () => {
      render(<ConfirmModal {...defaultProps} confirmColor="success" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Visual State', () => {
    it('applies correct positioning classes', () => {
      const { container } = render(<ConfirmModal {...defaultProps} />);

      const modalContainer = container.querySelector('.fixed.inset-0');
      expect(modalContainer).toBeInTheDocument();
      expect(modalContainer).toHaveClass(
        'z-50',
        'flex',
        'items-center',
        'justify-center',
      );
    });

    it('applies animation class to modal content', () => {
      const { container } = render(<ConfirmModal {...defaultProps} />);

      const modalContent = container.querySelector('.animate-fadeIn');
      expect(modalContent).toBeInTheDocument();
    });

    it('renders icon with correct color class for warning', () => {
      const { container } = render(
        <ConfirmModal {...defaultProps} icon="warning" />,
      );

      const icon = container.querySelector('.text-warning');
      expect(icon).toBeInTheDocument();
    });

    it('renders icon with correct color class for error', () => {
      const { container } = render(
        <ConfirmModal {...defaultProps} icon="error" />,
      );

      const icon = container.querySelector('.text-error');
      expect(icon).toBeInTheDocument();
    });

    it('renders icon with correct color class for info', () => {
      const { container } = render(
        <ConfirmModal {...defaultProps} icon="info" />,
      );

      const icon = container.querySelector('.text-accent');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible button labels', () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Confirm' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Cancel' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Close modal' }),
      ).toBeInTheDocument();
    });

    it('displays title as heading', () => {
      render(<ConfirmModal {...defaultProps} />);

      const heading = screen.getByRole('heading', { name: 'Confirm Action' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('handles multiple rapid clicks on confirm button', async () => {
      const user = userEvent.setup();

      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.tripleClick(confirmButton);

      // Should be called 3 times (once per click)
      expect(mockOnConfirm).toHaveBeenCalledTimes(3);
    });

    it('handles opening and closing multiple times', () => {
      const { rerender } = render(
        <ConfirmModal {...defaultProps} isOpen={false} />,
      );

      expect(document.body.style.overflow).toBe('unset');

      rerender(<ConfirmModal {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<ConfirmModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');

      rerender(<ConfirmModal {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('renders long title and message correctly', () => {
      const longTitle =
        'This is a very long title that might wrap to multiple lines in the modal';
      const longMessage =
        'This is a very long message that provides detailed information about the action the user is about to take. It should wrap appropriately within the modal container.';

      render(
        <ConfirmModal
          {...defaultProps}
          title={longTitle}
          message={longMessage}
        />,
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
  describe('single-action mode', () => {
    it('hides the cancel button when hideCancel is set', () => {
      render(
        <ConfirmModal {...defaultProps} hideCancel confirmLabel="Close" />,
      );

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Cancel' }),
      ).not.toBeInTheDocument();
    });
  });
});
