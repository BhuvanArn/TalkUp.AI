/**
 * @property isOpen - Whether the modal is currently open (visible).
 * @property title - Primary title text displayed at the top of the modal.
 * @property message - Descriptive message or body content shown below the title.
 * @property confirmLabel - Optional label for the confirm/primary action button.
 * @property cancelLabel - Optional label for the cancel/secondary action button.
 * @property confirmColor - Optional color theme for the confirm button. Allowed values:
 *                          'primary' | 'accent' | 'error' | 'warning' | 'success'.
 * @property icon - Optional icon to display in the modal. Allowed values:
 *                  'warning' | 'error' | 'info' | 'trash'.
 * @property hideCancel - Optional. Renders a single confirm action, for a modal that only acknowledges.
 * @property onConfirm - Callback invoked when the user confirms the action (e.g., clicks the confirm button).
 * @property onCancel - Callback invoked when the user cancels or dismisses the modal.
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'accent' | 'error' | 'warning' | 'success';
  icon?: 'warning' | 'error' | 'info' | 'trash';
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
