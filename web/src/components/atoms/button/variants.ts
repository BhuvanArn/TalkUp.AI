import { type VariantProps, cva } from 'class-variance-authority';

export const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-button cursor-pointer',
    'transition-all duration-200 ease-in-out',
    // Keyboard focus: one accent ring for every variant and colour
    // (4.93:1 light, 8.37:1 dark against the page).
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  ],
  {
    variants: {
      variant: {
        contained: 'border-transparent text-on-accent',
        outlined: 'border-2 bg-transparent',
        text: 'border-transparent bg-transparent',
      },
      color: {
        primary: '',
        accent: '',
        black: '',
        white: '',
        success: '',
        warning: '',
        neutral: '',
        error: '',
        sidebar: '',
      },
      size: {
        // Saira at every size (text-button-*), per the design system.
        xs: 'h-6 px-2 py-1 text-button-s border',
        sm: 'h-8 px-3 text-button-s',
        md: 'h-10 px-4 py-2 text-button-m',
        lg: 'h-12 px-6 py-3 text-button-l',
      },
      disabled: {
        true: 'cursor-not-allowed',
        false: '',
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
      squared: {
        true: '',
        false: '',
      },
      circled: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Squared - equal padding on all sides
      {
        squared: true,
        size: 'sm',
        className: 'h-8 w-8 p-0',
      },
      {
        squared: true,
        size: 'md',
        className: 'h-10 w-10 p-0',
      },
      {
        squared: true,
        size: 'lg',
        className: 'h-12 w-12 p-0',
      },
      // Circled - squared + rounded-full
      {
        circled: true,
        size: 'sm',
        className: 'h-8 w-8 p-0 rounded-full',
      },
      {
        circled: true,
        size: 'md',
        className: 'h-10 w-10 p-0 rounded-full',
      },
      {
        circled: true,
        size: 'lg',
        className: 'h-12 w-12 p-0 rounded-full',
      },
      // Contained variants
      {
        variant: 'contained',
        color: 'primary',
        className:
          'bg-primary text-on-accent hover:bg-primary-hover active:bg-primary-active',
      },
      {
        variant: 'contained',
        color: 'accent',
        className:
          'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active',
      },
      {
        variant: 'contained',
        color: 'black',
        className:
          'bg-black text-white hover:bg-black-hover active:bg-black-active',
      },
      {
        variant: 'contained',
        color: 'white',
        className:
          'bg-white text-black hover:bg-white-hover active:bg-white-active',
      },
      {
        variant: 'contained',
        color: 'success',
        className:
          'bg-success text-on-accent hover:bg-success-hover active:bg-success-active',
      },
      {
        variant: 'contained',
        color: 'warning',
        className:
          'bg-warning text-on-accent hover:bg-warning-hover active:bg-warning-active',
      },
      {
        variant: 'contained',
        color: 'neutral',
        className:
          'bg-neutral text-on-accent hover:bg-neutral-hover active:bg-neutral-active',
      },
      {
        variant: 'contained',
        color: 'error',
        className:
          'bg-error text-on-accent hover:bg-error-hover active:bg-error-active',
      },
      // Outlined variants
      {
        variant: 'outlined',
        color: 'primary',
        className:
          'border-primary text-primary hover:border-primary-hover hover:text-primary-hover hover:bg-primary-weaker active:border-primary-active active:text-primary-active active:bg-primary-weak',
      },
      {
        variant: 'outlined',
        color: 'accent',
        className:
          'border-accent text-accent hover:border-accent-hover hover:text-accent-hover hover:bg-accent-weaker active:border-accent-active active:text-accent-active active:bg-accent-weak',
      },
      {
        variant: 'outlined',
        color: 'black',
        className:
          'border-black text-black hover:border-black-hover hover:text-black-hover hover:bg-black-weaker active:border-black-active active:text-black-active active:bg-black-weak',
      },
      {
        variant: 'outlined',
        color: 'white',
        className:
          'border-black text-black hover:border-black-hover hover:text-black-hover hover:bg-black-weaker active:border-black-active active:text-black-active active:bg-black-weak',
      },
      {
        variant: 'outlined',
        color: 'success',
        className:
          'border-success text-success hover:border-success-hover hover:text-success-hover hover:bg-success-weaker active:border-success-active active:text-success-active active:bg-success-weak',
      },
      {
        variant: 'outlined',
        color: 'warning',
        className:
          'border-warning text-warning hover:border-warning-hover hover:text-warning-hover hover:bg-warning-weaker active:border-warning-active active:text-warning-active active:bg-warning-weak',
      },
      {
        variant: 'outlined',
        color: 'neutral',
        className:
          'border-neutral text-neutral hover:border-neutral-hover hover:text-neutral-hover hover:bg-neutral-weaker active:border-neutral-active active:text-neutral-active active:bg-neutral-weak',
      },
      {
        variant: 'outlined',
        color: 'error',
        className:
          'border-error text-error hover:border-error-hover hover:text-error-hover hover:bg-error-weaker active:border-error-active active:text-error-active active:bg-error-weak',
      },
      // Text variants
      {
        variant: 'text',
        color: 'primary',
        className:
          'text-primary hover:text-primary-hover hover:bg-primary-weaker active:text-primary-active active:bg-primary-weak',
      },
      {
        variant: 'text',
        color: 'accent',
        className:
          'text-accent hover:text-accent-hover hover:bg-accent-weaker active:text-accent-active active:bg-accent-weak',
      },
      {
        variant: 'text',
        color: 'black',
        className:
          'text-black hover:text-black-hover hover:bg-black-weaker active:text-black-active active:bg-black-weak',
      },
      {
        variant: 'text',
        color: 'white',
        className:
          'text-black hover:text-black-hover hover:bg-black-weaker active:text-black-active active:bg-black-weak',
      },
      {
        variant: 'text',
        color: 'success',
        className:
          'text-success hover:text-success-hover hover:bg-success-weaker active:text-success-active active:bg-success-weak',
      },
      {
        variant: 'text',
        color: 'warning',
        className:
          'text-warning hover:text-warning-hover hover:bg-warning-weaker active:text-warning-active active:bg-warning-weak',
      },
      {
        variant: 'text',
        color: 'neutral',
        className:
          'text-neutral hover:text-neutral-hover hover:bg-neutral-weaker active:text-neutral-active active:bg-neutral-weak',
      },
      {
        variant: 'text',
        color: 'error',
        className:
          'text-error hover:text-error-hover hover:bg-error-weaker active:text-error-active active:bg-error-weak',
      },
      // Sidebar variants - subtle styling for sidebar buttons
      {
        variant: 'contained',
        color: 'sidebar',
        className:
          'bg-surface-sidebar text-idle hover:bg-surface-sidebar-hover hover:text-active active:bg-surface-sidebar-active active:text-active',
      },
      {
        variant: 'outlined',
        color: 'sidebar',
        className:
          'border-border text-idle hover:border-border-hover hover:text-active hover:bg-surface-sidebar-hover active:text-active active:bg-surface-sidebar-active',
      },
      {
        variant: 'text',
        color: 'sidebar',
        className:
          'text-idle hover:text-active hover:bg-surface-sidebar-hover active:text-active active:bg-surface-sidebar-active',
      },
      // Disabled variants - readable (5.04:1 light, 5.49:1 dark), no hover
      {
        disabled: true,
        variant: 'contained',
        className:
          'bg-disabled hover:bg-disabled active:bg-disabled text-text-disabled hover:text-text-disabled active:text-text-disabled',
      },
      {
        disabled: true,
        variant: 'outlined',
        className:
          'border-border text-text-disabled hover:border-border hover:text-text-disabled hover:bg-transparent active:border-border active:text-text-disabled active:bg-transparent',
      },
      {
        disabled: true,
        variant: 'text',
        className:
          'text-text-disabled hover:text-text-disabled hover:bg-transparent active:text-text-disabled active:bg-transparent',
      },
      // Loading state
      {
        loading: true,
        className: '!cursor-wait relative opacity-75',
      },
    ],
    defaultVariants: {
      variant: 'contained',
      color: 'primary',
      size: 'md',
      disabled: false,
      loading: false,
      squared: false,
      circled: false,
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
