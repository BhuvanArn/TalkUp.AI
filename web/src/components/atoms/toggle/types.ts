export interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  accentColor?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}
