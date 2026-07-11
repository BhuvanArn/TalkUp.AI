import type { OrganizationMember } from '@/services/organization/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
    expect(
      screen.queryByRole('button', { name: /remove/i }),
    ).not.toBeInTheDocument();

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

  it('shows a context-appropriate empty message when there are no members', () => {
    // Employee, empty: their list is backend-scoped to user-role members, so
    // an empty table means "no such members yet" — never a filter.
    const { rerender } = render(
      <MembersTable
        members={[]}
        isAdmin={false}
        selectedUserId={null}
        onSelect={vi.fn()}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/no members with the user role yet/i),
    ).toBeInTheDocument();

    // Admin, empty, no filter applied.
    rerender(
      <MembersTable
        members={[]}
        isAdmin={true}
        selectedUserId={null}
        onSelect={vi.fn()}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText(/^no members yet\.$/i)).toBeInTheDocument();
  });

  it('shows the filter empty message when the filter matches no one', () => {
    const employeesOnly: OrganizationMember[] = [
      {
        user_id: 'e1',
        username: 'erin',
        user_role: 'employee',
        interviewCount: 0,
        completedCount: 0,
        avgScore: null,
        lastActivityAt: null,
      },
    ];
    render(
      <MembersTable
        members={employeesOnly}
        isAdmin={true}
        selectedUserId={null}
        onSelect={vi.fn()}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText(/filter by role/i), {
      target: { value: 'user' },
    });
    expect(
      screen.getByText(/no members match this filter yet/i),
    ).toBeInTheDocument();
  });

  it('notifies selection via the View button', () => {
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
    fireEvent.click(screen.getAllByRole('button', { name: /view/i })[0]);
    expect(onSelect).toHaveBeenCalledWith('u1');
  });

  it('marks the selected member via aria-pressed', () => {
    render(
      <MembersTable
        members={members}
        isAdmin={false}
        selectedUserId="u1"
        onSelect={vi.fn()}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    expect(viewButtons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(viewButtons[1]).toHaveAttribute('aria-pressed', 'false');
  });
});
