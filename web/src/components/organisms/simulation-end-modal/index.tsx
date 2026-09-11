import { ConfirmModal } from '@/components/molecules/confirm-modal';

import { SimulationEndModalProps } from './types';

export type { SimulationEndModalMode, SimulationEndModalProps } from './types';

const SAVED_MESSAGE =
  'Your progress is saved: the analyses from this interview stay available.';
const NOT_SAVED_MESSAGE =
  'You have not spoken long enough yet to produce an analysis: nothing will be saved for this interview.';

/**
 * Closing dialog of a simulation — either the guard shown when the user hangs
 * up, or the acknowledgement shown once the interview ends on its own. Both
 * say plainly whether the session was kept.
 */
const SimulationEndModal = ({
  isOpen,
  mode,
  progressSaved,
  onConfirm,
  onCancel,
}: SimulationEndModalProps): React.ReactElement => {
  const isConfirm = mode === 'confirm';
  const progressMessage = progressSaved ? SAVED_MESSAGE : NOT_SAVED_MESSAGE;

  return (
    <ConfirmModal
      isOpen={isOpen}
      title={isConfirm ? 'End the simulation?' : 'Simulation complete'}
      message={
        isConfirm
          ? `The interview will be cut short and your slot released. ${progressMessage}`
          : progressMessage
      }
      confirmLabel={isConfirm ? 'End' : 'Close'}
      cancelLabel="Continue the interview"
      confirmColor={isConfirm ? 'error' : 'accent'}
      icon={isConfirm ? 'warning' : 'info'}
      hideCancel={!isConfirm}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default SimulationEndModal;
