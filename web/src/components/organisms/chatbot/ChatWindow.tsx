import { ChatAvatar } from '@/components/atoms/chatbot/ChatAvatar';
import { ChatInputBar } from '@/components/molecules/chatbot/ChatInputBar';
import { ChatMessage } from '@/components/molecules/chatbot/ChatMessage';
import { useEffect, useRef } from 'react';

/**
 * ChatWindow
 *
 * The main conversation panel of the TalkUp chatbot widget.
 * Renders the header with AI status, the scrollable message list,
 * the input bar, and a branded footer.
 *
 * Auto-scrolls to the latest message whenever messages change.
 *
 * @param props - ChatWindowProps
 * @returns The full chat panel as a React functional component.
 *
 * @example
 * <ChatWindow
 *   messages={messages}
 *   inputValue={input}
 *   onInputChange={setInput}
 *   onSend={handleSend}
 *   isTyping={isTyping}
 * />
 */

export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Text content */
  text: string;
  /** 'ai' for assistant messages, 'user' for user messages */
  variant: 'ai' | 'user';
  /** Formatted time string */
  timestamp: string;
}

interface ChatWindowProps {
  /** List of messages to display */
  messages: Message[];
  /** Current value of the input */
  inputValue: string;
  /** Callback fired on input change */
  onInputChange: (value: string) => void;
  /** Callback fired when the user sends a message */
  onSend: () => void;
  /** When true, shows a typing indicator at the bottom of the list */
  isTyping?: boolean;
  /** Ref forwarded to the text input so the widget can focus it on open */
  inputRef?: React.Ref<HTMLInputElement>;
}

export const ChatWindow = ({
  messages,
  inputValue,
  onInputChange,
  onSend,
  isTyping = false,
  inputRef,
}: ChatWindowProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      role="complementary"
      aria-label="TalkUp AI chat"
      className="flex flex-col w-[340px] bg-background rounded-[20px] border border-border shadow-2xl overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-brand-gradient">
        <ChatAvatar variant="ai" size="lg" />
        <div className="flex-1">
          <p className="text-white text-body-m font-bold leading-tight">
            TalkUp AI
          </p>
          <p className="text-white/80 text-body-s flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
            Online, ready to help
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        className="flex flex-col gap-3 p-4 overflow-y-auto bg-surface"
        style={{ minHeight: '280px', maxHeight: '280px' }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            variant={msg.variant}
            message={msg.text}
            timestamp={msg.timestamp}
          />
        ))}

        {isTyping && <ChatMessage variant="ai" isTyping />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <ChatInputBar
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        isLoading={isTyping}
        inputRef={inputRef}
      />

      {/* ── Footer ── */}
      <div className="py-1.5 text-center text-body-s text-text-weaker bg-surface">
        Powered by TalkUp AI
      </div>
    </div>
  );
};
