import { changeLanguage } from '@/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRemoveMember, useRevokeInvite } from './useServices';

const { revokeInvite, removeMember } = vi.hoisted(() => ({
  revokeInvite: vi.fn(),
  removeMember: vi.fn(),
}));

vi.mock('@/services/organization/http', () => ({
  default: class {
    revokeInvite = revokeInvite;
    removeMember = removeMember;
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={
      new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    }
  >
    {children}
  </QueryClientProvider>
);

describe('organization mutation toasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(() => changeLanguage('en'));
    localStorage.clear();
  });

  it('toasts in English by default', async () => {
    revokeInvite.mockResolvedValue({ message: 'ok' });
    const { result } = renderHook(() => useRevokeInvite('org-1'), { wrapper });
    act(() => result.current.mutate('invite-1'));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Invite revoked'),
    );
  });

  it('toasts in the active language', async () => {
    await act(() => changeLanguage('fr'));
    removeMember.mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useRemoveMember('org-1'), { wrapper });
    act(() => result.current.mutate('user-1'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Impossible de retirer le membre',
      ),
    );
  });
});
