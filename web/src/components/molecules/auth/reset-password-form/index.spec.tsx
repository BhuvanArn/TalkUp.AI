import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResetPasswordForm } from '.';

vi.mock('@/hooks/auth/useServices', () => ({
  usePasswordResetComplete: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  usePostResendOtp: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading and OTP field when email is present', () => {
    render(<ResetPasswordForm initialEmail="user@example.com" />);

    expect(
      screen.getByRole('heading', { name: /Reset your password/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/000000/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Update password/i }),
    ).toBeInTheDocument();
  });

  it('shows validation error for invalid OTP length', async () => {
    render(<ResetPasswordForm initialEmail="a@b.com" />);

    const otpInput = screen.getByPlaceholderText(/000000/i);
    const submit = screen.getByRole('button', { name: /Update password/i });

    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '123' } });
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(screen.getByText(/Code must be 6 digits/i)).toBeInTheDocument();
    });
  });
});
