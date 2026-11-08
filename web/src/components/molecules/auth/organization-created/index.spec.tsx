import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrganizationCreated } from '.';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe('OrganizationCreated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the org name, derived admin username, and admin email', () => {
    render(
      <OrganizationCreated organizationName="Acme" email="admin@acme.io" />,
    );

    expect(
      screen.getByRole('heading', { name: /organization created/i }),
    ).toBeInTheDocument();
    // org name appears in the intro copy
    expect(screen.getAllByText('Acme').length).toBeGreaterThan(0);
    // username mirrors the backend: strip non-alphanumerics, append `admin`
    expect(screen.getByText('Acmeadmin')).toBeInTheDocument();
    // email is shown in the details row and repeated in the instructions
    expect(screen.getAllByText('admin@acme.io').length).toBeGreaterThan(0);
  });

  it('highlights the org name and email inside the sentences', () => {
    render(
      <OrganizationCreated organizationName="Acme" email="admin@acme.io" />,
    );

    expect(screen.getByText(/is ready\./).innerHTML).toBe(
      '<span class="font-medium text-active">Acme</span> is ready. We\'ve created an administrator account for it.',
    );
    expect(screen.getByText(/To manage/).innerHTML).toBe(
      'To manage <span class="font-medium text-active">Acme</span>, verify the admin email and sign in as this administrator. A verification code was sent to <span class="font-medium text-active">admin@acme.io</span>.',
    );
  });

  it('renders markup in the org name and email as text', () => {
    const organizationName = '<strong>Evil</strong> & <br/>Co';
    const email = '<i>admin</i>@evil.test';
    const { container } = render(
      <OrganizationCreated organizationName={organizationName} email={email} />,
    );

    expect(container.querySelector('strong, br, i')).toBeNull();
    expect(screen.getByText(/is ready\./).textContent).toBe(
      `${organizationName} is ready. We've created an administrator account for it.`,
    );
    expect(screen.getByText(/To manage/).textContent).toBe(
      `To manage ${organizationName}, verify the admin email and sign in as this administrator. A verification code was sent to ${email}.`,
    );
  });

  it('derives the username the way the backend does (drops spaces/punctuation)', () => {
    render(
      <OrganizationCreated organizationName="Acme Corp!" email="a@acme.io" />,
    );

    // Not `Acme Corp!_admin`: the backend strips every non-alphanumeric char.
    expect(screen.getByText('AcmeCorpadmin')).toBeInTheDocument();
  });

  it('trims surrounding whitespace before deriving the username', () => {
    render(
      <OrganizationCreated
        organizationName="  Globex  "
        email="  root@globex.io  "
      />,
    );

    expect(screen.getByText('Globexadmin')).toBeInTheDocument();
    expect(screen.getAllByText('root@globex.io').length).toBeGreaterThan(0);
  });

  it('navigates to verify-email carrying the admin email and org redirect', async () => {
    render(
      <OrganizationCreated organizationName="Acme" email="admin@acme.io" />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /verify admin email/i }),
    );

    expect(navigate).toHaveBeenCalledWith({
      to: '/verify-email',
      search: { email: 'admin@acme.io', redirect: '/organization' },
    });
  });

  it('renders a fallback when context is missing', () => {
    render(<OrganizationCreated organizationName="" email="" />);

    expect(
      screen.getByRole('heading', { name: /organization created/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /go to login/i }),
    ).toBeInTheDocument();
    // no verify CTA without an email
    expect(
      screen.queryByRole('button', { name: /verify admin email/i }),
    ).not.toBeInTheDocument();
  });
});
