import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { useEffect } from 'react';

import { ConfirmModalProps } from './types';

/**
 * ConfirmModal component
 *
 * A centered confirmation dialog with an icon, title, message and two actions: confirm and cancel.
 *
 * Renders a backdrop and a modal panel. When closed (isOpen === false) the component returns null.
 *
 * @remarks
 * - Keyboard: Pressing the Escape key when the modal is open will call `onCancel()` and prevents default/propagation.
 * - Backdrop: Clicking the backdrop will call `onCancel()`.
 * - Scrolling: While the modal is open the document body overflow is set to "hidden"; on close (or unmount) it is restored.
 * - Effects: Event listeners and body style changes are cleaned up on unmount.
 *
 * @param props : ConfirmModalProps - Props for the confirmation modal component.
 *
 * @returns A JSX element representing the modal when open, otherwise `null`.
 *
 * @example
 * <ConfirmModal
 *   isOpen={isOpen}
 *   title="Delete item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmLabel="Delete"
 *   cancelLabel="Keep"
 *   confirmColor="error"
 *   icon="trash"
 *   onConfirm={() => handleDelete(id)}
 *   onCancel={() => setIsOpen(false)}
 * />
 */
export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
  icon = 'warning',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIconColor = () => {
    switch (icon) {
      case 'error':
      case 'trash':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      case 'info':
        return 'text-accent';
      default:
        return 'text-text-idle';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-scrim/50 transition-opacity"
        onClick={onCancel}
        aria-label="Close modal"
      />

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-fadeIn">
        <div className="flex flex-col items-center p-6 pb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              icon === 'error' || icon === 'trash'
                ? 'bg-error-weaker'
                : icon === 'warning'
                  ? 'bg-warning-weaker'
                  : 'bg-accent-weaker'
            }`}
          >
            <Icon icon={icon} className={`w-6 h-6 ${getIconColor()}`} />
          </div>
          <h2 className="text-h2 text-text-idle font-semibold text-center">
            {title}
          </h2>
        </div>

        <div className="px-6 pb-6">
          <p className="text-body-md text-text-weaker text-center mb-6">
            {message}
          </p>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outlined"
              color="neutral"
              onClick={onCancel}
              className="flex-1"
            >
              {cancelLabel}
            </Button>
            <Button
              variant="contained"
              color={confirmColor}
              onClick={onConfirm}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
