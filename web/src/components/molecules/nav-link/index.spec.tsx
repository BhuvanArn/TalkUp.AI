import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NavLink from './index';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: any) => (
    <a href={typeof to === 'string' ? to : '#'} {...rest}>
      {children}
    </a>
  ),
}));

describe('NavLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a single link (no nested button) that forwards `to` as href', () => {
    render(<NavLink to="/register" label="Dashboard" />);

    const anchor = screen.getByRole('link', { name: 'Dashboard' });
    expect(anchor).toHaveAttribute('href', '/register');
    expect(anchor).toHaveClass('w-full');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows an accent focus ring on keyboard focus', () => {
    render(<NavLink to="/home" label="Home" />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass(
      'focus-ring',
    );
  });

  it('renders an icon when `icon` prop is provided', () => {
    render(<NavLink to="/home" label="Home" icon="user" />);

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('forwards iconProps to the Icon component', () => {
    render(
      <NavLink
        to="/home"
        label="Home"
        icon="user"
        iconProps={{ 'data-testid': 'nav-icon' } as any}
      />,
    );

    const icon = screen.getByTestId('nav-icon');
    expect(icon).toBeInTheDocument();
  });
});
