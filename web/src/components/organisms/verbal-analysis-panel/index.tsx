import { Icon } from '@/components/atoms/icon';
import type { VerbalAnalysisState } from '@/hooks/simulation/useVerbalAnalysis';
import type { ParseKeys } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';

export interface VerbalAnalysisPanelProps {
  analysis: VerbalAnalysisState;
}

/**
 * Score banding aligned with the Red-Amber-Green (RAG) status model and common
 * competency pass marks: >= 70 is treated as competent/good, 50-69 as a
 * borderline pass that needs improvement, and < 50 as failing. These cut-offs
 * mirror widely used academic thresholds (e.g. a 70% "good" mark and a 50%
 * pass mark), so the colors map onto a recognizable real-world scale.
 */
const SCORE_GOOD_THRESHOLD = 70;
const SCORE_WARNING_THRESHOLD = 50;

type ScoreTone = {
  bar: string;
  text: string;
};

function getScoreTone(value: number): ScoreTone {
  if (value >= SCORE_GOOD_THRESHOLD) {
    return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
  }
  if (value >= SCORE_WARNING_THRESHOLD) {
    return { bar: 'bg-amber-500', text: 'text-amber-600' };
  }
  return { bar: 'bg-red-500', text: 'text-red-600' };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone = getScoreTone(clamped);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${tone.text}`}>
          {Math.round(clamped)}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${tone.bar}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

const REGISTER_LABEL_KEYS: Partial<Record<string, ParseKeys<'app'>>> = {
  professional: 'verbalAnalysis.registers.professional',
  neutral: 'verbalAnalysis.registers.neutral',
  informal: 'verbalAnalysis.registers.informal',
  mixed: 'verbalAnalysis.registers.mixed',
  inappropriate: 'verbalAnalysis.registers.inappropriate',
};

export default function VerbalAnalysisPanel({
  analysis,
}: VerbalAnalysisPanelProps) {
  const { t } = useTranslation('app');
  const { latest, aggregate } = analysis;

  if (!latest || !aggregate) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="notifications" size="md" color="accent" />
          <h3 className="text-lg font-bold text-gray-800">
            {t('verbalAnalysis.title')}
          </h3>
        </div>
        <p className="text-sm text-gray-600">{t('verbalAnalysis.empty')}</p>
      </div>
    );
  }

  const turn = latest.turn;
  const registerKey = REGISTER_LABEL_KEYS[turn.speech_register];
  const registerLabel = registerKey ? t(registerKey) : turn.speech_register;

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="notifications" size="md" color="accent" />
          <h3 className="text-lg font-bold text-gray-800">
            {t('verbalAnalysis.title')}
          </h3>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span
            className={`text-3xl font-bold ${getScoreTone(aggregate.avg_overall_score).text}`}
          >
            {Math.round(aggregate.avg_overall_score)}
          </span>
          <span className="text-sm text-gray-500">
            {t('verbalAnalysis.sessionScore')}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <ScoreBar
            label={t('verbalAnalysis.clarity')}
            value={turn.clarity_score}
          />
          <ScoreBar
            label={t('verbalAnalysis.politeness')}
            value={turn.politeness_score}
          />
          <ScoreBar
            label={t('verbalAnalysis.vocabulary')}
            value={turn.vocabulary_score}
          />
        </div>

        <p className="text-sm text-gray-600">
          <Trans
            ns="app"
            i18nKey="verbalAnalysis.register"
            values={{ register: registerLabel, turn: latest.turn_index }}
            components={{ strong: <strong /> }}
          />
        </p>
      </div>

      {turn.warnings.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="notifications" size="sm" color="accent" />
            <h4 className="text-sm font-semibold text-amber-900">
              {t('verbalAnalysis.warnings')}
            </h4>
          </div>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            {turn.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4 bg-white rounded-lg shadow-md border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="check" size="sm" color="accent" />
          <h4 className="text-sm font-semibold text-gray-800">
            {t('verbalAnalysis.liveAdvice')}
          </h4>
        </div>
        <p className="text-sm text-gray-600">
          {turn.advice[0] ?? t('verbalAnalysis.adviceFallback')}
        </p>
        {aggregate.top_tics.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {t('verbalAnalysis.topTics', {
              tics: aggregate.top_tics.join(', '),
            })}
          </p>
        )}
      </div>
    </div>
  );
}
