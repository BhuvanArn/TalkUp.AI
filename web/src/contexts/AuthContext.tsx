import { User } from '@/types/user';
import { ReactNode, createContext, useContext, useState } from 'react';

/**
 * Authentication context interface defining the shape of authentication state and methods.
 *
 * @interface AuthContextType
 */
export interface AuthContextType {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Current user object containing user details */
  user: User | null;
  /** Function to log in a user with optional user data */
  login: (user?: User) => void;
  /** Function to log out the current user */
  logout: () => void;
}

/**
 * React context for managing authentication state across the application.
 * Provides authentication status, user data, and authentication methods.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider component.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Props for the AuthProvider component.
 */
interface AuthProviderProps {
  /** Child components that will have access to the authentication context */
  children: ReactNode;
}

/**
 * Authentication provider component that wraps the application and provides
 * authentication context to all child components.
 *
 * Manages authentication state using HTTP-only cookies set by the backend.
 * Authentication state is managed through login/logout actions.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  /**
   * Logs in a user with optional user data.
   * The authentication token is stored in an HTTP-only cookie by the backend.
   *
   * @param {User} [userData] - Optional user data to store in the context
   */
  const login = (userData?: User) => {
    setIsAuthenticated(true);
    if (userData) {
      setUser(userData);
    }
  };

  /**
   * Logs out the current user by clearing all authentication state.
   * The backend will clear the HTTP-only cookie.
   */
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  // Create the context value object with all auth state and methods
  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
