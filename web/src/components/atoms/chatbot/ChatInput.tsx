import { BaseInput } from '@/components/atoms/base-input';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ChatInput
 *
 * A controlled single-line text input for the chatbot message bar.
 * Thin wrapper around the shared BaseInput atom so focus-ring, disabled and
 * accessibility behaviour stay consistent with the rest of the design system.
 * Triggers onSend when the user presses Enter (without Shift).
 *
 * @param props - ChatInputProps
 * @returns A styled text input as a React functional component.
 *
 * @example
 * <ChatInput
 *   value={message}
 *   onChange={setMessage}
 *   onSend={handleSend}
 *   placeholder="Ask a question..."
 * />
 */

interface ChatInputProps {
  /** Current value of the input */
  value: string;
  /** Callback fired on each keystroke */
  onChange: (value: string) => void;
  /** Callback fired when the user presses Enter */
  onSend: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
}

export const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSend, placeholder, disabled = false }, ref) => {
    const { t } = useTranslation('app');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };

    return (
      <BaseInput
        ref={ref}
        // `name` drives BaseInput's accessible name (aria-label).
        name={t('chat.input.label')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t('chat.input.placeholder')}
        disabled={disabled}
        className="flex-1 rounded-xl bg-background focus:bg-surface"
      />
    );
  },
);

ChatInput.displayName = 'ChatInput';
