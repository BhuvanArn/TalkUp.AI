import { changeLanguage } from '@/i18n';
import type { OrganizationDetails } from '@/services/organization/types';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrgSettings from './index';

const org: OrganizationDetails = {
  organization_id: 'org-1',
  organization_name: 'Acme Corporation',
  profile_picture: null,
  created_at: '2024-03-15T12:00:00Z',
  updated_at: '2024-03-15T12:00:00Z',
  members: [
    {
      user_id: 'u1',
      username: 'alice',
      user_role: 'admin',
      interviewCount: 0,
      completedCount: 0,
      avgScore: null,
      lastActivityAt: null,
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
  ],
};

describe('OrgSettings', () => {
  afterEach(async () => {
    await act(() => changeLanguage('en'));
    localStorage.clear();
  });

  it('shows the member counts and creation date', () => {
    render(<OrgSettings org={org} onSave={vi.fn()} isSaving={false} />);
    expect(screen.getByText('2 members')).toBeInTheDocument();
    expect(screen.getByText('1 employee')).toBeInTheDocument();
    expect(screen.getByText('0 users')).toBeInTheDocument();
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
  });

  it('saves a renamed organization', () => {
    const onSave = vi.fn();
    render(<OrgSettings org={org} onSave={onSave} isSaving={false} />);
    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: { value: 'Acme Labs' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).toHaveBeenCalledWith({ OrganizationName: 'Acme Labs' });
  });

  it('renders the counts, date and hints in French', async () => {
    await act(() => changeLanguage('fr'));
    render(<OrgSettings org={org} onSave={vi.fn()} isSaving={false} />);
    expect(
      screen.getByText('Paramètres de l’organisation'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 membres')).toBeInTheDocument();
    expect(screen.getByText('1 employé')).toBeInTheDocument();
    // French uses the singular for zero.
    expect(screen.getByText('0 utilisateur')).toBeInTheDocument();
    expect(screen.getByText('15 mars 2024')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nom de l’organisation'), {
      target: { value: 'A' },
    });
    expect(
      screen.getByText('Saisissez au moins deux caractères.'),
    ).toBeInTheDocument();
  });
});
