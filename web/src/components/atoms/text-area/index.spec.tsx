import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TextArea } from './index';

/**
 * Test suite for the TextArea component.
 * Verifies that the TextArea component renders correctly with various props,
 * applies correct HTML attributes, and handles user interactions.
 */
describe('TextArea', () => {
  it('renders with default props', () => {
    render(<TextArea id="textarea" />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });

    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'Enter text');
    expect(textarea).toHaveAttribute('name', 'textarea');
    expect(textarea).toHaveAttribute('id', 'textarea');
    expect(textarea).toHaveAttribute('aria-label', 'textarea');
    expect(textarea).toHaveValue('');
    expect(textarea).not.toBeDisabled();
    expect(textarea).not.toHaveAttribute('readonly');
    expect(textarea).not.toHaveAttribute('required');
    expect(textarea).toHaveAttribute('rows', '3');
    expect(textarea).toHaveAttribute('cols', '50');
    expect(textarea).toHaveClass('resize-y');
    expect(textarea).not.toHaveClass('resize-none');
  });

  it('renders with custom placeholder', () => {
    render(<TextArea placeholder="Custom placeholder" />);
    const textarea = screen.getByPlaceholderText('Custom placeholder');
    expect(textarea).toBeInTheDocument();
  });

  it('renders with custom name, id, and aria-label', () => {
    render(<TextArea name="custom-input" id="custom-input" />);
    const textarea = screen.getByRole('textbox', { name: 'custom-input' });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('name', 'custom-input');
    expect(textarea).toHaveAttribute('id', 'custom-input');
    expect(textarea).toHaveAttribute('aria-label', 'custom-input');
  });

  it('handles value and onChange correctly', () => {
    const handleChange = vi.fn();
    render(<TextArea value="initial value" onChange={handleChange} />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });

    expect(textarea).toHaveValue('initial value');

    fireEvent.change(textarea, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(expect.any(Object));
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<TextArea disabled />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('disabled:cursor-not-allowed');
    expect(textarea).toHaveClass('disabled:bg-disabled');
    expect(textarea).toHaveClass('disabled:text-text-disabled');
    expect(textarea).toHaveClass('resize-none');
  });

  it('renders as read-only when readOnly prop is true', () => {
    render(<TextArea readOnly />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });
    expect(textarea).toHaveAttribute('readonly');
  });

  it('renders as required when required prop is true', () => {
    render(<TextArea required />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });
    expect(textarea).toHaveAttribute('required');
  });

  it('allows resizing when resize prop is true', () => {
    render(<TextArea resize />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });
    expect(textarea).toHaveClass('resize-y');
    expect(textarea).not.toHaveClass('resize-none');
  });

  it('disables resizing when disabled, even if resize is true', () => {
    render(<TextArea disabled resize />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('resize-none');
    expect(textarea).not.toHaveClass('resize');
  });

  it('renders with custom rows and cols', () => {
    render(<TextArea rows={10} cols={80} />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });
    expect(textarea).toHaveAttribute('rows', '10');
    expect(textarea).toHaveAttribute('cols', '80');
  });

  it('passes additional HTML attributes', () => {
    render(<TextArea data-testid="custom-textarea" tabIndex={-1} />);
    const textarea = screen.getByTestId('custom-textarea');
    expect(textarea).toHaveAttribute('tabindex', '-1');
  });

  it('applies custom className', () => {
    render(<TextArea className="my-custom-class" />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });
    expect(textarea).toHaveClass('my-custom-class');
  });

  it('does not throw when onChange is not provided and textarea value changes', () => {
    render(<TextArea />);
    const textarea = screen.getByRole('textbox', { name: 'textarea' });

    expect(() => {
      fireEvent.change(textarea, { target: { value: 'some new text' } });
    }).not.toThrow();
  });
});
