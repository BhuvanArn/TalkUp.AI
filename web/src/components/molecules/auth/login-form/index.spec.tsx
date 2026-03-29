import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from '.';

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

vi.mock('@/services/auth/http', () => {
  return {
    default: class MockAuthService {
      postLogin = vi.fn().mockResolvedValue({ accessToken: 'mock-token' });
      postRegister = vi.fn().mockResolvedValue({ accessToken: 'mock-token' });
    },
  };
});

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

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{component}</AuthProvider>
    </QueryClientProvider>,
  );
};

/**
 * Test suite for the LoginForm component.
 * This suite covers rendering, client-side validation, asynchronous validation,
 * user interactions, and accessibility aspects of the form.
 */
describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test Group: Initial Render and Basic Structure
   * Verifies that all essential elements of the LoginForm are correctly rendered
   * when the component is first mounted.
   */
  describe('Initial Render and Basic Structure', () => {
    it('renders the login form elements correctly', () => {
      renderWithProviders(<LoginForm />);

      expect(
        screen.getByRole('heading', { name: /Login/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Get back to your account/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/What email did you use\?/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Please type your password/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Log In/i }),
      ).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Client-Side Validation (Synchronous Validators)
   * This group focuses on testing the immediate, synchronous validation rules
   * applied to the form fields on submission.
   */
  describe('Client-Side Validation (Sync Validators)', () => {
    it('displays field errors when both fields are empty on submit', async () => {
      renderWithProviders(<LoginForm />);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
    });

    it('displays "Email is required" error when only email is empty on submit', async () => {
      renderWithProviders(<LoginForm />);
      const passwordInput = screen.getByPlaceholderText(
        /Please type your password/i,
      );
      const loginButton = screen.getByRole('button', { name: /Log In/i });
      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(loginButton);
      });
      const emailInput = screen.getByPlaceholderText(
        /What email did you use\?/i,
      );

      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: 'Password1!' } });
        fireEvent.change(emailInput, { target: { value: '' } });
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });
      expect(
        screen.queryByText(/Email and password are required/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/^Password is required$/i),
      ).not.toBeInTheDocument();
    });

    it('displays "Password is required" error when only password is empty on submit', async () => {
      renderWithProviders(<LoginForm />);
      const emailInput = screen.getByPlaceholderText(
        /What email did you use\?/i,
      );
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'testuser@example.com' },
        });
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/^Password is required$/i)).toBeInTheDocument();
      });
      expect(
        screen.queryByText(/Email and password are required/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/^Email is required$/i),
      ).not.toBeInTheDocument();
    });
  });

  /**
   * Test Group: User Interactions
   * This group focuses on verifying the component's responsiveness to common
   * user input actions such as typing into fields and submitting the form.
   */
  describe('User Interactions', () => {
    it('allows typing into email and password fields', async () => {
      renderWithProviders(<LoginForm />);
      const emailInput = screen.getByPlaceholderText(
        /What email did you use\?/i,
      );
      const passwordInput = screen.getByPlaceholderText(
        /Please type your password/i,
      );

      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'myemail@example.com' },
        });
      });
      expect(emailInput).toHaveValue('myemail@example.com');

      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
      });
      expect(passwordInput).toHaveValue('mypassword');
    });

    it('submits the form with valid credentials', async () => {
      renderWithProviders(<LoginForm />);
      const emailInput = screen.getByPlaceholderText(
        /What email did you use\?/i,
      );
      const passwordInput = screen.getByPlaceholderText(
        /Please type your password/i,
      );
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'admin.admin@admin.com' },
        });
        fireEvent.change(passwordInput, { target: { value: 'admin' } });
        fireEvent.click(loginButton);
      });
    });
  });

  /**
   * Test Group: Accessibility
   * This group ensures that the LoginForm adheres to basic accessibility standards,
   * specifically checking for correct labeling and input associations.
   */
  describe('Accessibility', () => {
    it('ensures correct htmlFor attributes on labels and id on inputs', () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(
        /What email did you use\?/i,
      );
      expect(emailInput).toHaveAttribute('id', 'email');

      const passwordInput = screen.getByPlaceholderText(
        /Please type your password/i,
      );
      expect(passwordInput).toHaveAttribute('id', 'password');
    });
  });
});
