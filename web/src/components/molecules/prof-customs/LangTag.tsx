import React from 'react';

interface LangTagProps {
  label: string;
  variant: "native" | "learning" | "add";
}

export const LangTag = ({ label, variant }: LangTagProps) => {
  const styles: Record<string, React.CSSProperties> = {
    native: { background: "#EBF3FC", color: "#185FA5" },
    learning: { background: "#EAF3DE", color: "#3B6D11" },
    add: { 
      background: "transparent", 
      border: "0.5px dashed var(--color-border-secondary)", 
      color: "var(--color-text-secondary)" 
    },
  };

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 500,
      margin: "3px",
      cursor: "pointer",
      ...styles[variant],
    }}>
      {label}
      {variant !== "add" && <span style={{ fontSize: "11px", opacity: 0.6 }}>✕</span>}
    </span>
  );
};