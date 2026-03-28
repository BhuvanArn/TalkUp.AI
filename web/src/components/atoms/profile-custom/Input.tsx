import React from "react";

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  accentColor?: string;
}

export const Input = ({ accentColor = "#2B70C9", style, ...props }: InputProps) => {
  return (
    <input
      style={{
        width: "100%",
        padding: "8px 11px",
        fontSize: "13px",
        borderRadius: "8px",
        border: "0.5px solid var(--color-border-secondary)",
        background: "var(--color-background-primary)",
        color: "var(--color-text-primary)",
        outline: "none",
        fontFamily: "inherit",
        transition: "border-color 0.15s, box-shadow 0.15s",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = accentColor;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}22`;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-secondary)";
        e.currentTarget.style.boxShadow = "none";
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
};

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  accentColor?: string;
}

export const Textarea = ({ accentColor = "#2B70C9", style, ...props }: TextareaProps) => {
  return (
    <textarea
      style={{
        width: "100%",
        padding: "8px 11px",
        fontSize: "13px",
        borderRadius: "8px",
        border: "0.5px solid var(--color-border-secondary)",
        background: "var(--color-background-primary)",
        color: "var(--color-text-primary)",
        outline: "none",
        fontFamily: "inherit",
        resize: "vertical",
        minHeight: "80px",
        transition: "border-color 0.15s, box-shadow 0.15s",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = accentColor;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}22`;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-secondary)";
        e.currentTarget.style.boxShadow = "none";
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
};

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  accentColor?: string;
}

export const Select = ({ accentColor = "#2B70C9", style, children, ...props }: SelectProps) => {
  return (
    <select
      style={{
        width: "100%",
        padding: "8px 11px",
        fontSize: "13px",
        borderRadius: "8px",
        border: "0.5px solid var(--color-border-secondary)",
        background: "var(--color-background-primary)",
        color: "var(--color-text-primary)",
        outline: "none",
        fontFamily: "inherit",
        cursor: "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
};

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const Field = ({ label, hint, children }: FieldProps) => {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          marginBottom: "5px",
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
          {hint}
        </div>
      )}
    </div>
  );
};