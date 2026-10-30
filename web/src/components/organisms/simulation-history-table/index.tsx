import type { ParseKeys } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * @interface SimulationEntry
 * @description Defines the structure for a single simulation history record.
 */
interface SimulationEntry {
  /** Unique identifier for the simulation. */
  id: number;
  /** Date of the simulation completion (YYYY-MM-DD format). */
  date: string;
  /** Time of the simulation completion (HH:MM format). */
  time: string;
  /** Title or name of the interview/simulation. */
  title: string;
  /** Final score achieved (percentage). */
  scoreFinal: number;
  /** Current status of the simulation. */
  status: 'Completed' | 'In Progress' | 'Cancelled';
}

const MOCK_HISTORY: SimulationEntry[] = [
  {
    id: 1,
    date: '2025-11-30',
    time: '14:30',
    title: 'Tech Interview: React Dev',
    scoreFinal: 88,
    status: 'Completed',
  },
  {
    id: 2,
    date: '2025-11-28',
    time: '10:00',
    title: 'Behavioral Interview',
    scoreFinal: 75,
    status: 'Completed',
  },
  {
    id: 3,
    date: '2025-11-25',
    time: '16:00',
    title: 'Manager Interview',
    scoreFinal: 92,
    status: 'Completed',
  },
  {
    id: 4,
    date: '2025-11-24',
    time: '11:15',
    title: 'Tech Interview: Backend',
    scoreFinal: 81,
    status: 'Completed',
  },
];

const STATUS_KEYS = {
  Completed: 'simulations.history.status.completed',
  'In Progress': 'simulations.history.status.inProgress',
  Cancelled: 'simulations.history.status.cancelled',
} as const satisfies Record<SimulationEntry['status'], ParseKeys<'app'>>;

/**
 * @function SimulationHistoryTable
 * @description Organism component displaying a table of the completed simulation history.
 * Features theme-based styling, dynamic score badges, and hover effects on rows and header/footer.
 * @returns {JSX.Element} The Simulation History Table component.
 */
const SimulationHistoryTable: React.FC = () => {
  const { t } = useTranslation('app');

  return (
    <div className="bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-blue-100">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-label-s text-idle uppercase tracking-wider"
            >
              {t('simulations.history.date')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-label-s text-idle uppercase tracking-wider"
            >
              {t('simulations.history.title')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-label-s text-idle uppercase tracking-wider"
            >
              {t('simulations.history.time')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-label-s text-idle uppercase tracking-wider"
            >
              {t('simulations.history.finalScore')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-label-s text-idle uppercase tracking-wider"
            >
              {t('simulations.history.statusHeader')}
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">{t('simulations.history.action')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border">
          {MOCK_HISTORY.map((simulation) => (
            <tr
              key={simulation.id}
              className="hover:bg-blue-100 transition duration-150 ease-in-out"
            >
              <td className="px-6 py-4 whitespace-nowrap text-body-m font-medium text-active">
                {simulation.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-body-m text-idle">
                {simulation.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-body-m text-idle">
                {simulation.time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-body-s font-semibold">
                <span
                  className={`inline-flex px-2 py-1 leading-none text-body-s rounded-full 
                  ${
                    simulation.scoreFinal >= 80
                      ? 'bg-success-weaker text-success'
                      : simulation.scoreFinal >= 60
                        ? 'bg-warning-weaker text-warning'
                        : 'bg-error-weaker text-error'
                  }`}
                >
                  {simulation.scoreFinal}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-body-m text-idle">
                {t(STATUS_KEYS[simulation.status])}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-body-m font-medium">
                <a
                  href={`/simulations/${simulation.id}/review`}
                  className="text-accent hover:text-accent-hover transition duration-150 ease-in-out font-medium"
                >
                  {t('simulations.history.viewAnalysis')}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Table Footer */}
      <div className="flex justify-between items-center p-4 border-t border-border bg-blue-100">
        <span className="text-body-s text-idle">
          {t('simulations.history.showing', {
            to: MOCK_HISTORY.length,
            total: MOCK_HISTORY.length,
          })}
        </span>
        <button className="text-body-s font-medium text-accent hover:text-accent-hover">
          {t('simulations.history.loadMore')}
        </button>
      </div>
    </div>
  );
};
export default SimulationHistoryTable;
