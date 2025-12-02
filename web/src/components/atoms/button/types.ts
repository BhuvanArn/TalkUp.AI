export type ButtonVariant = 'contained' | 'outlined' | 'text';
export type ButtonColor =
  | 'primary'
  | 'accent'
  | 'black'
  | 'white'
  | 'success'
  | 'warning'
  | 'neutral'
  | 'error'
  | 'sidebar';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  squared?: boolean;
  circled?: boolean;
  children?: React.ReactNode;
}
