import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { ChatWindow, Message } from '@/components/organisms/chatbot/ChatWindow';
import { useDragFAB } from '@/hooks/ui/useDragFAB';
import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    text: "Hello! I'm TalkUp AI. Ask me anything to prepare for your interview 🎯",
    variant: 'ai',
    timestamp: new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  },
];

const AI_REPLIES = [
  'For a Product Manager interview, focus on prioritization frameworks like RICE or MoSCoW.',
  'Practice the STAR method: Situation, Task, Action, Result. It structures your answers clearly.',
  'Research the company',
];

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const replyIndex = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const { position, onMouseDown, onTouchStart, isDragging } = useDragFAB();

  const getTimestamp = () =>
    new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text,
      variant: 'user',
      timestamp: getTimestamp(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    timeoutRef.current = setTimeout(() => {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
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
          />
        </div>
      )}

      {/* ── FAB ── */}
      <Button
        circled
        ref={fabRef}
        onClick={handleFabClick}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        aria-label={isOpen ? 'Close chat' : 'Open TalkUp chat'}
        aria-expanded={isOpen}
        className="w-14 h-14 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-success)] shadow-lg cursor-grab active:cursor-grabbing select-none hover:scale-105"
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
