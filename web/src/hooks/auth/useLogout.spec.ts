import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@tanstack/react-router';
import { renderHook } from '@testing-library/react';
import toast from 'react-hot-toast';
import { describe, expect, it, vi } from 'vitest';

import { useLogout } from './useLogout';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  },
}));

/**
 * Test suite for the useLogout hook.
 * Verifies that the hook correctly handles the logout process.
 */
describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a logout function', () => {
    const { result } = renderHook(() => useLogout());

    expect(result.current).toHaveProperty('logout');
    expect(typeof result.current.logout).toBe('function');
  });

  it('calls logout from auth context when logout function is invoked', () => {
    const mockAuthLogout = vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
    const { result } = renderHook(() => useLogout());

    result.current.logout();

    expect(mockAuthLogout().logout).toHaveBeenCalledTimes(1);
  });

  it('shows success toast when logout function is invoked', () => {
    const mockToastSuccess = vi.mocked(toast.success);
    const { result } = renderHook(() => useLogout());

    result.current.logout();

    expect(mockToastSuccess).toHaveBeenCalledWith('Logged out successfully');
  });

  it('navigates to login page when logout function is invoked', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      navigate: mockNavigate,
    } as unknown as ReturnType<typeof useRouter>);
    const { result } = renderHook(() => useLogout());

    result.current.logout();

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  it('performs all logout actions in correct order', () => {
    const mockAuthLogout = vi.fn();
    const mockNavigate = vi.fn();
    const mockToastSuccess = vi.mocked(toast.success);

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: mockAuthLogout,
    });

    vi.mocked(useRouter).mockReturnValue({
      navigate: mockNavigate,
    } as unknown as ReturnType<typeof useRouter>);

    const { result } = renderHook(() => useLogout());

    result.current.logout();

    expect(mockAuthLogout).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledWith('Logged out successfully');
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });
});
