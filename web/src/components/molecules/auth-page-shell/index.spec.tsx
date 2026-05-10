import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AuthPageShell from './index';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe('AuthPageShell', () => {
  it('renders children', () => {
    render(
      <AuthPageShell>
        <p>Form content</p>
      </AuthPageShell>,
    );
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('renders a back-to-home link pointing to /', () => {
    render(
      <AuthPageShell>
        <span />
      </AuthPageShell>,
    );
    const back = screen.getByRole('link', { name: /back to home/i });
    expect(back).toHaveAttribute('href', '/');
  });

  it('renders a logo link pointing to /', () => {
    render(
      <AuthPageShell>
        <span />
      </AuthPageShell>,
    );
    const logo = screen.getByRole('link', { name: /talkup home/i });
    expect(logo).toHaveAttribute('href', '/');
  });
});
