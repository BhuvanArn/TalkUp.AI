import { Icon } from '@/components/atoms/icon';
import { useTranslation } from 'react-i18next';

import { TranscriptionProps } from './types';

interface TranscriptionAreaProps {
  transcriptions: TranscriptionProps[];
}

const SimulationTranscriptionArea = ({
  transcriptions,
}: TranscriptionAreaProps) => {
  const { t } = useTranslation('app');

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {t('simulations.transcriptions.title')}
      </h2>
      <div className="max-h-96 overflow-y-auto">
        {transcriptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="bg-neutral-weaker rounded-full p-4 mb-3">
              <Icon icon="notes" className="w-8 h-8 text-text-weaker" />
            </div>
            <p className="text-body-md text-text-weaker max-w-xs">
              {t('simulations.transcriptions.empty')}
            </p>
          </div>
        )}
        {transcriptions.map((turn, index) => {
          const alignment = turn.isIA ? 'justify-start' : 'justify-end';
          const bubbleColor = turn.isIA
            ? 'bg-primary-weak text-primary'
            : 'bg-neutral-weaker text-neutral';

          return (
            <div key={index} className={`flex w-full ${alignment} mb-4`}>
              <div
                className={`p-3 rounded-xl shadow-sm max-w-3/4 ${bubbleColor}`}
              >
                <p className="text-sm">
                  <span className="font-semibold bg-accent/80 text-white px-2 py-0.5 rounded-full mr-2">
                    {turn.speaker}
                  </span>
                  {turn.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimulationTranscriptionArea;
