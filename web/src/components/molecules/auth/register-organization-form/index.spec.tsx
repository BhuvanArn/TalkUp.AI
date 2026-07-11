import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RegisterOrganizationForm } from '.';

const mutateMock = vi.fn();

/**
 * Mocks the `usePostRegisterOrganization` hook.
 */
vi.mock('@/hooks/auth/useServices', () => ({
  usePostRegisterOrganization: vi.fn(() => ({
    mutate: mutateMock,
  })),
}));
vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(() => ({
    navigate: vi.fn(),
    history: { push: vi.fn() },
  })),
  useNavigate: vi.fn(() => vi.fn()),
  createRouter: vi.fn(),
  RouterProvider: ({ children }: { children: React.ReactNode }) => children,
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  createMemoryHistory: vi.fn(),
}));

describe('RegisterOrganizationForm (F12)', () => {
  it('renders org name, email and password fields', () => {
    render(<RegisterOrganizationForm />);
    expect(
      screen.getByPlaceholderText(/organization name/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('submits organizationName, email and password', async () => {
    render(<RegisterOrganizationForm />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/organization name/i), {
        target: { value: 'Acme School' },
      });
      fireEvent.change(screen.getByPlaceholderText(/email/i), {
        target: { value: 'admin@acme.example' },
      });
      fireEvent.change(screen.getByPlaceholderText(/password/i), {
        target: { value: 'Abcdefg1*' },
      });
      fireEvent.click(
        screen.getByRole('button', { name: /create organization/i }),
      );
    });

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        {
          organizationName: 'Acme School',
          email: 'admin@acme.example',
          password: 'Abcdefg1*',
        },
        expect.anything(),
      );
    });
  });
});
