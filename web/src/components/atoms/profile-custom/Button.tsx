import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  accentColor?: string;
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  accentColor = "#2B70C9",
  children,
  style,
  ...props
}: ButtonProps) => {
  const baseStyle: React.CSSProperties = {
    padding: "5px 12px",
    fontSize: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: accentColor,
      color: "white",
      border: "none",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-secondary)",
      border: "0.5px solid var(--color-border-secondary)",
    },
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant] }} {...props}>
      {children}
    </button>
  );
};