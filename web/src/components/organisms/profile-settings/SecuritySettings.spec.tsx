import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type AccountSession, SecuritySettings } from './SecuritySettings';

const sessions: AccountSession[] = [
  {
    id: 'a',
    deviceLabel: 'Chrome on Windows',
    location: 'Paris, France',
    lastActive: 'Active now',
    isCurrent: true,
    kind: 'desktop',
  },
  {
    id: 'b',
    deviceLabel: 'Safari on iPhone',
    location: 'Lyon, France',
    lastActive: '3 days ago',
    isCurrent: false,
    kind: 'mobile',
  },
];

describe('SecuritySettings', () => {
  it('renders sessions and password actions', () => {
    render(
      <SecuritySettings
        sessions={sessions}
        onRevokeSession={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Devices & sessions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
    expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    expect(screen.getByText('This device')).toBeInTheDocument();
  });

  it('calls onRevokeSession when Revoke is clicked', () => {
    const onRevoke = vi.fn();
    render(
      <SecuritySettings
        sessions={sessions}
        onRevokeSession={onRevoke}
        onDeleteAccount={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(onRevoke).toHaveBeenCalledWith('b');
  });

  it('opens delete confirmation and calls onDeleteAccount on confirm', () => {
    const onDelete = vi.fn();
    render(
      <SecuritySettings
        sessions={sessions}
        onRevokeSession={vi.fn()}
        onDeleteAccount={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }));
    expect(
      screen.getByRole('heading', { name: /Delete your account/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders data export when onRequestDataExport is provided', () => {
    render(
      <SecuritySettings
        sessions={sessions}
        onRevokeSession={vi.fn()}
        onRequestDataExport={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Request a copy of my data/i }),
    ).toBeInTheDocument();
  });

  it('renders Log out everywhere and calls onLogoutEverywhere after confirm', () => {
    const onLogoutEverywhere = vi.fn();
    render(
      <SecuritySettings
        sessions={sessions}
        onRevokeSession={vi.fn()}
        onLogoutEverywhere={onLogoutEverywhere}
        onDeleteAccount={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Log out everywhere' }));
    expect(
      screen.getByRole('heading', { name: /Log out of other devices/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Sign out other devices' }),
    );
    expect(onLogoutEverywhere).toHaveBeenCalledTimes(1);
  });

  it('disables Log out everywhere when there are no other sessions', () => {
    const onlyCurrent: AccountSession[] = [
      {
        id: 'a',
        deviceLabel: 'Chrome',
        lastActive: 'Active now',
        isCurrent: true,
        kind: 'desktop',
      },
    ];
    render(
      <SecuritySettings
        sessions={onlyCurrent}
        onRevokeSession={vi.fn()}
        onLogoutEverywhere={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Log out everywhere' }),
    ).toBeDisabled();
  });
});
