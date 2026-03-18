import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NavLink from './index';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={typeof to === 'string' ? to : '#'} className={className}>
      {children}
    </a>
  ),
}));

describe('NavLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the label and forwards `to` as href on the Link', () => {
    render(<NavLink to="/register" label="Dashboard" />);

    const button = screen.getByRole('button', { name: 'Dashboard' });
    expect(button).toBeInTheDocument();

    const anchor = button.closest('a');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('href', '/register');
    expect(anchor).toHaveClass('w-full');
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
