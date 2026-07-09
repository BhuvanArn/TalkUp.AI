import { useAuth } from '@/contexts/AuthContext';
import AuthService from '@/services/auth/http';
import { checkAuthStatus, type AuthStatus } from '@/utils/auth.guards';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import toast from 'react-hot-toast';

const authService = new AuthService();

/** Role/org for UI gating (B4). Guards fetch their own copy; this one is for rendering. */
export const useAuthStatus = () => {
  return useQuery<AuthStatus>({
    queryKey: ['auth', 'status'],
    queryFn: checkAuthStatus,
    staleTime: 60 * 1000,
  });
};

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
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      username,
      email,
      password,
      organizationCode,
    }: {
      username: string;
      email: string;
      password: string;
      organizationCode?: string;
    }) => {
      return await authService.postRegister(
        username,
        email,
        password,
        organizationCode,
      );
    },
    onSuccess: (_data, variables) => {
      toast.success('Check your email for a verification code');
      router.navigate({
        to: '/verify-email',
        search: { email: variables.email, redirect: '/' },
      });
    },
    onError: (error) => {
      toast.error('Registration failed');
      console.error('Error during registration:', error);
    },
  });
};

/**
 * Confirms email with OTP; server sets HttpOnly cookies on success.
 */
export const usePostVerifyEmail = () => {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      otpCode,
      redirectTo,
    }: {
      email: string;
      otpCode: string;
      redirectTo: string;
    }) => {
      await authService.postVerifyEmail(email, otpCode);
      return { redirectTo };
    },
    onSuccess: (data) => {
      login();
      toast.success('Email verified');
      router.navigate({ to: data.redirectTo });
    },
  });
};

export const usePostResendOtp = () => {
  return useMutation({
    mutationFn: async ({
      email,
      purpose,
    }: {
      email: string;
      purpose: 'REGISTER' | 'RESET_PASSWORD' | 'NEW_DEVICE';
    }) => {
      return await authService.postResendOtp(email, purpose);
    },
    onSuccess: () => {
      toast.success('A new code has been sent');
    },
  });
};

/**
 * Step 1 of password reset: request OTP email (navigate to /reset-password in onSuccess from the form).
 */
export const usePostPasswordResetRequest = () => {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return await authService.postPasswordResetRequest(email);
    },
  });
};

/**
 * Step 2: verify OTP (sets resetToken cookie) then set new password.
 */
export const usePasswordResetComplete = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      otpCode,
      newPassword,
    }: {
      email: string;
      otpCode: string;
      newPassword: string;
    }) => {
      await authService.postPasswordResetVerify(email, otpCode);
      await authService.patchPasswordUpdate(newPassword);
    },
    onSuccess: () => {
      toast.success('Your password has been updated. You can sign in.');
      router.navigate({ to: '/login' });
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
      const redirectTo = search.get('redirect') || '/';
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
