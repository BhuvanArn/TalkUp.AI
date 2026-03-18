import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import PhoneNumber from './phonenumber';

/**
 * Test suite for the PhoneNumber component.
 *
 * Validates rendering, interactivity (onChange callbacks), handling of props
 * like `value`, `disabled`, `readOnly`, `className`, and custom placeholders.
 */
describe('PhoneNumber', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders country select and phone number input with default values', () => {
    render(<PhoneNumber />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('US');
  });

  it('displays initial value from props', () => {
    const value = { countryCode: 'FR', phoneNumber: '612345678' };
    render(<PhoneNumber value={value} />);
    expect(screen.getByRole('combobox')).toHaveValue('FR');
    expect(screen.getByLabelText('Phone Number')).toHaveValue('612345678');
  });

  it('calls onChange when country changes', async () => {
    render(
      <PhoneNumber
        value={{ countryCode: 'US', phoneNumber: '123' }}
        onChange={mockOnChange}
      />,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'FR' } });
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        countryCode: 'FR',
        phoneNumber: '123',
      });
    });
  });

  it('calls onChange when phone number changes', async () => {
    render(
      <PhoneNumber
        value={{ countryCode: 'FR', phoneNumber: '' }}
        onChange={mockOnChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Phone Number'), {
      target: { value: '0600000000' },
    });
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        countryCode: 'FR',
        phoneNumber: '0600000000',
      });
    });
  });

  it('updates when value prop changes', () => {
    const { rerender } = render(
      <PhoneNumber value={{ countryCode: 'FR', phoneNumber: '111' }} />,
    );
    rerender(<PhoneNumber value={{ countryCode: 'DE', phoneNumber: '222' }} />);
    expect(screen.getByRole('combobox')).toHaveValue('DE');
    expect(screen.getByLabelText('Phone Number')).toHaveValue('222');
  });

  it('disables input and select when disabled', () => {
    render(<PhoneNumber disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByLabelText('Phone Number')).toBeDisabled();
  });

  it('sets phone input to read-only when readOnly', () => {
    render(<PhoneNumber readOnly />);
    expect(screen.getByLabelText('Phone Number')).toHaveAttribute('readOnly');
  });

  it('applies custom class names', () => {
    render(
      <PhoneNumber
        className="container"
        inputClassName="input"
        selectClassName="select"
      />,
    );
    expect(screen.getByRole('combobox')).toHaveClass('select');
    expect(screen.getByLabelText('Phone Number')).toHaveClass('input');
    expect(screen.getByRole('combobox').closest('div')).toHaveClass(
      'container',
    );
  });

  it('uses defaultCountryCode when no value is given', () => {
    render(<PhoneNumber defaultCountryCode="DE" />);
    expect(screen.getByRole('combobox')).toHaveValue('DE');
  });

  it('uses custom placeholder', () => {
    render(<PhoneNumber placeholder="Enter your phone" />);
    expect(screen.getByLabelText('Phone Number')).toHaveAttribute(
      'placeholder',
      'Enter your phone',
    );
  });
});
