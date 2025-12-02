import LogoSvg from '@/components/atoms/logo-svg';
import { LogoColor } from '@/components/atoms/logo-svg/types';
import { cn } from '@/utils/cn';

import { logoSizeMap, logoVariants, shouldShowText } from './variants';

export type LogoVariant = 'line' | 'column' | 'no-text';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LogoVariant;
  color?: LogoColor;
}

/**
 * Logo component that renders different variants of the TalkUp logo using CVA.
 *
 * @component
 * @param {Object} props - The component props
 * @param {'line' | 'column' | 'no-text'} [props.variant='line'] - The logo layout variant
 * @param {'primary' | 'accent'} [props.color='primary'] - The color scheme for the logo
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} The logo component
 */
const Logo = ({
  variant = 'line',
  color = 'primary',
  className,
  ...props
}: Props) => {
  const logoSize = logoSizeMap[variant];
  const showText = shouldShowText(variant);

  return (
    <div
      {...props}
      className={cn(logoVariants({ variant }), className)}
      data-testid={`${variant}-logo`}
    >
      <LogoSvg color={color} size={logoSize} />
      {showText && <h1 className={cn(`text-${color}`, 'text-h4')}>TALKUP</h1>}
    </div>
  );
};

export default Logo;
