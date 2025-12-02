import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Logo from './index';

/**
 * Test suite for the Logo component using CVA (Class Variance Authority).
 * Verifies that the component correctly renders different layout variants,
 * applies proper styling, handles color props, and manages text display logic.
 * This replaces the previous implementation that used separate variant files.
 */
describe('Logo Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  /**
   * Test Group: Variant Rendering
   * Verifies that the Logo component correctly renders different layout variants
   * using the CVA system and applies appropriate CSS classes for each variant.
   */
  describe('Variant Rendering', () => {
    it('renders default variant (line)', () => {
      const { getByTestId } = render(<Logo />);
      const lineLogo = getByTestId('line-logo');
      expect(lineLogo).toBeInTheDocument();
      expect(lineLogo).toHaveClass(
        'flex',
        'items-center',
        'justify-start',
        'gap-3',
        'h-8',
        'flex-row',
      );
    });

    it('renders line variant', () => {
      const { getByTestId } = render(<Logo variant="line" />);
      const lineLogo = getByTestId('line-logo');
      expect(lineLogo).toBeInTheDocument();
      expect(lineLogo).toHaveClass(
        'flex',
        'items-center',
        'justify-start',
        'gap-3',
        'h-8',
        'flex-row',
      );

      const logoText = lineLogo.querySelector('h1');
      expect(logoText).toBeInTheDocument();
      expect(logoText).toHaveTextContent('TALKUP');
    });

    it('renders column variant', () => {
      const { getByTestId } = render(<Logo variant="column" />);
      const columnLogo = getByTestId('column-logo');
      expect(columnLogo).toBeInTheDocument();
      expect(columnLogo).toHaveClass(
        'flex',
        'items-center',
        'justify-start',
        'gap-2',
        'h-20',
        'flex-col',
      );

      const logoText = columnLogo.querySelector('h1');
      expect(logoText).toBeInTheDocument();
      expect(logoText).toHaveTextContent('TALKUP');
    });

    it('renders no-text variant', () => {
      const { getByTestId } = render(<Logo variant="no-text" />);
      const noTextLogo = getByTestId('no-text-logo');
      expect(noTextLogo).toBeInTheDocument();
      expect(noTextLogo).toHaveClass(
        'flex',
        'items-center',
        'justify-start',
        'h-10',
      );

      const logoText = noTextLogo.querySelector('h1');
      expect(logoText).not.toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { getByTestId } = render(
        <Logo variant="line" className="custom-class" />,
      );
      const logoContainer = getByTestId('line-logo');
      expect(logoContainer).toHaveClass(
        'custom-class',
        'flex',
        'items-center',
        'justify-start',
      );
    });
  });

  /**
   * Test Group: Logo Size Mapping
   * Tests that the correct SVG logo size is applied based on the variant.
   * Each variant has a predefined size to ensure consistent visual hierarchy.
   */
  describe('Logo Size Mapping', () => {
    it('uses correct logo size for line variant', () => {
      const { getByTestId } = render(<Logo variant="line" />);
      const logoSvg = getByTestId('line-logo').querySelector('svg');
      expect(logoSvg).toHaveAttribute('width', '32');
      expect(logoSvg).toHaveAttribute('height', '32');
    });

    it('uses correct logo size for column variant', () => {
      const { getByTestId } = render(<Logo variant="column" />);
      const logoSvg = getByTestId('column-logo').querySelector('svg');
      expect(logoSvg).toHaveAttribute('width', '32');
      expect(logoSvg).toHaveAttribute('height', '32');
    });

    it('uses correct logo size for no-text variant', () => {
      const { getByTestId } = render(<Logo variant="no-text" />);
      const logoSvg = getByTestId('no-text-logo').querySelector('svg');
      expect(logoSvg).toHaveAttribute('width', '32');
      expect(logoSvg).toHaveAttribute('height', '32');
    });
  });

  /**
   * Test Group: Color Prop Handling
   * Ensures that color props are correctly applied to both the SVG logo
   * and text elements across all variants.
   */
  describe('Color Prop Handling', () => {
    it('applies default color (primary) to line variant', () => {
      const { getByTestId } = render(<Logo variant="line" />);
      const logoText = getByTestId('line-logo').querySelector('h1');
      const logoSvg = getByTestId('line-logo').querySelector('svg');
      expect(logoText).toHaveClass('text-primary');
      expect(logoSvg).toHaveClass('fill-primary');
    });

    it('applies accent color to line variant', () => {
      const { getByTestId } = render(<Logo variant="line" color="accent" />);
      const logoText = getByTestId('line-logo').querySelector('h1');
      const logoSvg = getByTestId('line-logo').querySelector('svg');
      expect(logoText).toHaveClass('text-accent');
      expect(logoSvg).toHaveClass('fill-accent');
    });

    it('applies primary color to column variant', () => {
      const { getByTestId } = render(<Logo variant="column" />);
      const logoText = getByTestId('column-logo').querySelector('h1');
      const logoSvg = getByTestId('column-logo').querySelector('svg');
      expect(logoText).toHaveClass('text-primary');
      expect(logoSvg).toHaveClass('fill-primary');
    });

    it('applies accent color to no-text variant', () => {
      const { getByTestId } = render(<Logo variant="no-text" color="accent" />);
      const logoSvg = getByTestId('no-text-logo').querySelector('svg');
      expect(logoSvg).toHaveClass('fill-accent');
    });
  });

  /**
   * Test Group: Text Display Logic
   * Verifies the conditional text rendering based on variant type.
   * The 'no-text' variant should not display text, while others should.
   */
  describe('Text Display Logic', () => {
    it('shows text for line variant', () => {
      const { getByTestId } = render(<Logo variant="line" />);
      const logoText = getByTestId('line-logo').querySelector('h1');
      expect(logoText).toBeInTheDocument();
      expect(logoText).toHaveTextContent('TALKUP');
      expect(logoText).toHaveClass('text-primary', 'text-h4');
    });

    it('shows text for column variant', () => {
      const { getByTestId } = render(<Logo variant="column" />);
      const logoText = getByTestId('column-logo').querySelector('h1');
      expect(logoText).toBeInTheDocument();
      expect(logoText).toHaveTextContent('TALKUP');
      expect(logoText).toHaveClass('text-primary', 'text-h4');
    });

    it('does not show text for no-text variant', () => {
      const { getByTestId } = render(<Logo variant="no-text" />);
      const logoText = getByTestId('no-text-logo').querySelector('h1');
      expect(logoText).not.toBeInTheDocument();
    });
  });

  /**
   * Test Group: Additional HTML Attributes
   * Tests that additional HTML attributes and accessibility props
   * are properly forwarded to the logo container element.
   */
  describe('Additional HTML Attributes', () => {
    it('passes additional props to the container', () => {
      const { getByTestId } = render(
        <Logo variant="line" id="custom-id" data-custom="test" />,
      );
      const logoContainer = getByTestId('line-logo');
      expect(logoContainer).toHaveAttribute('id', 'custom-id');
      expect(logoContainer).toHaveAttribute('data-custom', 'test');
    });

    it('applies aria attributes correctly', () => {
      const { getByTestId } = render(
        <Logo variant="column" aria-label="Company Logo" />,
      );
      const logoContainer = getByTestId('column-logo');
      expect(logoContainer).toHaveAttribute('aria-label', 'Company Logo');
    });
  });
});
