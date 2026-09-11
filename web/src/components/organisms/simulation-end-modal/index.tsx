import { ConfirmModal } from '@/components/molecules/confirm-modal';

import { SimulationEndModalProps } from './types';

export type { SimulationEndModalMode, SimulationEndModalProps } from './types';

const SAVED_MESSAGE =
  'Votre progression est enregistrée : les analyses de cet entretien restent disponibles.';
const NOT_SAVED_MESSAGE =
  "Vous n'avez pas encore parlé assez longtemps pour produire une analyse : rien ne sera enregistré pour cet entretien.";

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
      title={isConfirm ? 'Terminer la simulation ?' : 'Simulation terminée'}
      message={
        isConfirm
          ? `L'entretien sera interrompu et votre créneau libéré. ${progressMessage}`
          : progressMessage
      }
      confirmLabel={isConfirm ? 'Terminer' : 'Fermer'}
      cancelLabel="Continuer l'entretien"
      confirmColor={isConfirm ? 'error' : 'accent'}
      icon={isConfirm ? 'warning' : 'info'}
      hideCancel={!isConfirm}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default SimulationEndModal;
