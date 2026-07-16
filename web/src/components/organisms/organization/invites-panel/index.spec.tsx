import type { OrganizationInvite } from '@/services/organization/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InvitesPanel from './index';

const invites: OrganizationInvite[] = [
  {
    invite_id: 'i1',
    code: 'ABCDEFGHJKLM',
    email: null,
    role: 'user',
    status: 'pending',
    expires_at: '2026-07-23T00:00:00Z',
    created_at: '2026-07-09T00:00:00Z',
    accepted_at: null,
  },
  {
    invite_id: 'i2',
    code: 'NPQRSTUVWXYZ',
    email: 'a@b.co',
    role: 'user',
    status: 'accepted',
    expires_at: '2026-07-23T00:00:00Z',
    created_at: '2026-07-08T00:00:00Z',
    accepted_at: '2026-07-09T00:00:00Z',
  },
];

describe('InvitesPanel', () => {
  it('lists invites with status', () => {
    render(
      <InvitesPanel
        invites={invites}
        isAdmin={true}
        callerRole="admin"
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        isCreating={false}
      />,
    );
    expect(screen.getByText('ABCDEFGHJKLM')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('accepted')).toBeInTheDocument();
  });

  it('opens the create modal from the Create invite button', () => {
    render(
      <InvitesPanel
        invites={[]}
        isAdmin={true}
        callerRole="admin"
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        isCreating={false}
      />,
    );
    // Modal (and its role select) is not mounted until the button is clicked.
    expect(screen.queryByLabelText(/invite role/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /create invite/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/invite role/i)).toBeInTheDocument();
  });

  it('offers employee role option to admins only', () => {
    const { unmount } = render(
      <InvitesPanel
        invites={[]}
        isAdmin={true}
        callerRole="admin"
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        isCreating={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /create invite/i }));
    expect(screen.getByLabelText(/invite role/i)).toContainHTML('employee');
    unmount();

    render(
      <InvitesPanel
        invites={[]}
        isAdmin={false}
        callerRole="employee"
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        isCreating={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /create invite/i }));
    expect(screen.getByLabelText(/invite role/i)).not.toContainHTML('employee');
  });

  it('revoke shown to admins on pending invites only', () => {
    render(
      <InvitesPanel
        invites={invites}
        isAdmin={true}
        callerRole="admin"
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        isCreating={false}
      />,
    );
    expect(screen.getAllByRole('button', { name: /revoke/i }).length).toBe(1);
  });

  it('creates an invite with optional email + role from the modal', () => {
    const onCreate = vi.fn();
    render(
      <InvitesPanel
        invites={[]}
        isAdmin={true}
        callerRole="admin"
        onCreate={onCreate}
        onRevoke={vi.fn()}
        isCreating={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /create invite/i }));
    fireEvent.change(screen.getByPlaceholderText(/email \(optional\)/i), {
      target: { value: 'new@member.co' },
    });
    fireEvent.change(screen.getByLabelText(/invite role/i), {
      target: { value: 'employee' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate invite/i }));

    expect(onCreate).toHaveBeenCalledWith({
      email: 'new@member.co',
      role: 'employee',
    });
  });

  it('does not show the create button to plain users', () => {
    render(
      <InvitesPanel
        invites={invites}
        isAdmin={false}
        callerRole="user"
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        isCreating={false}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /create invite/i }),
    ).not.toBeInTheDocument();
  });
});
