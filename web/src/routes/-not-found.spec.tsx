import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import NotFoundPage from './-not-found';

const mockBack = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({ history: { back: mockBack } }),
}));

describe('NotFoundPage', () => {
  it('shows the heading and copy', () => {
    render(<NotFoundPage isAuthenticated={false} />);
    expect(
      screen.getByRole('heading', { name: /page not found/i, level: 1 }),
    ).toBeInTheDocument();
  });

  // The sidebar's h1 is gone when it is collapsed, so the page owns its own.
  it.each([false, true])(
    'keeps exactly one h1 when isAuthenticated=%s',
    (isAuthenticated) => {
      render(<NotFoundPage isAuthenticated={isAuthenticated} />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it('sends an anonymous visitor home and to login', () => {
    render(<NotFoundPage isAuthenticated={false} />);
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(
      screen.queryByRole('button', { name: /go back/i }),
    ).not.toBeInTheDocument();
  });

  it('sends an authed user to applications and offers going back', () => {
    render(<NotFoundPage isAuthenticated />);
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute(
      'href',
      '/applications',
    );
    expect(
      screen.getByRole('button', { name: /go back/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /log in/i }),
    ).not.toBeInTheDocument();
  });

  it('goes back through router history when asked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    render(<NotFoundPage isAuthenticated />);
    await userEvent.click(screen.getByRole('button', { name: /go back/i }));
    expect(mockBack).toHaveBeenCalledOnce();
  });

  it('shows the logo only for anonymous visitors', () => {
    const { rerender } = render(<NotFoundPage isAuthenticated={false} />);
    expect(screen.getByTestId('not-found-logo')).toBeInTheDocument();
    rerender(<NotFoundPage isAuthenticated />);
    expect(screen.queryByTestId('not-found-logo')).not.toBeInTheDocument();
  });
});
