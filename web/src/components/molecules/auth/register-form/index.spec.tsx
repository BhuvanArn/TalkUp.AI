import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegisterForm } from '.';

/**
 * Mocks the `usePostRegister` hook.
 */
vi.mock('@/hooks/auth/useServices', () => ({
  usePostRegister: vi.fn(() => ({
    mutate: vi.fn(),
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

/**
 * Test suite for the RegisterForm component.
 * This suite verifies the component's rendering, client-side and asynchronous validation,
 * user interactions, form submission, and integration with external hooks.
 */
describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test Group: Initial Render and Basic Structure
   * Ensures that the form and its core elements are rendered correctly on initial load.
   */
  describe('Initial Render and Basic Structure', () => {
    it('renders the register form elements correctly', () => {
      render(<RegisterForm />);

      expect(
        screen.getByRole('heading', { name: /Register/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Create your account/i)).toBeInTheDocument();

      expect(
        screen.getByPlaceholderText(/Choose a username/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Your email address/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Create a secure password/i),
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: /Register/i }),
      ).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Client-Side Synchronous Validation
   * Tests the immediate validation rules for each field (e.g., length, format).
   */
  describe('Client-Side Synchronous Validation', () => {
    /**
     * Test Sub-Group: Username Validation
     * Tests the synchronous validation rules specific to the username field.
     */
    describe('Username Validation', () => {
      it('displays error for username less than 3 characters', async () => {
        render(<RegisterForm />);
        const usernameInput = screen.getByPlaceholderText(/Choose a username/i);
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(usernameInput, { target: { value: 'ab' } });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText('Username must be at least 3 characters'),
          ).toBeInTheDocument();
        });
      });

      it('displays error for username more than 20 characters', async () => {
        render(<RegisterForm />);
        const usernameInput = screen.getByPlaceholderText(/Choose a username/i);
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(usernameInput, {
            target: { value: 'thisusernameiswaytoolongtobevalid' },
          });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText('Username must be at most 20 characters'),
          ).toBeInTheDocument();
        });
      });

      it('displays error for username with special characters', async () => {
        render(<RegisterForm />);
        const usernameInput = screen.getByPlaceholderText(/Choose a username/i);
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(usernameInput, { target: { value: 'user!@#' } });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText('Username must contain only letters and numbers'),
          ).toBeInTheDocument();
        });
      });
    });

    /**
     * Test Sub-Group: Phone Number Validation
     * Tests the synchronous validation rules specific to the email field.
     */
    describe('Email Validation', () => {
      it('displays error for invalid email format', async () => {
        render(<RegisterForm />);
        const emailInput = screen.getByPlaceholderText(/Your email address/i);
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        });
      });
    });

    /**
     * Test Sub-Group: Password Validation
     * Tests the synchronous validation rules for password complexity.
     */
    describe('Password Validation', () => {
      it('displays error for password less than 8 characters', async () => {
        render(<RegisterForm />);
        const passwordInput = screen.getByPlaceholderText(
          /Create a secure password/i,
        );
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(passwordInput, { target: { value: 'Short1!' } });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText('Password must be at least 8 characters'),
          ).toBeInTheDocument();
        });
      });

      it('displays error for password more than allowed characters', async () => {
        render(<RegisterForm />);
        const passwordInput = screen.getByPlaceholderText(
          /Create a secure password/i,
        );
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(passwordInput, {
            target: {
              value:
                'ThisPasswordIsSuperLongAndDefinitelyExceedsTwentyCharacters',
            },
          });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText('Password must be less than 50 characters'),
          ).toBeInTheDocument();
        });
      });

      it('displays error for password missing lowercase letter', async () => {
        render(<RegisterForm />);
        const passwordInput = screen.getByPlaceholderText(
          /Create a secure password/i,
        );
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(passwordInput, {
            target: { value: 'NOLOWERCASE123!' },
          });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText(
              'Password must contain at least one lowercase letter',
            ),
          ).toBeInTheDocument();
        });
      });

      it('displays error for password missing uppercase letter', async () => {
        render(<RegisterForm />);
        const passwordInput = screen.getByPlaceholderText(
          /Create a secure password/i,
        );
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(passwordInput, {
            target: { value: 'nouppercase123!' },
          });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText(
              'Password must contain at least one uppercase letter',
            ),
          ).toBeInTheDocument();
        });
      });

      it('displays error for password missing number', async () => {
        render(<RegisterForm />);
        const passwordInput = screen.getByPlaceholderText(
          /Create a secure password/i,
        );
        const signUpButton = screen.getByRole('button', { name: /Register/i });

        await act(async () => {
          fireEvent.change(passwordInput, { target: { value: 'NoNumbers!' } });
          fireEvent.click(signUpButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText('Password must contain at least one number'),
          ).toBeInTheDocument();
        });
      });
    });
  });

  /**
   * Test Group: Accessibility
   * Ensures that the form's elements have correct accessibility attributes.
   */
  describe('Accessibility', () => {
    it('ensures correct htmlFor attributes on labels and id on inputs', () => {
      render(<RegisterForm />);

      const usernameInput = screen.getByPlaceholderText(/Choose a username/i);
      expect(usernameInput).toHaveAttribute('id', 'username');

      const emailInput = screen.getByPlaceholderText(/Your email address/i);
      expect(emailInput).toHaveAttribute('id', 'email');

      const passwordInput = screen.getByPlaceholderText(
        /Create a secure password/i,
      );
      expect(passwordInput).toHaveAttribute('id', 'password');
    });
  });
});
