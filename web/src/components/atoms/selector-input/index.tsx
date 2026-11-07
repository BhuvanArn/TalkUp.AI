import { cn } from '@/utils/cn';
import React, { JSX } from 'react';

import { SelectorOption } from './types';

export type { SelectorOption } from './types';

export interface SelectorInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name?: string;
  value?: string;
  options?: SelectorOption[];
  disabled?: boolean;
  required?: boolean;
  hideCaret?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * @component SelectorInput
 * @description A select input component for forms, encapsulating an HTML <select> element.
 * It applies common styling and manages its attributes, including the 'id' prop for accessibility.
 *
 * @param {Props} props - The component properties. All standard HTML attributes for <select> are supported.
 * @param {string} [props.id] - The unique ID for the select element. Essential for label association.
 * @param {string} props.name - The name of the select field. This also defaults the accessible name if no other label is provided.
 * @param {string} [props.value=''] - The current value of the select.
 * @param {SelectorOption[]} props.options - An array of options to display in the select dropdown.
 * @param {boolean} [props.disabled=false] - Indicates if the select is disabled.
 * @param {boolean} [props.required=false] - Indicates if the select is required.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {(event: React.ChangeEvent<HTMLSelectElement>) => void} [props.onChange] - Callback function called when the value changes.
 * @returns {JSX.Element} The rendered HTML <select> element with provided props and styling.
 */
export const SelectorInput: React.FC<SelectorInputProps> = ({
  id,
  name = 'select',
  value = '',
  options = [],
  disabled = false,
  required = false,
  hideCaret = false,
  className,
  onChange = () => {},
  ...rest
}: SelectorInputProps): JSX.Element => {
  return (
    <select
      {...rest}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      aria-label={name}
      className={cn(
        'px-4 py-2 text-sm font-normal transition-colors duration-200 ease-in-out border rounded-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent cursor-pointer disabled:cursor-not-allowed disabled:bg-disabled disabled:text-text-disabled border-border-input',
        hideCaret ? 'appearance-none' : '',
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
