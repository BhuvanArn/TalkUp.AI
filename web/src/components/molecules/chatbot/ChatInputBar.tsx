import { Button } from '@/components/atoms/button';
import { ChatInput } from '@/components/atoms/chatbot/ChatInput';
import { Icon } from '@/components/atoms/icon';
import { useTranslation } from 'react-i18next';

/**
 * ChatInputBar
 *
 * Combines ChatInput + a send button into a single input bar.
 * The send button is disabled when the input is empty or when isLoading is true.
 * Triggers onSend both via the button click and via the ChatInput Enter key handler.
 *
 * @param props - ChatInputBarProps
 * @returns A full input bar row as a React functional component.
 *
 * @example
 * <ChatInputBar
 *   value={message}
 *   onChange={setMessage}
 *   onSend={handleSend}
 *   isLoading={isTyping}
 * />
 */

interface ChatInputBarProps {
  /** Current value of the text input */
  value: string;
  /** Callback fired on each keystroke */
  onChange: (value: string) => void;
  /** Callback fired when the user sends a message */
  onSend: () => void;
  /** When true, disables input and send button while AI is responding */
  isLoading?: boolean;
  /** Ref forwarded to the underlying text input */
  inputRef?: React.Ref<HTMLInputElement>;
}

export const ChatInputBar = ({
  value,
  onChange,
  onSend,
  isLoading = false,
  inputRef,
}: ChatInputBarProps) => {
  const { t } = useTranslation('app');
  const canSend = value.trim().length > 0 && !isLoading;

  // Keep the input enabled while the AI responds so keyboard focus and tab
  // order are not lost for the ~1.2s typing window; just suppress sending.
  const handleSend = () => {
    if (canSend) onSend();
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-surface border-t border-border">
      <ChatInput
        ref={inputRef}
        value={value}
        onChange={onChange}
        onSend={handleSend}
      />

      <Button
        circled
        type="button"
        size="sm"
        onClick={handleSend}
        disabled={!canSend}
        aria-label={t('chat.input.send')}
        // Only paint the brand gradient (and its label colour) when enabled.
        // The Button atom's disabled variant sets `bg-disabled` (a
        // background-color) and `text-text-disabled`; a gradient is a
        // background-image and would paint over the fill, and a label colour
        // passed here would win over the disabled one, making a disabled
        // button look active.
        className={`w-9 h-9 flex-shrink-0 ${
          canSend
            ? 'bg-brand-gradient text-on-accent hover:opacity-90 hover:scale-105'
            : ''
        }`}
      >
        <Icon icon="send" size="sm" color="inherit" />
      </Button>
    </div>
  );
};
