import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { ChatWindow, Message } from '@/components/organisms/chatbot/ChatWindow';
import { useChatContext } from '@/hooks/ui/useChatContext';
import { useDragFAB } from '@/hooks/ui/useDragFAB';
import { sendChatMessage } from '@/services/ai/http';
import { ChatHistoryItem } from '@/services/ai/types';
import { useCallback, useEffect, useRef, useState } from 'react';

const WELCOME_TEXT =
  "Hello! I'm TalkUp AI. Ask me anything to prepare for your interview 🎯";

const ERROR_TEXT =
  'Sorry, I could not reach the assistant right now. Please try again.';

// How many prior turns to send as context. Keeps the request small and bounded
// (the server also caps history), while giving the model enough to stay coherent.
const HISTORY_LIMIT = 10;

const getTimestamp = () =>
  new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  // The page the widget is on right now — sent as grounding context so the
  // assistant can answer about what the user is looking at.
  const chatContext = useChatContext();
  // Computed on mount so the welcome timestamp reflects when the chat is first
  // rendered, not when the module was loaded.
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      text: WELCOME_TEXT,
      variant: 'ai',
      timestamp: getTimestamp(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Monotonic counter for message ids — avoids duplicate React keys when a user
  // message and its AI reply land in the same millisecond.
  const msgId = useRef(0);
  // Guards against setting state after unmount when a reply resolves late.
  const mounted = useRef(true);

  const { position, onMouseDown, onTouchStart, isDragging } = useDragFAB();

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user-${(msgId.current += 1)}`,
      text,
      variant: 'user',
      timestamp: getTimestamp(),
    };

    // Snapshot the prior turns before appending the new user message so we send
    // history that excludes the current question, matching the API contract.
    const history: ChatHistoryItem[] = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-HISTORY_LIMIT)
      .map((m) => ({
        role: m.variant === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    let replyText = ERROR_TEXT;
    try {
      const { reply } = await sendChatMessage({
        message: text,
        history,
        ...(chatContext ? { context: chatContext } : {}),
      });
      replyText = reply;
    } catch {
      // Fall back to the error message; the details are logged in the service.
    }

    if (!mounted.current) return;

    const aiMsg: Message = {
      id: `ai-${(msgId.current += 1)}`,
      text: replyText,
      variant: 'ai',
      timestamp: getTimestamp(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  }, [inputValue, isTyping, messages, chatContext]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleFabClick = () => {
    if (isDragging.current) return;
    setIsOpen((prev) => !prev);
  };

  const closeChat = useCallback(() => {
    setIsOpen(false);
    fabRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeChat();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, closeChat]);

  // Move focus into the panel when it opens so keyboard and screen-reader users
  // land inside the dialog rather than tabbing through the page behind it.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: `${24 - position.y}px`,
        right: `${24 - position.x}px`,
      }}
    >
      {isOpen && (
        <div className="absolute bottom-16 right-0 transition-all duration-200 origin-bottom-right">
          <ChatWindow
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            isTyping={isTyping}
            inputRef={inputRef}
          />
        </div>
      )}

      {/* ── FAB ── */}
      <Button
        circled
        type="button"
        ref={fabRef}
        onClick={handleFabClick}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        aria-label={isOpen ? 'Close chat' : 'Open TalkUp chat'}
        aria-expanded={isOpen}
        className="w-14 h-14 bg-brand-gradient shadow-lg cursor-grab active:cursor-grabbing select-none hover:scale-105"
      >
        <Icon
          icon={isOpen ? 'times' : 'chat'}
          size="md"
          color="white"
          className="transition-all duration-300"
        />
      </Button>
    </div>
  );
};
