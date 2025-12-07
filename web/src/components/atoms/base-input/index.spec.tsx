import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BaseInput } from './index';

/**
 * Test suite for the BaseInput component.
 * Ensures that the input renders correctly with default and custom props,
 * handles user interaction, and applies accessibility attributes.
 */
describe('BaseInput', () => {
  it('renders with default props (type="text", placeholder="Enter text", name="input", empty value)', () => {
    render(<BaseInput id="input" />);

    const inputElement = screen.getByRole('textbox', { name: 'input' });

    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'text');
    expect(inputElement).toHaveAttribute('placeholder', 'Enter text');
    expect(inputElement).toHaveAttribute('name', 'input');
    expect(inputElement).toHaveAttribute('id', 'input');
    expect(inputElement).toHaveAttribute('aria-label', 'input');
    expect(inputElement).toHaveValue('');
    expect(inputElement).not.toBeDisabled();
    expect(inputElement).not.toHaveAttribute('readonly');
    expect(inputElement).not.toHaveAttribute('required');
  });

  it('renders with a custom type', () => {
    render(<BaseInput type="password" />);
    const inputElement = screen.getByRole('textbox', { name: 'input' });
    expect(inputElement).toHaveAttribute('type', 'password');
  });

  it('renders with a custom placeholder', () => {
    const customPlaceholder = 'Search here...';
    render(<BaseInput placeholder={customPlaceholder} />);
    const inputElement = screen.getByPlaceholderText(customPlaceholder);
    expect(inputElement).toBeInTheDocument();
  });

  it('renders with a custom name, and applies it to id and aria-label', () => {
    const customName = 'username';
    render(<BaseInput name={customName} id={customName} />);
    const inputElement = screen.getByRole('textbox', { name: customName });
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('name', customName);
    expect(inputElement).toHaveAttribute('id', customName);
    expect(inputElement).toHaveAttribute('aria-label', customName);
  });

  it('renders with a custom initial value', () => {
    const initialValue = 'Hello World';
    render(<BaseInput value={initialValue} />);
    const inputElement = screen.getByDisplayValue(initialValue);
    expect(inputElement).toBeInTheDocument();
  });

  it('calls onChange handler with correct value on input change', () => {
    let capturedValue: string | undefined;
    const handleChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      capturedValue = event.target.value;
    });

    render(<BaseInput onChange={handleChange} />);

    const inputElement = screen.getByRole('textbox', { name: 'input' });
    const newValue = 'test value';

    fireEvent.change(inputElement, { target: { value: newValue } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(capturedValue).toBe(newValue);
  });

  it('does not throw when onChange is not provided and input value changes', () => {
    render(<BaseInput />);
    const inputElement = screen.getByRole('textbox', { name: 'input' });

    expect(() => {
      fireEvent.change(inputElement, { target: { value: 'some new text' } });
    }).not.toThrow();
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<BaseInput disabled />);
    const inputElement = screen.getByRole('textbox', { name: 'input' });
    expect(inputElement).toBeDisabled();
    expect(inputElement).toHaveClass('disabled:cursor-not-allowed');
    expect(inputElement).toHaveClass('disabled:bg-disabled');
    expect(inputElement).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders as read-only when readOnly prop is true', () => {
    render(<BaseInput readOnly />);
    const inputElement = screen.getByRole('textbox', { name: 'input' });
    expect(inputElement).toHaveAttribute('readonly');
    expect(inputElement).toHaveAttribute('aria-readonly', 'true');
  });

  it('renders as required when required prop is true', () => {
    render(<BaseInput required />);
    const inputElement = screen.getByRole('textbox', { name: 'input' });
    expect(inputElement).toHaveAttribute('required');
    expect(inputElement).toHaveAttribute('aria-required', 'true');
  });

  it('passes additional HTML attributes to the input element', () => {
    render(<BaseInput data-testid="custom-input" className="extra-class" />);
    const inputElement = screen.getByTestId('custom-input');

    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveClass('extra-class');
    expect(inputElement).toHaveClass('p-2');
  });
});
