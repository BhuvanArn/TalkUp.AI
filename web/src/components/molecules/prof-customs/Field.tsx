import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export const Field = ({ label, children }: FieldProps) => {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          marginBottom: '5px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
};
