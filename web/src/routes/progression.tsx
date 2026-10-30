import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import GoalProgressCard from '@/components/molecules/goal-progress-card';
import StatsCard from '@/components/molecules/stats-card';
import SimulationHistoryTable from '@/components/organisms/simulation-history-table';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

/**
 * @interface GlobalStats
 * @description Defines the structure for global statistics displayed on the Progression page.
 */
interface GlobalStats {
  averageScore: number;
  averageScoreChange: number;
  totalSimulations: number;
  totalTime: string;
  overallImprovement: number;
  nextGoal: number;
  targetGoal: number;
}

const MOCK_STATS: GlobalStats = {
  averageScore: 85,
  averageScoreChange: 3,
  totalSimulations: 45,
  totalTime: '45h 32m',
  overallImprovement: 15,
  nextGoal: 75,
  targetGoal: 70,
};

export const Route = createFileRoute('/progression')({
  component: Progression,
});

/**
 * @function Progression
 * @description Main component for the Progression page, displaying stats and history.
 * @returns {JSX.Element} The Progression page component.
 */
function Progression() {
  const { t } = useTranslation('app');

  return (
    <div className="grid grid-rows-[96px_minmax(0,1fr)] px-4 sm:px-8 md:px-16 pt-11 pb-12 gap-11 h-screen w-full min-w-0">
      {/* Page Header (Title and Subtitle) */}
      <div className="w-full min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center w-full min-w-0 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-h1 text-idle">{t('progression.title')}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="text"
              color="black"
              title={t('progression.downloadReport')}
            >
              <Icon icon="download" />
              <span className="hidden sm:inline text-idle text-button-s">
                {t('progression.downloadReport')}
              </span>
            </Button>
          </div>
        </div>
        <p className="text-idle mt-2 text-body-m">
          {t('progression.subtitle')}
        </p>
      </div>

      {/* Main Content Container (using the subtle gray background) */}
      <div className="bg-surface-raised p-8 rounded-[20px] h-full overflow-y-auto">
        {/* Inner Content Area (White background) */}
        <div className="bg-white rounded-[10px] px-6 py-6 h-full flex flex-col gap-6 shadow-lg">
          {/* Section 1: Key Stats Cards */}
          <h2 className="text-h4 text-idle">{t('progression.overview')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatsCard
              title={t('progression.stats.averageScore')}
              value={`${MOCK_STATS.averageScore}%`}
              detail={t('progression.stats.averageScoreDetail', {
                change: MOCK_STATS.averageScoreChange,
              })}
              color="green"
            />
            <StatsCard
              title={t('progression.stats.totalSimulations')}
              value={MOCK_STATS.totalSimulations.toString()}
              detail={t('progression.stats.totalSimulationsDetail')}
              color="blue"
            />
            <StatsCard
              title={t('progression.stats.totalTime')}
              value={MOCK_STATS.totalTime}
              detail={t('progression.stats.totalTimeDetail')}
              color="purple"
            />
            <StatsCard
              title={t('progression.stats.improvement')}
              value={`${MOCK_STATS.overallImprovement}%`}
              detail={t('progression.stats.improvementDetail')}
              color="teal"
            />
            <GoalProgressCard
              title={t('progression.stats.nextGoal')}
              progress={MOCK_STATS.nextGoal}
              target={MOCK_STATS.targetGoal}
            />
          </div>

          {/* Section 2: Simulation History */}
          <h2 className="text-h4 text-idle mt-6">{t('progression.history')}</h2>

          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <SimulationHistoryTable />
          </div>
        </div>
      </div>
    </div>
  );
}
