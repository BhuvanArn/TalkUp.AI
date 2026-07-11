import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PasswordField } from './index';

describe('PasswordField', () => {
  it('renders a masked password input by default', () => {
    render(<PasswordField id="pw" value="secret" onChange={() => {}} />);
    const input = screen.getByDisplayValue('secret');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles the input type when the show button is clicked', () => {
    render(<PasswordField id="pw" value="secret" onChange={() => {}} />);
    const toggle = screen.getByRole('button', { name: /show password/i });
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);
    expect(screen.getByDisplayValue('secret')).toHaveAttribute('type', 'text');
    const hide = screen.getByRole('button', { name: /hide password/i });
    expect(hide).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides the toggle when showToggle is false', () => {
    render(
      <PasswordField
        id="pw"
        value="x"
        onChange={() => {}}
        showToggle={false}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render the strength meter by default', () => {
    render(<PasswordField id="pw" value="Abcdefg1*" onChange={() => {}} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders the strength meter with a live label when showStrength is set', () => {
    render(
      <PasswordField
        id="pw"
        value="Abcdefg1*"
        onChange={() => {}}
        showStrength
      />,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent(/fair/i);
  });

  it('forwards onBlur and autoComplete to the underlying input', () => {
    const onBlur = vi.fn();
    render(
      <PasswordField
        id="pw"
        value="x"
        onChange={() => {}}
        onBlur={onBlur}
        autoComplete="new-password"
      />,
    );
    const input = screen.getByDisplayValue('x');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('renders an external label bound to the input', () => {
    render(
      <PasswordField id="pw" label="Password" value="" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });
});
