import { useAuth } from '@/contexts/AuthContext';
import AuthService from '@/services/auth/http';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import toast from 'react-hot-toast';

const authService = new AuthService();

/**
 * Custom hook for user registration functionality.
 *
 * This hook uses React Query's useMutation to handle the registration process.
 * It takes username, email, and password as inputs, sends them to the authentication service,
 * and the server sets an HTTP-only cookie containing the JWT.
 *
 * @returns A mutation object that can be used to trigger the registration process
 * and monitor its state.
 */
export const usePostRegister = () => {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      username,
      email,
      password,
    }: {
      username: string;
      email: string;
      password: string;
    }) => {
      return await authService.postRegister(username, email, password);
    },
    onSuccess: () => {
      login();
      toast.success('Registration successful');
      router.navigate({ to: '/dashboard' });
    },
    onError: (error) => {
      toast.error('Registration failed');
      console.error('Error during registration:', error);
    },
  });
};

/**
 * Custom hook for user login functionality.
 *
 * This hook uses React Query's useMutation to handle the login process.
 * It takes email and password as inputs, sends them to the authentication service,
 * and the server sets an HTTP-only cookie containing the JWT.
 *
 * @returns A mutation object that can be used to trigger the login process
 * and monitor its state.
 */
export const usePostLogin = () => {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return await authService.postLogin(email, password);
    },
    onSuccess: () => {
      login();
      toast.success('Login successful');

      const search = new URLSearchParams(window.location.search);
      const redirectTo = search.get('redirect') || '/dashboard';
      router.navigate({ to: redirectTo });
    },
    onError: (error) => {
      toast.error('Login failed');
      console.error('Error during login:', error);
    },
  });
};

/**
 * Custom hook for user logout functionality.
 *
 * This hook uses React Query's useMutation to handle the logout process.
 * It calls the logout endpoint which clears the HTTP-only cookie on the server.
 *
 * @returns A mutation object that can be used to trigger the logout process
 * and monitor its state.
 */
export const usePostLogout = () => {
  const { logout } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      return await authService.postLogout();
    },
    onSuccess: () => {
      logout();
      toast.success('Logout successful');
      router.navigate({ to: '/login' });
    },
    onError: (error) => {
      logout();
      toast.error('Logout failed');
      console.error('Error during logout:', error);
      router.navigate({ to: '/login' });
    },
  });
};
