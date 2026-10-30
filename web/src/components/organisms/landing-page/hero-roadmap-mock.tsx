import { MatchGauge } from '@/components/atoms/match-gauge';
import { PRIORITY_STYLES } from '@/components/molecules/roadmap-topic-card';
import type { RoadmapTopic } from '@/services/applications/types';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

interface PathItem {
  titleKey: ParseKeys<'landing'>;
  detailKey: ParseKeys<'landing'>;
  priority: RoadmapTopic['priority'];
  gap?: boolean;
}

const PATH: PathItem[] = [
  {
    titleKey: 'roadmapMock.path.postgres.title',
    detailKey: 'roadmapMock.path.postgres.detail',
    priority: 'HIGH',
    gap: true,
  },
  {
    titleKey: 'roadmapMock.path.unitTests.title',
    detailKey: 'roadmapMock.path.unitTests.detail',
    priority: 'MED',
  },
  {
    titleKey: 'roadmapMock.path.apprenticeship.title',
    detailKey: 'roadmapMock.path.apprenticeship.detail',
    priority: 'LOW',
  },
];

const MATCH_SCORE = 72;

const MockButton = ({
  children,
  primary = false,
}: {
  children: string;
  primary?: boolean;
}) => (
  <span
    className={`inline-flex h-[34px] items-center rounded-md px-3 font-display text-[13px] font-semibold ${
      primary ? 'bg-accent text-white' : 'border border-border-strong text-text'
    }`}
  >
    {children}
  </span>
);

/**
 * Static picture of the roadmap screen for one application. Purely visual:
 * exposed as a single image so its fake tabs and buttons are never focusable
 * or announced as controls. The gauge and priority chips are the app's own
 * (`MatchGauge`, `PRIORITY_STYLES`) so the picture follows the product; the
 * timeline layout is simplified to fit the hero.
 */
const HeroRoadmapMock = () => {
  const { t } = useTranslation('landing');
  return (
    <div
      role="img"
      aria-label={t('roadmapMock.label')}
      className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--color-primary)_35%,transparent)]"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-[18px]">
        <div className="min-w-0">
          <div className="text-[13px] text-text-weaker">
            {t('roadmapMock.company')}
          </div>
          <div className="mt-0.5 font-display text-lg font-semibold leading-tight text-text">
            {t('roadmapMock.role')}
          </div>
          <span className="mt-2.5 inline-flex flex-wrap gap-x-2 gap-y-1 rounded-full bg-accent-weak px-2.5 py-[5px] text-xs tabular-nums text-accent-active">
            <span>{t('roadmapMock.interviewDate')}</span>
            <span>{t('roadmapMock.daysLeft')}</span>
            <span>{t('roadmapMock.pace')}</span>
          </span>
        </div>
        <div className="flex-none">
          <MatchGauge score={MATCH_SCORE} />
        </div>
      </div>

      <div className="flex gap-[18px] border-b border-border px-5 text-[13px]">
        <span className="py-2.5 font-medium text-text shadow-[inset_0_-2px_0_var(--color-accent)]">
          {t('roadmapMock.pathTab')}
        </span>
        <span className="py-2.5 text-text-weaker">
          {t('roadmapMock.talkingPointsTab')}
        </span>
      </div>

      <div className="px-5 pt-1.5 pb-2">
        {PATH.map((item, index) => (
          <div
            key={item.titleKey}
            className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-3.5 py-3"
          >
            <span
              className={`absolute left-1.5 w-0.5 bg-border ${
                index === 0 ? 'top-[18px] bottom-0' : 'inset-y-0'
              }`}
            />
            <span className="relative mt-1 size-3.5 rounded-full border-2 border-border-strong bg-background" />
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[15px] font-medium text-text">
                {t(item.titleKey)}
                <span
                  className={`rounded px-1.5 py-[3px] text-[11px] font-semibold leading-none ${PRIORITY_STYLES[item.priority]}`}
                >
                  {t(`roadmapMock.priority.${item.priority}`)}
                </span>
                {item.gap && (
                  <span className="rounded border border-border px-1.5 py-0.5 text-[11px] leading-none text-text-weaker">
                    {t('roadmapMock.gap')}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[13px] text-text-weaker">
                {t(item.detailKey)}
              </div>
            </div>
          </div>
        ))}
        <div className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-3.5 py-3">
          <span className="absolute inset-y-0 left-1.5 w-0.5 bg-border" />
          <span className="relative mt-1 size-3.5 rounded-full border-2 border-text bg-text" />
          <div className="text-[15px] font-medium text-text">
            {t('roadmapMock.jobReady')}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border bg-surface px-5 py-3.5">
        <MockButton primary>{t('roadmapMock.startSimulation')}</MockButton>
        <MockButton>{t('roadmapMock.notes')}</MockButton>
        <MockButton>{t('roadmapMock.sources')}</MockButton>
      </div>
    </div>
  );
};

export default HeroRoadmapMock;
