import React from 'react';

export const TypingIndicator = () => {
  return (
    <div style={containerStyle}>
      <div style={{ ...dotStyle, animationDelay: '0s' }} className="dot-blink" />
      <div style={{ ...dotStyle, animationDelay: '0.2s' }} className="dot-blink" />
      <div style={{ ...dotStyle, animationDelay: '0.4s' }} className="dot-blink" />
      
      {/* Petit hack CSS inline injecté pour l'animation des points */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .dot-blink {
          animation: blink 1.4s infinite both;
        }
      `}</style>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '14px 18px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '16px 16px 16px 4px',
  width: 'fit-content',
};

const dotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  backgroundColor: '#64748B',
  borderRadius: '50%',
};