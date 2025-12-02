import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NavMenu } from './index';

// Mock the NavLink component
vi.mock('@/components/molecules/nav-link', () => ({
  default: ({
    to,
    label,
    isActive,
    isCollapsed,
  }: {
    to: string;
    label: string;
    isActive: boolean;
    isCollapsed: boolean;
  }) => (
    <a
      href={to}
      data-active={isActive}
      data-collapsed={isCollapsed}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </a>
  ),
}));

// Mock the organizeNavigation utility
vi.mock('@/utils/navigation', () => ({
  organizeNavigation: vi.fn((items) => items),
}));

// Mock the router
let mockPathname = '/';
vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => ({
    location: {
      pathname: mockPathname,
    },
  }),
}));

// Helper to render components with mocked router pathname
const renderWithRouter = (ui: any, route = '/') => {
  mockPathname = route;
  return render(ui);
};

/**
 * Test suite for the NavMenu component.
 * Verifies that the NavMenu component correctly renders navigation items and handles active states.
 */
describe('NavMenu Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockPathname = '/';
  });

  const mockNavigationItems = [
    { to: '/home', label: 'Home', icon: 'home' as const },
    { to: '/notes', label: 'Notes', icon: 'notes' as const },
    { to: '/settings', label: 'Settings', icon: 'settings' as const },
  ];

  /**
   * Test Group: Basic Rendering
   * Ensures the NavMenu component renders correctly with navigation items.
   */
  describe('Basic Rendering', () => {
    it('renders navigation items', () => {
      render(<NavMenu items={mockNavigationItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders nav element', () => {
      const { container } = render(<NavMenu items={mockNavigationItems} />);

      const navElement = container.querySelector('nav');
      expect(navElement).toBeInTheDocument();
    });

    it('renders ul with space-y-2 class', () => {
      const { container } = render(<NavMenu items={mockNavigationItems} />);

      const ulElement = container.querySelector('ul');
      expect(ulElement).toHaveClass('space-y-2');
    });

    it('applies custom className to nav element', () => {
      const { container } = render(
        <NavMenu items={mockNavigationItems} className="custom-nav-class" />,
      );

      const navElement = container.querySelector('nav');
      expect(navElement).toHaveClass('custom-nav-class');
    });
  });

  /**
   * Test Group: Active State
   * Tests active state based on current route.
   */
  describe('Active State', () => {
    it('marks current path as active', () => {
      renderWithRouter(<NavMenu items={mockNavigationItems} />, '/home');

      const homeLink = screen.getByText('Home');
      expect(homeLink).toHaveAttribute('data-active', 'true');
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    it('marks nested path as active', () => {
      renderWithRouter(<NavMenu items={mockNavigationItems} />, '/notes/123');

      const notesLink = screen.getByText('Notes');
      expect(notesLink).toHaveAttribute('data-active', 'true');
    });

    it('does not mark inactive paths as active', () => {
      renderWithRouter(<NavMenu items={mockNavigationItems} />, '/home');

      const notesLink = screen.getByText('Notes');
      const settingsLink = screen.getByText('Settings');

      expect(notesLink).toHaveAttribute('data-active', 'false');
      expect(settingsLink).toHaveAttribute('data-active', 'false');
    });
  });

  /**
   * Test Group: Collapsed State
   * Tests collapsed sidebar mode.
   */
  describe('Collapsed State', () => {
    it('passes isCollapsed=false by default', () => {
      renderWithRouter(<NavMenu items={mockNavigationItems} />);

      const homeLink = screen.getByText('Home');
      expect(homeLink).toHaveAttribute('data-collapsed', 'false');
    });

    it('passes isCollapsed=true when prop is set', () => {
      renderWithRouter(<NavMenu items={mockNavigationItems} isCollapsed />);

      const homeLink = screen.getByText('Home');
      expect(homeLink).toHaveAttribute('data-collapsed', 'true');
    });
  });

  /**
   * Test Group: Empty State
   * Tests rendering with no items.
   */
  describe('Empty State', () => {
    it('renders without items', () => {
      const { container } = renderWithRouter(<NavMenu items={[]} />);

      const ulElement = container.querySelector('ul');
      expect(ulElement).toBeInTheDocument();
      expect(ulElement?.children).toHaveLength(0);
    });
  });

  /**
   * Test Group: Multiple Items
   * Tests rendering with multiple navigation items.
   */
  describe('Multiple Items', () => {
    it('renders all items in order', () => {
      const { container } = renderWithRouter(
        <NavMenu items={mockNavigationItems} />,
      );

      const listItems = container.querySelectorAll('li');
      expect(listItems).toHaveLength(3);
    });

    it('assigns unique keys based on "to" prop', () => {
      const { container } = renderWithRouter(
        <NavMenu items={mockNavigationItems} />,
      );

      const listItems = container.querySelectorAll('li');
      listItems.forEach((item, index) => {
        expect(item.querySelector('a')).toHaveAttribute(
          'href',
          mockNavigationItems[index].to,
        );
      });
    });
  });
});
