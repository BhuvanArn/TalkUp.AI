import { LogoColor } from './types';

interface Props {
  color?: LogoColor;
  size?: number;
  /**
   * Accessible name. Pass it when the mark stands alone (no "TALKUP" text
   * next to it); without it the SVG is decorative and hidden from assistive
   * technology, so a visible wordmark is not announced twice.
   */
  label?: string;
}

/**
 * A component that renders the TalkUp.AI logo as an SVG.
 *
 * @component
 * @param {Object} props - The component props
 * @param {'primary' | 'accent'} [props.color='primary'] - The color of the logo. This is used as a CSS class in the format `fill-${color}`.
 * @param {number} [props.size=100] - The size of the logo in pixels. Applied to both width and height.
 *
 * @returns {JSX.Element} An SVG element representing the TalkUp.AI logo
 *
 * @example
 * // Default usage
 * <LogoSvg />
 *
 * @example
 * // With custom color and size
 * <LogoSvg color="secondary" size={50} />
 */
const LogoSvg = ({ color = 'primary', size = 100, label }: Props) => {
  const fill = `fill-${color}`;

  return (
    <svg
      className={fill}
      width={size}
      height={size}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true, focusable: 'false' })}
      viewBox="0 0 78 75"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0.228027H19.7982C19.226 9.5941 26.3244 17.7565 35.9565 18.8082L38.5759 19.0942V37.7639L36.5265 37.7991C30.4232 37.9041 24.4363 36.1753 19.39 32.8508L19.7499 40.8218C19.782 41.532 19.9013 42.236 20.1053 42.9189C22.4482 50.7606 29.9718 56.0774 38.4018 55.8487L38.5759 55.844C48.0075 56.0682 56.1234 49.4323 57.4715 40.3939L57.8638 37.7639H77.1517C77.1517 58.2773 59.8704 74.9067 38.6776 74.9067C17.3728 74.9067 0 58.1893 0 37.5674V0.228027Z" />
    </svg>
  );
};

export default LogoSvg;
