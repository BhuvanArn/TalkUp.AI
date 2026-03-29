import React from 'react';

/**
 * Props for the BaseInput component.
 * @interface BaseInputProps
 * @extends React.InputHTMLAttributes<HTMLInputElement>
 */
export interface BaseInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /* The unique ID for the input element. */
  id?: string;
  /* The name of the input field. This also defaults the accessible name if no other label is provided. */
  name?: string;
  /* The value of the input. */
  value?: string;
  /* The type of the input (e.g., 'text', 'password'). */
  type?: string;
  /* The placeholder text. */
  placeholder?: string;
  /* Whether the input is disabled. */
  disabled?: boolean;
  /* Whether the input is read-only. */
  readOnly?: boolean;
  /* Whether the input is required. */
  required?: boolean;
  /* Function called when input value changes. */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
