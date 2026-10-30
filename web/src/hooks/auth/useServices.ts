import { useAuth } from '@/contexts/AuthContext';
import AuthService from '@/services/auth/http';
import { heroVariantData, trackEvent } from '@/utils/analytics';
import { type AuthStatus, checkAuthStatus } from '@/utils/auth.guards';
import { extractErrorMessage } from '@/utils/error';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import i18next from 'i18next';
import toast from 'react-hot-toast';

const authService = new AuthService();

/**
 * Role/org for UI gating (B4). Guards fetch their own copy; this one is for rendering.
 *
 * Set `anonymousAllowed` when the caller renders for logged-out visitors, so a 401 resolves
 * to ANONYMOUS instead of bouncing the browser to /login. See `checkAuthStatus`.
 */
export const useAuthStatus = ({
  anonymousAllowed,
}: { anonymousAllowed?: boolean } = {}) => {
  return useQuery<AuthStatus>({
    // Distinct key per variant. Sharing one key would let whichever observer fetches
    // first decide the flag for every other caller (mount-order dependent), leaking
    // the anonymous no-refresh behaviour onto guarded pages.
    queryKey: anonymousAllowed
      ? ['auth', 'status', 'anonymous']
      : ['auth', 'status'],
    queryFn: () => checkAuthStatus({ anonymousAllowed }),
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
      trackEvent('signup_completed', {
        withOrganizationCode: Boolean(variables.organizationCode),
        ...heroVariantData(),
      });
      toast.success(i18next.t('auth:toasts.verificationCodeSent'));
      router.navigate({
        to: '/verify-email',
        search: { email: variables.email, redirect: '/' },
      });
    },
    onError: (error) => {
      toast.error(i18next.t('auth:toasts.registrationFailed'));
      console.error('Error during registration:', error);
    },
  });
};

/**
 * F12: org signup → acknowledgement page → OTP verification → lands on
 * /organization. The interstitial /organization-created page confirms the org
 * was created and surfaces the admin username before verification.
 */
export const usePostRegisterOrganization = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      organizationName,
      email,
      password,
    }: {
      organizationName: string;
      email: string;
      password: string;
    }) => {
      return await authService.postRegisterOrganization(
        organizationName,
        email,
        password,
      );
    },
    onSuccess: (_data, variables) => {
      trackEvent('organization_created');
      toast.success(i18next.t('auth:toasts.verificationCodeSent'));
      router.navigate({
        to: '/organization-created',
        search: {
          organizationName: variables.organizationName,
          email: variables.email,
        },
      });
    },
    onError: (error) => {
      toast.error(
        extractErrorMessage(
          error,
          i18next.t('auth:toasts.organizationSignupFailed'),
        ),
      );
      console.error('Error during organization signup:', error);
    },
  });
};

/**
 * Confirms email with OTP; server sets HttpOnly cookies on success.
 */
export const usePostVerifyEmail = () => {
  const { login } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

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
      // The org admin signup verifies through this same hook; `flow` keeps the
      // candidate funnel (signup_completed -> email_verified) under 100%.
      trackEvent('email_verified', {
        flow:
          data.redirectTo === '/organization' ? 'organization' : 'candidate',
      });
      login();
      // Fresh session on this tab — drop any leftover cache (incl. role/org)
      // from a prior account so stale cross-account state can't render.
      queryClient.clear();
      toast.success(i18next.t('auth:toasts.emailVerified'));
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
      toast.success(i18next.t('auth:toasts.codeResent'));
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
      toast.success(i18next.t('auth:toasts.passwordUpdated'));
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
  const queryClient = useQueryClient();

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
      // Discard any cache left over from a previous session on this tab (incl.
      // role/org) so the newly signed-in account fetches its own data fresh.
      queryClient.clear();
      toast.success(i18next.t('auth:toasts.loginSucceeded'));

      const search = new URLSearchParams(window.location.search);
      const redirectTo = search.get('redirect') || '/';
      router.navigate({ to: redirectTo });
    },
    onError: (error) => {
      toast.error(i18next.t('auth:toasts.loginFailed'));
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await authService.postLogout();
    },
    onSuccess: () => {
      logout();
      // Drop every cached query so the next account to sign in on this tab never
      // sees the previous user's data (profile, role/org, applications, etc.).
      queryClient.clear();
      toast.success(i18next.t('auth:toasts.logoutSucceeded'));
      router.navigate({ to: '/login' });
    },
    onError: (error) => {
      // Even if the server call fails we still log out locally — clear too.
      logout();
      queryClient.clear();
      toast.error(i18next.t('auth:toasts.logoutFailed'));
      console.error('Error during logout:', error);
      router.navigate({ to: '/login' });
    },
  });
};
