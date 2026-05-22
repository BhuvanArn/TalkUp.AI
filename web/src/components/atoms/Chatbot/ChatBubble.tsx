import React from 'react';

interface ChatBubbleProps {
  /** Le contenu textuel du message */
  message: string;
  /** L'expéditeur du message pour adapter le style */
  sender: 'user' | 'ai';
}

/**
 * ChatBubble Component
 * Gère l'affichage visuel d'une bulle de message unique avec le style
 * approprié selon l'émetteur (Utilisateur ou IA).
 */
export const ChatBubble = ({ message, sender }: ChatBubbleProps) => {
  const isAi = sender === 'ai';

  return (
    <div style={{ ...bubbleContainer, justifyContent: isAi ? 'flex-start' : 'flex-end' }}>
      <div
        style={{
          ...bubbleStyle,
          backgroundColor: isAi ? '#FFFFFF' : '#1E293B',
          color: isAi ? '#1E293B' : '#FFFFFF',
          border: isAi ? '1px solid #E2E8F0' : 'none',
          borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
        }}
      >
        <p style={textStyle}>{message}</p>
      </div>
    </div>
  );
};

// ── Styles en ligne (CSS-in-JS) ──
const bubbleContainer: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  margin: '4px 0',
};

const bubbleStyle: React.CSSProperties = {
  maxWidth: '80%',
  padding: '12px 16px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  wordBreak: 'break-word',
};

const textStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  lineHeight: '1.5',
  fontFamily: 'inherit',
};