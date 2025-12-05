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
  | ({ inputType: 'base' } & BaseInputProps & InputMoleculeExtraProps)
  | ({ inputType: 'selector' } & SelectorInputProps & InputMoleculeExtraProps)
  | ({ inputType: 'textarea' } & TextAreaProps & InputMoleculeExtraProps)
  | ({
      inputType: 'checkbox';
      value?: boolean;
    } & Omit<CheckboxInputProps, 'value'> &
      InputMoleculeExtraProps);

/**
 * InputMolecule is a polymorphic component that renders a flexible form input
 * based on the specified `inputType`. It supports:
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
    const { id = generatedId, inputType, label, helperText } = props;

    const shouldRenderExternalLabel = inputType !== 'checkbox' && label;
    const helperTextId = helperText ? `${id}-helper` : undefined;

    return (
      <div className="flex flex-col gap-1">
        {shouldRenderExternalLabel && (
          <label htmlFor={id} className="text-label-m text-idle">
            {label}
          </label>
        )}

        {inputType === 'base' && (
          <BaseInput
            id={id}
            name={props.name}
            value={typeof props.value === 'string' ? props.value : ''}
            onChange={props.onChange}
            disabled={props.disabled}
            readOnly={props.readOnly}
            required={props.required}
            placeholder={props.placeholder ?? ''}
            aria-describedby={helperTextId}
            type={props.type}
          />
        )}

        {inputType === 'selector' && (
          <SelectorInput
            id={id}
            name={props.name}
            value={typeof props.value === 'string' ? props.value : ''}
            onChange={props.onChange}
            disabled={props.disabled}
            required={props.required}
            aria-describedby={helperTextId}
            options={props.options}
          />
        )}

        {inputType === 'textarea' && (
          <TextArea
            id={id}
            name={props.name}
            value={typeof props.value === 'string' ? props.value : ''}
            onChange={props.onChange}
            disabled={props.disabled}
            readOnly={props.readOnly}
            required={props.required}
            placeholder={props.placeholder ?? ''}
            aria-describedby={helperTextId}
          />
        )}

        {inputType === 'checkbox' && (
          <div className="flex items-center gap-2">
            <CheckboxInput
              id={id}
              name={props.name}
              checked={!!props.value}
              onChange={props.onChange}
              disabled={props.disabled}
              readOnly={props.readOnly}
              required={props.required}
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
