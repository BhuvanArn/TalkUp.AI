import React from 'react';

/**
 * @interface InputProps
 * @description Extends standard input attributes with a custom accent color for focus states.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Theme color used for borders and box-shadow on focus */
  accentColor?: string;
}

/**
 * Custom Input component with dynamic focus styling.
 */
export const Input = ({
  accentColor = '#2B70C9',
  style,
  ...props
}: InputProps) => {
  return (
    <input
      style={{
        width: '100%',
        padding: '8px 11px',
        fontSize: '13px',
        borderRadius: '8px',
        border: '0.5px solid var(--color-border-secondary)',
        background: 'var(--color-background-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = accentColor;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}22`;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-secondary)';
        e.currentTarget.style.boxShadow = 'none';
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
};

/**
 * @interface TextareaProps
 * @description Extends standard textarea attributes with a custom accent color for focus states.
 */
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Theme color used for borders and box-shadow on focus */
  accentColor?: string;
}

/**
 * Custom Textarea component with auto-resize (vertical) and dynamic focus styling.
 */
export const Textarea = ({
  accentColor = '#2B70C9',
  style,
  ...props
}: TextareaProps) => {
  return (
    <textarea
      style={{
        width: '100%',
        padding: '8px 11px',
        fontSize: '13px',
        borderRadius: '8px',
        border: '0.5px solid var(--color-border-secondary)',
        background: 'var(--color-background-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        fontFamily: 'inherit',
        resize: 'vertical',
        minHeight: '80px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = accentColor;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}22`;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-secondary)';
        e.currentTarget.style.boxShadow = 'none';
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
};

/**
 * @interface SelectProps
 * @description Extends standard select attributes.
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Theme color (currently applied to the container or future focus states) */
  accentColor?: string;
}

/**
 * Custom Select component for dropdown menus.
 */
export const Select = ({
  _accentColor = '#2B70C9',
  style,
  children,
  ...props
}: SelectProps & { _accentColor?: string }) => {
  return (
    <select
      style={{
        width: '100%',
        padding: '8px 11px',
        fontSize: '13px',
        borderRadius: '8px',
        border: '0.5px solid var(--color-border-secondary)',
        background: 'var(--color-background-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        fontFamily: 'inherit',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
};

/**
 * @interface FieldProps
 * @description Layout wrapper for form controls, providing a label and optional help text.
 */
interface FieldProps {
  /** The text to display as the field label */
  label: string;
  /** Optional secondary text to provide context or instructions */
  hint?: string;
  /** The ID of the associated input/control (required for accessibility) */
  htmlFor?: string;
  /** The form control component to be wrapped */
  children: React.ReactNode;
}

/**
 * Form Field wrapper that ensures accessibility by linking labels to controls.
 */
export const Field = ({ label, hint, htmlFor, children }: FieldProps) => {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label
        htmlFor={htmlFor}
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
      {hint && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            marginTop: '4px',
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
};
