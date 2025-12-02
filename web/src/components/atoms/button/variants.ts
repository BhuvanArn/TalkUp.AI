import { type VariantProps, cva } from 'class-variance-authority';

export const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md font-medium text-sm cursor-pointer',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none',
  ],
  {
    variants: {
      variant: {
        contained: 'border-transparent text-white',
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
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 py-3 text-base',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
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
          'bg-primary text-white hover:bg-primary-hover active:bg-primary-active focus:ring-2 focus:ring-primary-weak focus:ring-offset-2',
      },
      {
        variant: 'contained',
        color: 'accent',
        className:
          'bg-accent text-white hover:bg-accent-hover active:bg-accent-active focus:ring-2 focus:ring-accent-weak focus:ring-offset-2',
      },
      {
        variant: 'contained',
        color: 'black',
        className:
          'bg-black text-white hover:bg-black-hover active:bg-black-active focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
      },
      {
        variant: 'contained',
        color: 'white',
        className:
          'bg-white text-black hover:bg-white-hover active:bg-white-active focus:ring-2 focus:ring-gray-300 focus:ring-offset-2',
      },
      {
        variant: 'contained',
        color: 'success',
        className:
          'bg-success text-white hover:bg-success-hover active:bg-success-active focus:ring-2 focus:ring-success-weak focus:ring-offset-2',
      },
      {
        variant: 'contained',
        color: 'warning',
        className:
          'bg-warning text-white hover:bg-warning-hover active:bg-warning-active focus:ring-2 focus:ring-warning-weak focus:ring-offset-2',
      },
      {
        variant: 'contained',
        color: 'neutral',
        className:
          'bg-neutral text-white hover:bg-neutral-hover active:bg-neutral-active focus:ring-2 focus:ring-neutral-weak focus:ring-offset-2',
      },
      {
        variant: 'contained',
        color: 'error',
        className:
          'bg-error text-white hover:bg-error-hover active:bg-error-active focus:ring-2 focus:ring-error-weak focus:ring-offset-2',
      },
      // Outlined variants
      {
        variant: 'outlined',
        color: 'primary',
        className:
          'border-primary text-primary hover:border-primary-hover hover:text-primary-hover hover:bg-primary-weaker active:border-primary-active active:text-primary-active active:bg-primary-weak focus:ring-2 focus:ring-primary-weak focus:ring-offset-2',
      },
      {
        variant: 'outlined',
        color: 'accent',
        className:
          'border-accent text-accent hover:border-accent-hover hover:text-accent-hover hover:bg-accent-weaker active:border-accent-active active:text-accent-active active:bg-accent-weak focus:ring-2 focus:ring-accent-weak focus:ring-offset-2',
      },
      {
        variant: 'outlined',
        color: 'black',
        className:
          'border-black text-black hover:border-black-hover hover:text-black-hover hover:bg-black-weaker active:border-black-active active:text-black-active active:bg-black-weak focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
      },
      {
        variant: 'outlined',
        color: 'white',
        className:
          'border-black text-black hover:border-black-hover hover:text-black-hover hover:bg-black-weaker active:border-black-active active:text-black-active active:bg-black-weak focus:ring-2 focus:ring-gray-300 focus:ring-offset-2',
      },
      {
        variant: 'outlined',
        color: 'success',
        className:
          'border-success text-success hover:border-success-hover hover:text-success-hover hover:bg-success-weaker active:border-success-active active:text-success-active active:bg-success-weak focus:ring-2 focus:ring-success-weak focus:ring-offset-2',
      },
      {
        variant: 'outlined',
        color: 'warning',
        className:
          'border-warning text-warning hover:border-warning-hover hover:text-warning-hover hover:bg-warning-weaker active:border-warning-active active:text-warning-active active:bg-warning-weak focus:ring-2 focus:ring-warning-weak focus:ring-offset-2',
      },
      {
        variant: 'outlined',
        color: 'neutral',
        className:
          'border-neutral text-neutral hover:border-neutral-hover hover:text-neutral-hover hover:bg-neutral-weaker active:border-neutral-active active:text-neutral-active active:bg-neutral-weak focus:ring-2 focus:ring-neutral-weak focus:ring-offset-2',
      },
      {
        variant: 'outlined',
        color: 'error',
        className:
          'border-error text-error hover:border-error-hover hover:text-error-hover hover:bg-error-weaker active:border-error-active active:text-error-active active:bg-error-weak focus:ring-2 focus:ring-error-weak focus:ring-offset-2',
      },
      // Text variants
      {
        variant: 'text',
        color: 'primary',
        className:
          'text-primary hover:text-primary-hover hover:bg-primary-weaker active:text-primary-active active:bg-primary-weak focus:ring-2 focus:ring-primary-weak focus:ring-offset-2',
      },
      {
        variant: 'text',
        color: 'accent',
        className:
          'text-accent hover:text-accent-hover hover:bg-accent-weaker active:text-accent-active active:bg-accent-weak focus:ring-2 focus:ring-accent-weak focus:ring-offset-2',
      },
      {
        variant: 'text',
        color: 'black',
        className:
          'text-black hover:text-black-hover hover:bg-black-weaker active:text-black-active active:bg-black-weak focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
      },
      {
        variant: 'text',
        color: 'white',
        className:
          'text-black hover:text-black-hover hover:bg-black-weaker active:text-black-active active:bg-black-weak focus:ring-2 focus:ring-gray-300 focus:ring-offset-2',
      },
      {
        variant: 'text',
        color: 'success',
        className:
          'text-success hover:text-success-hover hover:bg-success-weaker active:text-success-active active:bg-success-weak focus:ring-2 focus:ring-success-weak focus:ring-offset-2',
      },
      {
        variant: 'text',
        color: 'warning',
        className:
          'text-warning hover:text-warning-hover hover:bg-warning-weaker active:text-warning-active active:bg-warning-weak focus:ring-2 focus:ring-warning-weak focus:ring-offset-2',
      },
      {
        variant: 'text',
        color: 'neutral',
        className:
          'text-neutral hover:text-neutral-hover hover:bg-neutral-weaker active:text-neutral-active active:bg-neutral-weak focus:ring-2 focus:ring-neutral-weak focus:ring-offset-2',
      },
      {
        variant: 'text',
        color: 'error',
        className:
          'text-error hover:text-error-hover hover:bg-error-weaker active:text-error-active active:bg-error-weak focus:ring-2 focus:ring-error-weak focus:ring-offset-2',
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
      // Disabled variants - prevent hover effects
      {
        disabled: true,
        variant: 'contained',
        className:
          'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 active:bg-gray-400 text-gray-600 hover:text-gray-600 active:text-gray-600 focus:ring-0',
      },
      {
        disabled: true,
        variant: 'outlined',
        className:
          'opacity-50 cursor-not-allowed border-gray-300 text-gray-400 hover:border-gray-300 hover:text-gray-400 hover:bg-transparent active:border-gray-300 active:text-gray-400 active:bg-transparent focus:ring-0',
      },
      {
        disabled: true,
        variant: 'text',
        className:
          'opacity-50 cursor-not-allowed text-gray-400 hover:text-gray-400 hover:bg-transparent active:text-gray-400 active:bg-transparent focus:ring-0',
      },
      // Loading state
      {
        loading: true,
        className: '!cursor-wait relative',
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
