import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  usePostRegister,
  usePostRegisterOrganization,
  usePostVerifyEmail,
} from './useServices';

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock('@/utils/analytics', () => ({ trackEvent }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate: vi.fn() }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/auth/http', () => ({
  default: vi.fn().mockImplementation(() => ({
    postRegister: vi.fn().mockResolvedValue({}),
    postRegisterOrganization: vi.fn().mockResolvedValue({}),
    postVerifyEmail: vi.fn().mockResolvedValue({}),
  })),
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      }),
    },
    children,
  );

/** The landing conversion funnel relies on these events (see web/ANALYTICS.md). */
describe('auth mutations analytics', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it.each([
    [undefined, false],
    ['ORG-123', true],
  ])(
    'tracks signup_completed (organization code: %s)',
    async (organizationCode, withOrganizationCode) => {
      const { result } = renderHook(() => usePostRegister(), { wrapper });
      await act(() =>
        result.current.mutateAsync({
          username: 'lea',
          email: 'lea@example.com',
          password: 'Secret123!',
          organizationCode,
        }),
      );
      expect(trackEvent).toHaveBeenCalledWith('signup_completed', {
        withOrganizationCode,
      });
    },
  );

  it('tracks organization_created', async () => {
    const { result } = renderHook(() => usePostRegisterOrganization(), {
      wrapper,
    });
    await act(() =>
      result.current.mutateAsync({
        organizationName: 'Epitech',
        email: 'admin@example.com',
        password: 'Secret123!',
      }),
    );
    expect(trackEvent).toHaveBeenCalledWith('organization_created');
  });

  it.each([
    ['/', 'candidate'],
    ['/organization', 'organization'],
  ])(
    'tracks email_verified (redirect %s -> flow %s)',
    async (redirectTo, flow) => {
      const { result } = renderHook(() => usePostVerifyEmail(), { wrapper });
      await act(() =>
        result.current.mutateAsync({
          email: 'lea@example.com',
          otpCode: '123456',
          redirectTo,
        }),
      );
      expect(trackEvent).toHaveBeenCalledWith('email_verified', { flow });
    },
  );

  it('sends no personal data with the events', async () => {
    const { result } = renderHook(() => usePostRegister(), { wrapper });
    await act(() =>
      result.current.mutateAsync({
        username: 'lea',
        email: 'lea@example.com',
        password: 'Secret123!',
      }),
    );
    expect(JSON.stringify(trackEvent.mock.calls)).not.toMatch(/lea/);
  });
});
