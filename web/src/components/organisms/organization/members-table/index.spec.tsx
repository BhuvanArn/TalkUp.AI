import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OrganizationMember } from '@/services/organization/types';
import MembersTable from './index';

const members: OrganizationMember[] = [
  {
    user_id: 'u1',
    username: 'alice',
    user_role: 'user',
    interviewCount: 4,
    completedCount: 3,
    avgScore: 72.5,
    lastActivityAt: '2026-07-01T10:00:00Z',
  },
  {
    user_id: 'u2',
    username: 'bob',
    user_role: 'employee',
    interviewCount: 0,
    completedCount: 0,
    avgScore: null,
    lastActivityAt: null,
  },
];

describe('MembersTable', () => {
  it('renders member rows with stats', () => {
    render(
      <MembersTable
        members={members}
        isAdmin={false}
        selectedUserId={null}
        onSelect={vi.fn()}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('72.5')).toBeInTheDocument();
  });

  it('shows the role filter and admin actions only for admins', () => {
    const { rerender } = render(
      <MembersTable
        members={members}
        isAdmin={false}
        selectedUserId={null}
        onSelect={vi.fn()}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText(/filter by role/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();

    rerender(
      <MembersTable
        members={members}
        isAdmin={true}
        selectedUserId={null}
        onSelect={vi.fn()}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/filter by role/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /remove/i }).length).toBe(2);
  });

  it('filters members by role (admin)', () => {
    render(
      <MembersTable
        members={members}
        isAdmin={true}
        selectedUserId={null}
        onSelect={vi.fn()}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText(/filter by role/i), {
      target: { value: 'employee' },
    });
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('notifies selection on row click', () => {
    const onSelect = vi.fn();
    render(
      <MembersTable
        members={members}
        isAdmin={false}
        selectedUserId={null}
        onSelect={onSelect}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('alice'));
    expect(onSelect).toHaveBeenCalledWith('u1');
  });
});
