import type { RecruiterPersona } from '@/config/personas';

export interface PersonaPickerModalProps {
  /** Renders nothing when false. */
  isOpen: boolean;
  /** Called with the committed persona. */
  onSelect: (persona: RecruiterPersona) => void;
  /** Esc, scrim click, close button, or Skip. Caller falls back to DEFAULT_PERSONA. */
  onDismiss: () => void;
}
