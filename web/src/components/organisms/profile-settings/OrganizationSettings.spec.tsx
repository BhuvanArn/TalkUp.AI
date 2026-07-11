import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrganizationSettings } from './OrganizationSettings';

const useGetMyOrganizationMock = vi.fn();
const useGetMemberDetailMock = vi.fn();

vi.mock('@/hooks/organization/useServices', () => ({
  useGetMyOrganization: () => useGetMyOrganizationMock(),
  useGetMemberDetail: (orgId: string, userId: string | null) =>
    useGetMemberDetailMock(orgId, userId),
}));

const org = {
  organization_id: 'org-1',
  organization_name: 'Acme Corporation',
  profile_picture: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const orgQuery = (
  overrides: Partial<{
    data: unknown;
    isPending: boolean;
    isError: boolean;
  }> = {},
) => ({
  data: org,
  isPending: false,
  isError: false,
  ...overrides,
});

const memberQuery = (
  overrides: Partial<{
    data: unknown;
    isPending: boolean;
    isError: boolean;
  }> = {},
) => ({
  data: {
    user_id: 'user-1',
    username: 'jane',
    user_role: 'user',
    email: 'jane@acme.test',
    stats: {
      interviewCount: 7,
      completedCount: 4,
      avgScore: 82,
      lastActivityAt: '2024-06-01T12:00:00.000Z',
    },
    recentInterviews: [],
  },
  isPending: false,
  isError: false,
  ...overrides,
});

describe('OrganizationSettings Component', () => {
  beforeEach(() => {
    useGetMyOrganizationMock.mockReset();
    useGetMemberDetailMock.mockReset();
    useGetMyOrganizationMock.mockReturnValue(orgQuery());
    useGetMemberDetailMock.mockReturnValue(memberQuery());
  });

  it('renders org name, role label, and activity stats for an org member', () => {
    render(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="user"
      />,
    );

    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByTestId('org-role-label')).toHaveTextContent('Member');
    expect(screen.getByTestId('stat-interviews')).toHaveTextContent('7');
    expect(screen.getByTestId('stat-completed')).toHaveTextContent('4');
    expect(screen.getByTestId('stat-avg-score')).toHaveTextContent('82');
  });

  it('maps admin and employee roles to their labels', () => {
    const { rerender } = render(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="admin"
      />,
    );
    expect(screen.getByTestId('org-role-label')).toHaveTextContent(
      'Administrator',
    );

    rerender(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="employee"
      />,
    );
    expect(screen.getByTestId('org-role-label')).toHaveTextContent('Employee');
  });

  it('derives two-letter initials from the org name for the avatar fallback', () => {
    useGetMyOrganizationMock.mockReturnValue(
      orgQuery({ data: { ...org, profile_picture: null } }),
    );
    render(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="user"
      />,
    );
    expect(screen.getByText('AC')).toBeInTheDocument();
  });

  it('handles all-zero / null stats gracefully', () => {
    useGetMemberDetailMock.mockReturnValue(
      memberQuery({
        data: {
          user_id: 'user-1',
          username: 'jane',
          user_role: 'user',
          email: null,
          stats: {
            interviewCount: 0,
            completedCount: 0,
            avgScore: null,
            lastActivityAt: null,
          },
          recentInterviews: [],
        },
      }),
    );

    render(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="user"
      />,
    );

    expect(screen.getByTestId('stat-interviews')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-completed')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-avg-score')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-last-activity')).toHaveTextContent('—');
  });

  it('degrades to zeros when the member-detail request has no data yet', () => {
    useGetMemberDetailMock.mockReturnValue(
      memberQuery({ data: undefined, isPending: true }),
    );

    render(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="user"
      />,
    );

    // Org still renders; stats fall back to zeros rather than blocking.
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByTestId('stat-interviews')).toHaveTextContent('0');
  });

  it('shows a friendly message when the stats request errors (e.g. 403)', () => {
    useGetMemberDetailMock.mockReturnValue(
      memberQuery({ data: undefined, isError: true }),
    );

    render(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="user"
      />,
    );

    expect(screen.getByTestId('org-stats-unavailable')).toBeInTheDocument();
    // Org affiliation still renders even when stats fail.
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
  });

  it('renders a loading state while the organization is pending', () => {
    useGetMyOrganizationMock.mockReturnValue(
      orgQuery({ data: undefined, isPending: true }),
    );

    render(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="user"
      />,
    );

    expect(screen.getByTestId('org-loading')).toBeInTheDocument();
  });

  it('renders an error state when the organization fails to load', () => {
    useGetMyOrganizationMock.mockReturnValue(
      orgQuery({ data: undefined, isError: true }),
    );

    render(
      <OrganizationSettings
        organizationId="org-1"
        userId="user-1"
        userRole="user"
      />,
    );

    expect(screen.getByTestId('org-error')).toBeInTheDocument();
  });
});
