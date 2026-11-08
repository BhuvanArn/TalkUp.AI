import type { ParseKeys } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';

const SCORES: { labelKey: ParseKeys<'landing'>; value: number }[] = [
  { labelKey: 'verbalMock.scores.clarity', value: 68 },
  { labelKey: 'verbalMock.scores.politeness', value: 91 },
  { labelKey: 'verbalMock.scores.vocabulary', value: 63 },
];

/** Unquoted, like the tics listed by the real panel. */
const TICS = ['du coup', 'en fait', 'voilà'];

/**
 * Static picture of the live verbal analysis panel shown during a voice
 * simulation. Exposed as a single labelled image. The transcript lines stay
 * in French because simulations are held in French. Not the real
 * `VerbalAnalysisPanel`: it is fed by the live socket and uses raw Tailwind
 * colors that do not follow the dark theme.
 */
const VerbalPanelMock = () => {
  const { t } = useTranslation('landing');
  return (
    <div
      role="img"
      aria-label={t('verbalMock.label')}
      className="min-w-0 rounded-2xl border border-border bg-background p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-base font-semibold text-text">
          {t('verbalMock.title')}
        </span>
        <span className="font-display text-4xl font-extrabold leading-none tabular-nums text-text">
          74
          <small className="ml-1 font-body text-xs font-normal text-text-weaker">
            {t('verbalMock.outOf')}
          </small>
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {SCORES.map(({ labelKey, value }) => (
          <div
            key={labelKey}
            className="grid grid-cols-[88px_minmax(0,1fr)_28px] items-center gap-2.5 text-[13px] text-text sm:grid-cols-[96px_minmax(0,1fr)_34px]"
          >
            <span>{t(labelKey)}</span>
            <span className="h-2 overflow-hidden rounded bg-surface-raised">
              <span
                className="block h-full rounded bg-accent"
                style={{ width: `${value}%` }}
              />
            </span>
            <span className="tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      <p className="mt-3.5 text-[13px] text-text-weaker">
        <Trans
          ns="landing"
          i18nKey="verbalMock.register"
          components={{ turn: <span className="tabular-nums" /> }}
        />
      </p>

      <div className="mt-3.5 rounded-md bg-warning-weak px-3 py-2.5 text-sm">
        <span className="mb-0.5 block font-display text-xs font-semibold text-warning-active">
          {t('verbalMock.alertTitle')}
        </span>
        <span className="text-text">{t('verbalMock.alert')}</span>
      </div>

      <div className="mt-3.5 rounded-md bg-accent-weak px-3 py-2.5 text-sm text-text">
        <span className="mb-0.5 block font-display text-xs font-semibold text-accent-active">
          {t('verbalMock.tipTitle')}
        </span>
        {t('verbalMock.tip')}
      </div>

      <div className="mt-3.5 text-[13px] text-text-weaker">
        {t('verbalMock.frequentTics')}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TICS.map((tic) => (
          <span
            key={tic}
            lang="fr"
            className="rounded bg-surface-raised px-2 py-[3px] text-xs tabular-nums text-text"
          >
            {tic}
          </span>
        ))}
      </div>

      <div className="mt-3.5 grid gap-2 border-t border-border pt-3 text-sm text-text">
        <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
          <span className="font-display text-xs font-semibold leading-relaxed text-text-weaker">
            {t('verbalMock.ai')}
          </span>
          <span lang="fr">
            Parlez-moi d’une erreur que vous avez commise en projet.
          </span>
        </div>
        <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
          <span className="font-display text-xs font-semibold leading-relaxed text-text-weaker">
            {t('verbalMock.you')}
          </span>
          <span lang="fr">
            Alors en fait, sur mon projet de fin d’année, du coup l’API tombait…
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerbalPanelMock;
