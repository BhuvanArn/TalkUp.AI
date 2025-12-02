export interface SwitchButtonProps {
  /* the label of the item that will be on the left of the switch */
  leftLabel: string;
  /* the label of the item that will be on the right of the switch */
  rightLabel: string;
  /* the function that will be called on Switch */
  onSwitch: (view: 'left' | 'right') => void;
  /* set which view is active by default */
  defaultActive?: 'left' | 'right';
  /* set which view is currently active */
  activeView?: 'left' | 'right';
}
