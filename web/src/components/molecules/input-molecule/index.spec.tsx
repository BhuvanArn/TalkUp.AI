import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InputMolecule } from './index';

/**
 * Test suite for InputMolecule component
 *
 * This suite tests the rendering and functionality of different input types:
 * - BaseInput (text)
 * - SelectorInput (dropdown)
 * - TextArea
 * - CheckboxInput
 */
describe('InputMolecule', () => {
  it('renders BaseInput for type "base" with correct props', () => {
    const handleChange = vi.fn();
    render(
      <InputMolecule
        type="base"
        name="testName"
        label="Test Label"
        value="initial value"
        onChange={handleChange}
        placeholder="Enter text"
        helperText="Some help text"
        required
        disabled={false}
      />,
    );

    const inputElement = screen.getByLabelText('Test Label');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('name', 'testName');
    expect(inputElement).toHaveValue('initial value');
    expect(inputElement).toHaveAttribute('placeholder', 'Enter text');
    expect(inputElement).toBeRequired();
    expect(inputElement).not.toBeDisabled();
    expect(screen.getByText('Some help text')).toBeInTheDocument();

    fireEvent.change(inputElement, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders SelectorInput with options', () => {
    const handleChange = vi.fn();
    const options = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ];

    render(
      <InputMolecule
        type="selector"
        name="fruitSelector"
        label="Select Fruit"
        value="banana"
        onChange={handleChange}
        options={options}
        required
      />,
    );

    const select = screen.getByLabelText('Select Fruit');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('banana');

    fireEvent.change(select, { target: { value: 'apple' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders TextArea', () => {
    const handleChange = vi.fn();
    render(
      <InputMolecule
        type="textarea"
        name="desc"
        label="Description"
        value="initial"
        onChange={handleChange}
        placeholder="Enter text"
        rows={3}
        cols={30}
        resize
      />,
    );

    const textarea = screen.getByLabelText('Description');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('initial');

    fireEvent.change(textarea, { target: { value: 'updated' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders CheckboxInput', () => {
    const handleChange = vi.fn();
    render(
      <InputMolecule
        type="checkbox"
        name="agree"
        label="Accept terms"
        value={true}
        onChange={handleChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
