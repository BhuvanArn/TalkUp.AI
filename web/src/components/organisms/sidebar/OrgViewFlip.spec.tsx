import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrgViewFlip } from './OrgViewFlip';

const mockNavigate = vi.fn();
const useAuthStatusMock = vi.fn();
const useNavigationMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/hooks/auth/useServices', () => ({
  useAuthStatus: () => useAuthStatusMock(),
}));

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => useNavigationMock(),
}));

const auth = (
  role: string | null,
  organizationId: string | null = 'org-1',
) => ({
  data: { isAuthenticated: role !== null, role, organizationId },
});

describe('OrgViewFlip', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    useNavigationMock.mockReturnValue({ contextType: 'root' });
  });

  it('renders the flip for an org admin', () => {
    useAuthStatusMock.mockReturnValue(auth('admin'));
    render(<OrgViewFlip />);
    expect(
      screen.getByRole('switch', { name: /organization view/i }),
    ).toBeInTheDocument();
  });

  it('renders the flip for an org employee', () => {
    useAuthStatusMock.mockReturnValue(auth('employee'));
    render(<OrgViewFlip />);
    expect(
      screen.getByRole('switch', { name: /organization view/i }),
    ).toBeInTheDocument();
  });

  it('reflects the current view in the switch state', () => {
    useAuthStatusMock.mockReturnValue(auth('admin'));
    useNavigationMock.mockReturnValue({ contextType: 'organization' });
    render(<OrgViewFlip />);
    expect(
      screen.getByRole('switch', { name: /organization view/i }),
    ).toBeChecked();
  });

  it('does not render for a plain user', () => {
    useAuthStatusMock.mockReturnValue(auth('user'));
    const { container } = render(<OrgViewFlip />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render for a logged-out visitor', () => {
    useAuthStatusMock.mockReturnValue(auth(null, null));
    const { container } = render(<OrgViewFlip />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render for a manager with no organization', () => {
    useAuthStatusMock.mockReturnValue(auth('admin', null));
    const { container } = render(<OrgViewFlip />);
    expect(container).toBeEmptyDOMElement();
  });

  it('flips into the organization view from the normal view', () => {
    useAuthStatusMock.mockReturnValue(auth('admin'));
    useNavigationMock.mockReturnValue({ contextType: 'root' });
    render(<OrgViewFlip />);
    fireEvent.click(screen.getByRole('switch', { name: /organization view/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/organization/members' });
  });

  it('flips back to the normal view from the organization view', () => {
    useAuthStatusMock.mockReturnValue(auth('admin'));
    useNavigationMock.mockReturnValue({ contextType: 'organization' });
    render(<OrgViewFlip />);
    fireEvent.click(screen.getByRole('switch', { name: /organization view/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/applications' });
  });
});
