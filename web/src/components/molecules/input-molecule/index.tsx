import { BaseInput, type BaseInputProps } from '@/components/atoms/base-input';
import {
  CheckboxInput,
  type CheckboxInputProps,
} from '@/components/atoms/checkbox-input';
import {
  SelectorInput,
  type SelectorInputProps,
} from '@/components/atoms/selector-input';
import { TextArea, type TextAreaProps } from '@/components/atoms/text-area';
import React, { useId } from 'react';

/**
 * Additional props for InputMolecule (label and helper text)
 */
interface InputMoleculeExtraProps {
  label?: string;
  helperText?: string;
}

/**
 * InputMoleculeProps defines a flexible union type that supports
 * four different input types: base input, selector (dropdown),
 * textarea, and checkbox. Each type extends CommonInputProps and includes
 * additional attributes relevant to that specific input.
 */
type InputMoleculeProps =
  | ({ type: 'base' } & BaseInputProps & InputMoleculeExtraProps)
  | ({ type: 'selector' } & SelectorInputProps & InputMoleculeExtraProps)
  | ({ type: 'textarea' } & TextAreaProps & InputMoleculeExtraProps)
  | ({ type: 'checkbox'; value?: boolean } & Omit<CheckboxInputProps, 'value'> &
      InputMoleculeExtraProps);

/**
 * InputMolecule is a polymorphic component that renders a flexible form input
 * based on the specified `type`. It supports:
 * - `base`: a standard text input
 * - `selector`: a dropdown select input
 * - `textarea`: a multi-line text area
 * - `checkbox`: a checkbox input
 *
 * It handles automatic ID generation using `useId`, optional labels,
 * helper text, and accessibility linking via the `aria-describedby` attribute to
 * associate helper text with its corresponding input field.
 *
 * @component
 * @param {InputMoleculeProps} props - Props describing which type of input to render and its behavior.
 * @returns {JSX.Element} A fully composed and styled input component.
 */
export const InputMolecule: React.FC<InputMoleculeProps> = React.memo(
  (props) => {
    const generatedId = useId();
    const {
      id = generatedId,
      type,
      label,
      helperText,
      name,
      value,
      onChange,
      disabled,
      required,
      ...rest
    } = props;

    const readOnly = 'readOnly' in props ? props.readOnly : undefined;
    const placeholder = 'placeholder' in props ? props.placeholder : undefined;

    const getInputProps = () =>
      rest as React.InputHTMLAttributes<HTMLInputElement>;
    const getSelectProps = () =>
      rest as React.SelectHTMLAttributes<HTMLSelectElement>;
    const getTextareaProps = () =>
      rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>;

    const shouldRenderExternalLabel = type !== 'checkbox' && label;
    const helperTextId = helperText ? `${id}-helper` : undefined;

    return (
      <div className="flex flex-col gap-1 mb-4">
        {shouldRenderExternalLabel && (
          <label htmlFor={id} className="text-label-m text-idle">
            {label}
          </label>
        )}

        {type === 'base' && (
          <BaseInput
            {...getInputProps()}
            id={id}
            name={name}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            placeholder={placeholder ?? ''}
            aria-describedby={helperTextId}
          />
        )}

        {type === 'selector' && (
          <SelectorInput
            {...getSelectProps()}
            id={id}
            name={name}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            disabled={disabled}
            required={required}
            aria-describedby={helperTextId}
          />
        )}

        {type === 'textarea' && (
          <TextArea
            {...getTextareaProps()}
            id={id}
            name={name}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            placeholder={placeholder ?? ''}
            aria-describedby={helperTextId}
          />
        )}

        {type === 'checkbox' && (
          <div className="flex items-center gap-2">
            <CheckboxInput
              {...getInputProps()}
              id={id}
              name={name}
              checked={!!value}
              onChange={onChange}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
              aria-describedby={helperTextId}
            />
            {label && (
              <label htmlFor={id} className="text-sm font-semibold text-text">
                {label}
              </label>
            )}
          </div>
        )}

        {helperText && (
          <p id={helperTextId} className="text-xs text-text-weakest mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
