import { IconName } from './icon-map';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconColor =
  | 'primary'
  | 'accent'
  | 'black'
  | 'white'
  | 'success'
  | 'warning'
  | 'neutral'
  | 'error'
  | 'inherit'
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'grey';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  icon: IconName | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  size?: IconSize;
  color?: IconColor;
  className?: string;
}
