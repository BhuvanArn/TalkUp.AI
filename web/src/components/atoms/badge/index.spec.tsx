import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Badge } from './index';

/**
 * Test suite for the Badge component.
 * Verifies that the Badge component correctly renders with different color variants.
 */
describe('Badge Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  /**
   * Test Group: Basic Rendering
   * Ensures the Badge component renders correctly with default and custom props.
   */
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Badge>New</Badge>);
      const badgeElement = screen.getByText('New');
      expect(badgeElement).toBeInTheDocument();
    });

    it('renders with custom text content', () => {
      const badgeText = 'Featured';
      render(<Badge>{badgeText}</Badge>);
      expect(screen.getByText(badgeText)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Badge className="my-custom-class">Custom</Badge>);
      const badgeElement = screen.getByText('Custom');
      expect(badgeElement).toHaveClass('my-custom-class');
    });
  });

  /**
   * Test Group: Color Variants
   * Tests different color schemes for badges.
   */
  describe('Color Variants', () => {
    it('renders with accent color', () => {
      render(<Badge color="accent">Accent</Badge>);
      const badgeElement = screen.getByText('Accent');
      expect(badgeElement).toBeInTheDocument();
    });

    it('renders with primary color', () => {
      render(<Badge color="primary">Primary</Badge>);
      const badgeElement = screen.getByText('Primary');
      expect(badgeElement).toBeInTheDocument();
    });

    it('renders with success color', () => {
      render(<Badge color="success">Success</Badge>);
      const badgeElement = screen.getByText('Success');
      expect(badgeElement).toBeInTheDocument();
    });

    it('renders with warning color', () => {
      render(<Badge color="warning">Warning</Badge>);
      const badgeElement = screen.getByText('Warning');
      expect(badgeElement).toBeInTheDocument();
    });

    it('renders with error color', () => {
      render(<Badge color="error">Error</Badge>);
      const badgeElement = screen.getByText('Error');
      expect(badgeElement).toBeInTheDocument();
    });

    it('renders with neutral color', () => {
      render(<Badge color="neutral">Neutral</Badge>);
      const badgeElement = screen.getByText('Neutral');
      expect(badgeElement).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Forward Ref
   * Tests that the component properly forwards refs.
   */
  describe('Forward Ref', () => {
    it('forwards ref to div element', () => {
      const ref = vi.fn();
      render(<Badge ref={ref}>Ref Test</Badge>);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });
  });

  /**
   * Test Group: HTML Attributes
   * Tests that additional HTML attributes are properly forwarded.
   */
  describe('HTML Attributes', () => {
    it('forwards additional HTML attributes', () => {
      render(
        <Badge id="test-badge" data-testid="badge-test">
          Test Badge
        </Badge>,
      );
      const badgeElement = screen.getByText('Test Badge');
      expect(badgeElement).toHaveAttribute('id', 'test-badge');
      expect(badgeElement).toHaveAttribute('data-testid', 'badge-test');
    });
  });
});
