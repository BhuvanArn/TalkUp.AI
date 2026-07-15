import type { RecruiterPersona } from '@/config/personas';

export interface PersonaPickerModalProps {
  /** Renders nothing when false. */
  isOpen: boolean;
  /**
   * Card highlighted on mount. Defaults to DEFAULT_PERSONA (Sophie). Pass the
   * currently selected persona on the "Change recruiter" path — combine with
   * `key={persona.id}` at the call site so the component remounts and re-reads
   * this initializer instead of keeping a stale highlight across reopens.
   */
  initialHighlight?: RecruiterPersona;
  /** Called with the committed persona. */
  onSelect: (persona: RecruiterPersona) => void;
  /** Esc, scrim click, close button, or Skip. Caller falls back to DEFAULT_PERSONA. */
  onDismiss: () => void;
}
