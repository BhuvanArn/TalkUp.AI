import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IconAction } from './index';

/**
 * Test suite for the IconAction component.
 * Verifies that the IconAction component correctly renders with different sizes, colors, and states.
 */
describe('IconAction Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  /**
   * Test Group: Basic Rendering
   * Ensures the IconAction component renders correctly with default and custom props.
   */
  describe('Basic Rendering', () => {
    it('renders with icon prop', () => {
      render(<IconAction icon="times" ariaLabel="Close" />);
      const buttonElement = screen.getByRole('button', { name: 'Close' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with default size (md)', () => {
      render(<IconAction icon="edit" ariaLabel="Edit" />);
      const buttonElement = screen.getByRole('button', { name: 'Edit' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <IconAction
          icon="trash"
          ariaLabel="Delete"
          className="my-custom-class"
        />,
      );
      const buttonElement = screen.getByRole('button', { name: 'Delete' });
      expect(buttonElement).toHaveClass('my-custom-class');
    });
  });

  /**
   * Test Group: Size Variants
   * Tests different icon sizes.
   */
  describe('Size Variants', () => {
    it('renders with xs size', () => {
      render(<IconAction icon="times" size="xs" ariaLabel="Close" />);
      const buttonElement = screen.getByRole('button', { name: 'Close' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with sm size', () => {
      render(<IconAction icon="edit" size="sm" ariaLabel="Edit" />);
      const buttonElement = screen.getByRole('button', { name: 'Edit' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with md size', () => {
      render(<IconAction icon="search" size="md" ariaLabel="Search" />);
      const buttonElement = screen.getByRole('button', { name: 'Search' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with lg size', () => {
      render(<IconAction icon="search" size="lg" ariaLabel="Search" />);
      const buttonElement = screen.getByRole('button', { name: 'Search' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with xl size', () => {
      render(<IconAction icon="search" size="xl" ariaLabel="Search" />);
      const buttonElement = screen.getByRole('button', { name: 'Search' });
      expect(buttonElement).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Color Variants
   * Tests different color schemes.
   */
  describe('Color Variants', () => {
    it('renders with primary color', () => {
      render(<IconAction icon="check" color="primary" ariaLabel="Confirm" />);
      const buttonElement = screen.getByRole('button', { name: 'Confirm' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with accent color', () => {
      render(<IconAction icon="search" color="accent" ariaLabel="Search" />);
      const buttonElement = screen.getByRole('button', { name: 'Search' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with error color', () => {
      render(<IconAction icon="trash" color="error" ariaLabel="Delete" />);
      const buttonElement = screen.getByRole('button', { name: 'Delete' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with success color', () => {
      render(<IconAction icon="check" color="success" ariaLabel="Success" />);
      const buttonElement = screen.getByRole('button', { name: 'Success' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with warning color', () => {
      render(<IconAction icon="warning" color="warning" ariaLabel="Warning" />);
      const buttonElement = screen.getByRole('button', { name: 'Warning' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with text color', () => {
      render(<IconAction icon="edit" color="text" ariaLabel="Edit" />);
      const buttonElement = screen.getByRole('button', { name: 'Edit' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with text-idle color', () => {
      render(<IconAction icon="edit" color="text-idle" ariaLabel="Edit" />);
      const buttonElement = screen.getByRole('button', { name: 'Edit' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with text-weak color', () => {
      render(<IconAction icon="edit" color="text-weak" ariaLabel="Edit" />);
      const buttonElement = screen.getByRole('button', { name: 'Edit' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with text-weakest color', () => {
      render(<IconAction icon="edit" color="text-weakest" ariaLabel="Edit" />);
      const buttonElement = screen.getByRole('button', { name: 'Edit' });
      expect(buttonElement).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Disabled State
   * Tests disabled button behavior.
   */
  describe('Disabled State', () => {
    it('applies disabled state correctly', () => {
      render(<IconAction icon="times" disabled ariaLabel="Close" />);
      const buttonElement = screen.getByRole('button', { name: 'Close' });
      expect(buttonElement).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <IconAction
          icon="trash"
          disabled
          onClick={handleClick}
          ariaLabel="Delete"
        />,
      );
      const buttonElement = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(buttonElement);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  /**
   * Test Group: Event Handling
   * Tests click event handling.
   */
  describe('Event Handling', () => {
    it('calls onClick when button is clicked', () => {
      const handleClick = vi.fn();
      render(<IconAction icon="edit" onClick={handleClick} ariaLabel="Edit" />);
      const buttonElement = screen.getByRole('button', { name: 'Edit' });
      fireEvent.click(buttonElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onClick is not provided', () => {
      render(<IconAction icon="times" ariaLabel="Close" />);
      const buttonElement = screen.getByRole('button', { name: 'Close' });
      expect(() => {
        fireEvent.click(buttonElement);
      }).not.toThrow();
    });
  });

  /**
   * Test Group: Forward Ref
   * Tests that the component properly forwards refs.
   */
  describe('Forward Ref', () => {
    it('forwards ref to button element', () => {
      const ref = vi.fn();
      render(<IconAction icon="times" ref={ref} ariaLabel="Close" />);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  /**
   * Test Group: Accessibility
   * Tests accessibility attributes and ARIA compliance.
   */
  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(<IconAction icon="edit" ariaLabel="Edit item" />);
      const buttonElement = screen.getByRole('button', { name: 'Edit item' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('sets aria-label correctly', () => {
      const ariaLabel = 'Close notification';
      render(<IconAction icon="times" ariaLabel={ariaLabel} />);
      const buttonElement = screen.getByRole('button', { name: ariaLabel });
      expect(buttonElement).toHaveAttribute('aria-label', ariaLabel);
    });

    it('has button type attribute', () => {
      render(<IconAction icon="check" ariaLabel="Confirm" />);
      const buttonElement = screen.getByRole('button', { name: 'Confirm' });
      expect(buttonElement).toHaveAttribute('type', 'button');
    });
  });

  /**
   * Test Group: HTML Attributes
   * Tests that additional HTML attributes are properly forwarded.
   */
  describe('HTML Attributes', () => {
    it('forwards additional HTML attributes', () => {
      render(
        <IconAction
          icon="search"
          ariaLabel="Search"
          id="test-icon-action"
          data-testid="icon-action-test"
        />,
      );
      const buttonElement = screen.getByRole('button', { name: 'Search' });
      expect(buttonElement).toHaveAttribute('id', 'test-icon-action');
      expect(buttonElement).toHaveAttribute('data-testid', 'icon-action-test');
    });
  });
});
