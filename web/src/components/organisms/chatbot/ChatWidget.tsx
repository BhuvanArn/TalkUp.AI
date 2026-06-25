import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { ChatWindow, Message } from '@/components/organisms/chatbot/ChatWindow';
import { useDragFAB } from '@/hooks/ui/useDragFAB';
import { useCallback, useEffect, useRef, useState } from 'react';

const WELCOME_TEXT =
  "Hello! I'm TalkUp AI. Ask me anything to prepare for your interview 🎯";

const AI_REPLIES = [
  'For a Product Manager interview, focus on prioritization frameworks like RICE or MoSCoW.',
  'Practice the STAR method: Situation, Task, Action, Result. It structures your answers clearly.',
  'Research the company',
];

const getTimestamp = () =>
  new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const replyIndex = useRef(0);
  // Monotonic counter for message ids — avoids duplicate React keys when a user
  // message and its AI reply land in the same millisecond.
  const msgId = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const { position, onMouseDown, onTouchStart, isDragging } = useDragFAB();

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user-${(msgId.current += 1)}`,
      text,
      variant: 'user',
      timestamp: getTimestamp(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    timeoutRef.current = setTimeout(() => {
      const aiMsg: Message = {
        id: `ai-${(msgId.current += 1)}`,
        text: AI_REPLIES[replyIndex.current % AI_REPLIES.length],
        variant: 'ai',
        timestamp: getTimestamp(),
      };
      replyIndex.current += 1;
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  }, [inputValue, isTyping]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
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
