import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BaseInput } from './index';

describe('BaseInput', () => {
  describe('Basic rendering', () => {
    it('should render with default props', () => {
      render(<BaseInput />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<BaseInput placeholder="Enter your name" />);
      expect(
        screen.getByPlaceholderText('Enter your name'),
      ).toBeInTheDocument();
    });

    it('should render with custom name', () => {
      render(<BaseInput name="username" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should render with custom value', () => {
      render(<BaseInput value="test value" onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('test value');
    });

    it('should use default type of text', () => {
      render(<BaseInput />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render with custom id', () => {
      render(<BaseInput id="custom-id" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('should generate an id when not provided', () => {
      render(<BaseInput />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id');
    });
  });

  describe('Input states', () => {
    it('should render as disabled when disabled prop is true', () => {
      render(<BaseInput disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render as readonly when readOnly prop is true', () => {
      render(<BaseInput readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveAttribute('aria-readonly', 'true');
    });

    it('should render as required when required prop is true', () => {
      render(<BaseInput required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should have proper aria-label from name prop', () => {
      render(<BaseInput name="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'email');
    });
  });

  describe('User interactions', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<BaseInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalledTimes(4);
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<BaseInput onChange={handleChange} disabled />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should update value when controlled', async () => {
      const user = userEvent.setup();
      let value = '';
      const handleChange = vi.fn((e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      });

      const { rerender } = render(
        <BaseInput value={value} onChange={handleChange} />,
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'a');

      rerender(<BaseInput value={value} onChange={handleChange} />);
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Password type functionality', () => {
    it('should render password input when type is password', () => {
      render(<BaseInput type="password" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should not show password visibility toggle for non-password types', () => {
      render(<BaseInput type="text" />);
      const toggleButton = screen.queryByLabelText('Show password');
      expect(toggleButton).not.toBeInTheDocument();
    });
  });

  describe('Different input types', () => {
    it('should render email type input', () => {
      render(<BaseInput type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render tel type input', () => {
      render(<BaseInput type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render date type input', () => {
      render(<BaseInput type="date" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('should render time type input', () => {
      render(<BaseInput type="time" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'time');
    });
  });

  describe('CSS classes and styling', () => {
    it('should apply custom className', () => {
      render(<BaseInput className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should have base styling classes', () => {
      render(<BaseInput />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('p-2');
      expect(input).toHaveClass('border');
      expect(input).toHaveClass('rounded-sm');
    });

    it('should have focus styling classes', () => {
      render(<BaseInput />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:outline-none');
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-accent');
    });

    it('should have disabled styling classes', () => {
      render(<BaseInput disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:bg-disabled');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attribute', () => {
      render(<BaseInput />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should have aria-label from name prop', () => {
      render(<BaseInput name="username" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAccessibleName('username');
    });

    it('should have aria-required when required', () => {
      render(<BaseInput required />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should have aria-disabled when disabled', () => {
      render(<BaseInput disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-readonly when readonly', () => {
      render(<BaseInput readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-readonly', 'true');
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
});
