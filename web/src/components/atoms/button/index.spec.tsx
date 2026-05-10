import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Button } from './index';

/**
 * Test suite for the Button component.
 * Verifies that the Button component correctly renders with different variants,
 * colors, sizes, and states using CVA (Class Variance Authority).
 */
describe('Button Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  /**
   * Test Group: Basic Rendering
   * Ensures the Button component renders correctly with default and custom props.
   */
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click Me</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Click Me' });
      expect(buttonElement).toBeInTheDocument();
      expect(buttonElement).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
      );
    });

    it('renders with custom text content', () => {
      const buttonText = 'Submit Form';
      render(<Button>{buttonText}</Button>);
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="my-custom-class">Custom Class</Button>);
      const buttonElement = screen.getByRole('button', {
        name: 'Custom Class',
      });
      expect(buttonElement).toHaveClass('my-custom-class');
    });
  });

  /**
   * Test Group: Variant Rendering
   * Tests different button variants (contained, outlined, text).
   */
  describe('Variant Rendering', () => {
    it('renders contained variant by default', () => {
      render(<Button>Contained</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Contained' });
      expect(buttonElement).toHaveClass('border-transparent', 'text-white');
    });

    it('renders outlined variant', () => {
      render(<Button variant="outlined">Outlined</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Outlined' });
      expect(buttonElement).toHaveClass('border-2', 'bg-transparent');
    });

    it('renders text variant', () => {
      render(<Button variant="text">Text</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Text' });
      expect(buttonElement).toHaveClass('border-transparent', 'bg-transparent');
    });
  });

  /**
   * Test Group: Size Variants
   * Tests different button sizes (sm, md, lg).
   */
  describe('Size Variants', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Medium' });
      expect(buttonElement).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('renders small size', () => {
      render(<Button size="sm">Small</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Small' });
      expect(buttonElement).toHaveClass('h-8', 'px-3', 'text-button-s');
    });

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Large' });
      expect(buttonElement).toHaveClass('h-12', 'px-6', 'py-3', 'text-base');
    });
  });

  /**
   * Test Group: Color Variants
   * Tests different color schemes for buttons.
   */
  describe('Color Variants', () => {
    it('applies primary color by default', () => {
      render(<Button>Primary</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Primary' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('applies accent color', () => {
      render(<Button color="accent">Accent</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Accent' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('applies error color', () => {
      render(<Button color="error">Error</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Error' });
      expect(buttonElement).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Disabled State
   * Tests disabled button behavior and styling.
   */
  describe('Disabled State', () => {
    it('applies disabled state correctly', () => {
      render(<Button disabled>Disabled</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Disabled' });
      expect(buttonElement).toBeDisabled();
      expect(buttonElement).toHaveAttribute('aria-disabled', 'true');
      expect(buttonElement).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Click
        </Button>,
      );
      const buttonElement = screen.getByRole('button', {
        name: 'Disabled Click',
      });
      fireEvent.click(buttonElement);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies disabled styles for contained variant', () => {
      render(
        <Button disabled variant="contained">
          Disabled Contained
        </Button>,
      );
      const buttonElement = screen.getByRole('button', {
        name: 'Disabled Contained',
      });
      expect(buttonElement).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('applies disabled styles for outlined variant', () => {
      render(
        <Button disabled variant="outlined">
          Disabled Outlined
        </Button>,
      );
      const buttonElement = screen.getByRole('button', {
        name: 'Disabled Outlined',
      });
      expect(buttonElement).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  /**
   * Test Group: Loading State
   * Tests loading button behavior and styling.
   */
  describe('Loading State', () => {
    it('applies loading state correctly', () => {
      render(<Button loading>Loading</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Loading' });
      expect(buttonElement).toBeDisabled();
      expect(buttonElement).toHaveAttribute('aria-busy', 'true');
      expect(buttonElement).toHaveClass('!cursor-wait');
    });

    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Loading Click
        </Button>,
      );
      const buttonElement = screen.getByRole('button', {
        name: 'Loading Click',
      });
      fireEvent.click(buttonElement);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies disabled styling when loading', () => {
      render(
        <Button loading color="primary">
          Loading Primary
        </Button>,
      );
      const buttonElement = screen.getByRole('button', {
        name: 'Loading Primary',
      });
      expect(buttonElement).toHaveClass('!cursor-wait');
      expect(buttonElement).toHaveClass('opacity-50');
    });
  });

  /**
   * Test Group: Event Handling
   * Tests click event handling and accessibility.
   */
  describe('Event Handling', () => {
    it('calls onClick when button is clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const buttonElement = screen.getByRole('button', { name: 'Click Me' });
      fireEvent.click(buttonElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onClick is not provided', () => {
      render(<Button>No Handler</Button>);
      const buttonElement = screen.getByRole('button', { name: 'No Handler' });
      expect(() => {
        fireEvent.click(buttonElement);
      }).not.toThrow();
    });

    it('forwards additional HTML attributes', () => {
      render(
        <Button aria-label="test-button" id="test-id" data-testid="button-test">
          Test Button
        </Button>,
      );
      const buttonElement = screen.getByRole('button', { name: 'test-button' });
      expect(buttonElement).toHaveAttribute('aria-label', 'test-button');
      expect(buttonElement).toHaveAttribute('id', 'test-id');
      expect(buttonElement).toHaveAttribute('data-testid', 'button-test');
    });
  });

  /**
   * Test Group: Forward Ref
   * Tests that the component properly forwards refs.
   */
  describe('Forward Ref', () => {
    it('forwards ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  /**
   * Test Group: Accessibility
   * Tests accessibility attributes and ARIA compliance.
   */
  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(<Button>Accessible Button</Button>);
      const buttonElement = screen.getByRole('button');
      expect(buttonElement).toBeInTheDocument();
    });

    it('sets aria-disabled when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const buttonElement = screen.getByRole('button');
      expect(buttonElement).toHaveAttribute('aria-disabled', 'true');
    });

    it('sets aria-busy when loading', () => {
      render(<Button loading>Loading Button</Button>);
      const buttonElement = screen.getByRole('button');
      expect(buttonElement).toHaveAttribute('aria-busy', 'true');
    });
  });
});
