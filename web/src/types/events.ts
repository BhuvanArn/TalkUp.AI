import React from 'react';

/**
 * Common event handler types for form inputs
 */
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;

/**
 * Generic change event handler type
 */
export type ChangeEventHandler<T extends HTMLElement> = (
  event: React.ChangeEvent<T>,
) => void;
