import { usePostLogout } from './useServices';

/**
 * Custom hook that provides a logout handler for user authentication.
 *
 * When invoked, the returned `logout` function will:
 * - Call the backend logout endpoint to clear the HTTP-only cookie
 * - Call the `logout` method from the authentication context to log out the user.
 * - Display a success toast notification indicating the user has logged out.
 * - Navigate the user to the login page.
 *
 * @returns An object containing the `logout` function to trigger the logout process.
 */
export const useLogout = () => {
  const { mutate: logout } = usePostLogout();

  return { logout };
};
