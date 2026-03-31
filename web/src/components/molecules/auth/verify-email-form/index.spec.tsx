import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VerifyEmailForm } from '.';

vi.mock('@/hooks/auth/useServices', () => ({
  usePostVerifyEmail: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  usePostResendOtp: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe('VerifyEmailForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading and OTP field', () => {
    render(<VerifyEmailForm initialEmail="" redirectTo="/" />);

    expect(
      screen.getByRole('heading', { name: /Verify your email/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/000000/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Verify and continue/i }),
    ).toBeInTheDocument();
  });

  it('shows the email from props in the intro copy', () => {
    render(<VerifyEmailForm initialEmail="user@example.com" redirectTo="/" />);

    expect(screen.getByText(/user@example\.com/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid OTP length', async () => {
    render(<VerifyEmailForm initialEmail="a@b.com" redirectTo="/" />);

    const otpInput = screen.getByPlaceholderText(/000000/i);
    const submit = screen.getByRole('button', { name: /Verify and continue/i });

    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '123' } });
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(screen.getByText(/Code must be 6 digits/i)).toBeInTheDocument();
    });
  });
});
