import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NavSelector } from './index';

/**
 * Test suite for the NavSelector component.
 * Verifies that the NavSelector component correctly renders with expanded/collapsed states
 * and handles toggle functionality.
 */
describe('NavSelector Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const mockProps = {
    label: 'My Application',
    color: '#3B82F6',
    isExpanded: false,
    onToggle: vi.fn(),
  };

  /**
   * Test Group: Basic Rendering (Expanded View)
   * Ensures the NavSelector component renders correctly in expanded mode.
   */
  describe('Basic Rendering (Expanded View)', () => {
    it('renders with label in expanded view', () => {
      render(<NavSelector {...mockProps} />);
      expect(screen.getByText('My Application')).toBeInTheDocument();
    });

    it('renders color indicator with correct color', () => {
      const { container } = render(<NavSelector {...mockProps} />);
      const colorIndicator = container.querySelector('[style*="background"]');
      expect(colorIndicator).toHaveStyle({
        background: `${mockProps.color}CC`,
      });
    });

    it('renders toggle button', () => {
      render(<NavSelector {...mockProps} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('shows caret-right icon when not expanded', () => {
      render(<NavSelector {...mockProps} isExpanded={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows caret-down icon when expanded', () => {
      render(<NavSelector {...mockProps} isExpanded={true} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Collapsed View
   * Tests the compact collapsed state.
   */
  describe('Collapsed View', () => {
    it('renders collapsed view without label text', () => {
      render(<NavSelector {...mockProps} isCollapsed={true} />);
      expect(screen.queryByText('My Application')).not.toBeInTheDocument();
    });

    it('renders button with title attribute in collapsed view', () => {
      render(<NavSelector {...mockProps} isCollapsed={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'My Application');
    });

    it('applies correct color in collapsed view', () => {
      render(<NavSelector {...mockProps} isCollapsed={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: `${mockProps.color}CC`,
      });
    });

    it('shows caret icon in collapsed view', () => {
      render(
        <NavSelector {...mockProps} isCollapsed={true} isExpanded={false} />,
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Toggle Functionality
   * Tests the expand/collapse toggle behavior.
   */
  describe('Toggle Functionality', () => {
    it('calls onToggle when clicked in expanded view', () => {
      const onToggle = vi.fn();
      render(<NavSelector {...mockProps} onToggle={onToggle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle when clicked in collapsed view', () => {
      const onToggle = vi.fn();
      render(
        <NavSelector {...mockProps} onToggle={onToggle} isCollapsed={true} />,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle multiple times', () => {
      const onToggle = vi.fn();
      render(<NavSelector {...mockProps} onToggle={onToggle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * Test Group: Visual States
   * Tests different visual states based on isExpanded.
   */
  describe('Visual States', () => {
    it('applies active background when expanded', () => {
      render(<NavSelector {...mockProps} isExpanded={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-surface-sidebar-active');
    });

    it('applies hover background when not expanded', () => {
      render(<NavSelector {...mockProps} isExpanded={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-surface-sidebar-hover');
    });
  });

  /**
   * Test Group: Color Variations
   * Tests different color props.
   */
  describe('Color Variations', () => {
    it('renders with blue color', () => {
      const { container } = render(
        <NavSelector {...mockProps} color="#3B82F6" />,
      );
      const colorIndicator = container.querySelector('[style*="background"]');
      expect(colorIndicator).toHaveStyle({ background: '#3B82F6CC' });
    });

    it('renders with red color', () => {
      const { container } = render(
        <NavSelector {...mockProps} color="#EF4444" />,
      );
      const colorIndicator = container.querySelector('[style*="background"]');
      expect(colorIndicator).toHaveStyle({ background: '#EF4444CC' });
    });

    it('renders with green color', () => {
      const { container } = render(
        <NavSelector {...mockProps} color="#10B981" />,
      );
      const colorIndicator = container.querySelector('[style*="background"]');
      expect(colorIndicator).toHaveStyle({ background: '#10B981CC' });
    });
  });

  /**
   * Test Group: Accessibility
   * Tests accessibility features.
   */
  describe('Accessibility', () => {
    it('renders as a button element', () => {
      render(<NavSelector {...mockProps} />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('has title attribute in collapsed mode for accessibility', () => {
      render(<NavSelector {...mockProps} isCollapsed={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', mockProps.label);
    });
  });

  /**
   * Test Group: Layout Structure
   * Tests the component's layout structure.
   */
  describe('Layout Structure', () => {
    it('has correct flex layout in expanded view', () => {
      render(<NavSelector {...mockProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex', 'justify-between', 'items-center');
    });

    it('has correct dimensions in collapsed view', () => {
      render(<NavSelector {...mockProps} isCollapsed={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-8', 'h-4');
    });

    it('has correct dimensions in expanded view', () => {
      render(<NavSelector {...mockProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full', 'h-8');
    });
  });
});
