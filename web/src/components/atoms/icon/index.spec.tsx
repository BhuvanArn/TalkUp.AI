import { render, screen } from '@testing-library/react';
import React from 'react';
import { FaUser } from 'react-icons/fa';
import { describe, expect, it, vi } from 'vitest';

import { Icon } from './index';

/**
 * Test suite for the Icon component.
 * Ensures correct rendering, props handling, class application, and error handling.
 */
describe('Icon', () => {
  /**
   * Test Group: Basic Rendering
   */
  describe('Basic Rendering', () => {
    it('renders icon with string name', () => {
      render(<Icon icon="user" />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders icon with React component', () => {
      render(<Icon icon={FaUser} />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('forwards ref to svg element', () => {
      const ref = React.createRef<SVGSVGElement>();
      render(<Icon icon="user" ref={ref} />);
      expect(ref.current).toBeInstanceOf(SVGSVGElement);
    });

    it('applies default size and color when not provided', () => {
      render(<Icon icon="user" />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('w-5');
      expect(svg).toHaveClass('h-5');
      expect(svg).toHaveClass('text-inherit');
    });
  });

  /**
   * Test Group: Size Variants
   */
  describe('Size Variants', () => {
    const sizeClassMap = {
      xs: { width: 'w-3', height: 'h-3' },
      sm: { width: 'w-4', height: 'h-4' },
      md: { width: 'w-5', height: 'h-5' },
      lg: { width: 'w-6', height: 'h-6' },
      xl: { width: 'w-8', height: 'h-8' },
    } as const;

    (['xs', 'sm', 'md', 'lg', 'xl'] as const).forEach((size) => {
      it(`applies correct classes for size: ${size}`, () => {
        render(<Icon icon="user" size={size} />);
        const svg = document.querySelector('svg');
        const classes = sizeClassMap[size];

        expect(svg).toHaveClass(classes.width);
        expect(svg).toHaveClass(classes.height);
      });
    });
  });

  /**
   * Test Group: Color Variants
   */
  describe('Color Variants', () => {
    const colorClassMap = {
      primary: 'text-primary',
      accent: 'text-accent',
      black: 'text-black',
      white: 'text-white',
      success: 'text-success',
      warning: 'text-warning',
      neutral: 'text-neutral',
      error: 'text-error',
      inherit: 'text-inherit',
    } as const;

    (
      [
        'primary',
        'accent',
        'black',
        'white',
        'success',
        'warning',
        'neutral',
        'error',
        'inherit',
      ] as const
    ).forEach((color) => {
      it(`applies correct class for color: ${color}`, () => {
        render(<Icon icon="user" color={color} />);
        const svg = document.querySelector('svg');
        expect(svg).toHaveClass(colorClassMap[color]);
      });
    });
  });

  /**
   * Test Group: Icon Map Integration
   */
  describe('Icon Map Integration', () => {
    const sampleIcons = [
      'home',
      'user',
      'search',
      'bell',
      'heart',
      'edit',
      'trash',
      'plus',
      'minus',
      'check',
      'times',
      'roadmap',
      'settings',
    ] as const;

    sampleIcons.forEach((iconName) => {
      it(`renders ${iconName} icon from icon map`, () => {
        render(<Icon icon={iconName} />);
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  /**
   * Test Group: Props and className
   */
  describe('Props and className', () => {
    it('applies custom className', () => {
      render(<Icon icon="user" className="custom-class" />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('custom-class');
    });

    it('forwards additional SVG attributes', () => {
      render(
        <Icon icon="user" data-testid="icon-test" aria-label="user-icon" />,
      );
      const icon = screen.getByTestId('icon-test');
      expect(icon).toHaveAttribute('aria-label', 'user-icon');
    });

    it('merges custom className with default classes', () => {
      render(<Icon icon="user" className="rotate-90" />);
      const svg = document.querySelector('svg');

      expect(svg).toHaveClass('rotate-90');
      expect(svg).toHaveClass('w-5');
      expect(svg).toHaveClass('h-5');
      expect(svg).toHaveClass('text-inherit');
    });
  });

  /**
   * Test Group: Error Handling
   */
  describe('Error Handling', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('returns null for non-existent icon name', () => {
      const { container } = render(<Icon icon={'non-existent-icon' as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('logs warning for non-existent icon name', () => {
      render(<Icon icon={'non-existent-icon' as any} />);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Icon "non-existent-icon" not found in icon map',
      );
    });

    it('handles undefined icon gracefully', () => {
      const { container } = render(<Icon icon={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });
  });

  /**
   * Test Group: Combined Variants
   */
  describe('Combined Variants', () => {
    it('applies both size and color classes correctly', () => {
      render(<Icon icon="user" size="lg" color="primary" />);
      const svg = document.querySelector('svg');

      expect(svg).toHaveClass('w-6');
      expect(svg).toHaveClass('h-6');
      expect(svg).toHaveClass('text-primary');
    });

    it('combines all props: size, color, and className', () => {
      render(
        <Icon
          icon="heart"
          size="xl"
          color="error"
          className="hover:scale-110"
        />,
      );
      const svg = document.querySelector('svg');

      expect(svg).toHaveClass('w-8');
      expect(svg).toHaveClass('h-8');
      expect(svg).toHaveClass('text-error');
      expect(svg).toHaveClass('hover:scale-110');
    });
  });

  /**
   * Test Group: Edge Cases
   */
  describe('Edge Cases', () => {
    it('handles hyphenated icon names', () => {
      render(<Icon icon="arrow-left" />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles icons with special characters in names', () => {
      render(<Icon icon="check-circle" />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles empty string icon name', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(<Icon icon={'' as any} />);
      expect(container.firstChild).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
