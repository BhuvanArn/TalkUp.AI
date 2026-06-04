import { ChatWindow, Message } from '@/components/organisms/chatbot/ChatWindow';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ChatWidget
 *
 * The root chatbot organism. Renders a draggable floating action button (FAB)
 * that toggles the ChatWindow open/closed.
 *
 * Features:
 * - Draggable FAB that can be repositioned anywhere on screen
 * - Smooth open/close animation on the chat window
 * - Local message state management
 * - Simulated AI typing indicator before response
 * - Auto-scroll to latest message
 *
 * Place this component once at the root layout level so it persists
 * across all routes.
 *
 * @returns The floating chatbot widget as a React functional component.
 *
 * @example
 * // In __root.tsx or a layout component
 * <ChatWidget />
 */

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
  'Research the company’s products and be ready to discuss how you would improve them.',
];

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const fabRef = useRef<HTMLButtonElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const replyIndex = useRef(0);

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

    setTimeout(() => {
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = false;
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };

      const onMouseMove = (ev: MouseEvent) => {
        isDragging.current = true;
        setPosition({
          x: ev.clientX - dragStart.current.x,
          y: ev.clientY - dragStart.current.y,
        });
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [position],
  );

  const handleFabClick = () => {
    if (isDragging.current) return;
    setIsOpen((prev) => !prev);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      dragStart.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };

      const onTouchMove = (ev: TouchEvent) => {
        const t = ev.touches[0];
        isDragging.current = true;
        setPosition({
          x: t.clientX - dragStart.current.x,
          y: t.clientY - dragStart.current.y,
        });
      };

      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        setTimeout(() => {
          isDragging.current = false;
        }, 10);
      };

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    },
    [position],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: `${24 - position.y}px`,
        right: `${24 - position.x}px`,
      }}
    >
      {/* ── Chat window ── */}
      <div
        className={`absolute bottom-16 right-0 transition-all duration-200 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-2 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      >
        <ChatWindow
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          isTyping={isTyping}
        />
      </div>

      {/* ── FAB ── */}
      <button
        ref={fabRef}
        onClick={handleFabClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        aria-label={isOpen ? 'Close chat' : 'Open TalkUp chat'}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2B70C9] to-[#1D9E75] border-none flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105"
      >
        {/* Chat icon */}
        <svg
          className={`absolute transition-all duration-300 ${
            isOpen
              ? 'opacity-0 rotate-90 scale-50'
              : 'opacity-100 rotate-0 scale-100'
          }`}
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        {/* Close icon */}
        <svg
          className={`absolute transition-all duration-300 ${
            isOpen
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-50'
          }`}
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};