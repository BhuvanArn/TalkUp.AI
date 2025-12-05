import { Icon } from '@/components/atoms/icon';
import { cn } from '@/utils/cn';
import React, { useId, useState } from 'react';

export interface BaseInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  name?: string;
  value?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * A base input component for form elements.
 *
 * @component
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props - The component props.
 * This component directly extends and accepts all standard HTML input attributes.
 * @param {string} [props.id] - The unique ID for the input element.
 * @param {string} [props.type='text'] - The type of the input (e.g., 'text', 'password').
 * @param {string} [props.placeholder='Enter text'] - The placeholder text.
 * @param {string} [props.name='input'] - The name of the input field. This also defaults the accessible name if no other label is provided.
 * @param {string} [props.value=''] - The value of the input.
 * @param {function} [props.onChange] - Function called when input value changes.
 * @param {boolean} [props.disabled=false] - Whether the input is disabled.
 * @param {boolean} [props.readOnly=false] - Whether the input is read-only.
 * @param {boolean} [props.required=false] - Whether the input is required.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @returns {JSX.Element} The rendered input component.
 */
export const BaseInput: React.FC<BaseInputProps> = ({
  id,
  name = 'input',
  value = '',
  type = 'text',
  placeholder = 'Enter text',
  disabled = false,
  readOnly = false,
  required = false,
  onChange = () => {},
  className,
  ...rest
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === 'password';
  const inputType = isPasswordType
    ? showPassword
      ? 'text'
      : 'password'
    : type;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="relative w-full">
      <input
        {...rest}
        id={inputId}
        name={name}
        type={inputType}
        role="textbox"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-disabled={disabled}
        readOnly={readOnly}
        aria-readonly={readOnly}
        required={required}
        aria-label={name}
        aria-required={required}
        className={cn(
          'w-full p-2 text-body-m font-normal transition-colors duration-200 ease-in-out border rounded-sm border-border-strong placeholder:text font-display focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:cursor-not-allowed disabled:bg-disabled disabled:opacity-50',
          isPasswordType ? 'pr-10' : '',
          className,
        )}
      />
      {isPasswordType && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-idle hover:text-active focus:outline-none cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon icon={showPassword ? 'eye-slash' : 'eye'} size="md" />
        </button>
      )}
    </div>
  );
};
