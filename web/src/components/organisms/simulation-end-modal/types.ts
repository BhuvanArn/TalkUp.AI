/**
 * `confirm` is the hang-up guard: the interview is still live and the user is
 * asked whether to end it. `summary` is shown once the interview has ended on
 * its own, so there is nothing left to cancel.
 */
export type SimulationEndModalMode = 'confirm' | 'summary';

export interface SimulationEndModalProps {
  isOpen: boolean;
  mode: SimulationEndModalMode;
  /**
   * Whether the session produced a verbal analysis. The server upserts one on
   * every turn, so this is what actually decides whether anything was kept.
   */
  progressSaved: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
