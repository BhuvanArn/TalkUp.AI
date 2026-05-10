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

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonStyleProps {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  squared?: boolean;
  circled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  keyof ButtonStyleProps
>;

interface ButtonAsButtonProps extends ButtonStyleProps, NativeButtonProps {
  asChild?: false;
  disabled?: boolean;
}

interface ButtonAsChildProps extends ButtonStyleProps {
  asChild: true;
  disabled?: boolean;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsChildProps;
