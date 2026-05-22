import React from 'react';

interface ChatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Hérite de tous les attributs classiques d'un input HTML
}

export const ChatInput = (props: ChatInputProps) => {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: '#FFFFFF',
  fontSize: '15px',
  fontFamily: 'inherit',
  padding: '12px 14px',
};