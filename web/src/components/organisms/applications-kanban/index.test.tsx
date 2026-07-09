import type { Application } from '@/services/applications/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApplicationsKanban } from './index';

const noop = () => undefined;

const make = (id: string, status: Application['status']): Application => ({
  applicationId: id,
  companyName: `Co ${id}`,
  jobTitle: 'Role',
  status,
  offerUrl: null,
  offerDetails: null,
  cvDetails: null,
  appliedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-08T00:00:00.000Z',
});

describe('ApplicationsKanban', () => {
  it('groups applications into their status columns with counters', () => {
    render(
      <ApplicationsKanban
        applications={[
          make('a1', 'sent'),
          make('a2', 'interview'),
          make('a3', 'interview'),
        ]}
        pendingIds={new Set()}
        onStatusChange={noop}
        onDelete={noop}
        onOpenTraining={noop}
      />,
    );
    expect(screen.getByText('Envoyée')).toBeInTheDocument();
    const interviewColumn = screen.getByTestId('kanban-column-interview');
    expect(interviewColumn).toHaveTextContent('Co a2');
    expect(interviewColumn).toHaveTextContent('Co a3');
    expect(interviewColumn).toHaveTextContent('2');
  });

  it('shows an empty hint in columns without applications', () => {
    render(
      <ApplicationsKanban
        applications={[make('a1', 'sent')]}
        pendingIds={new Set()}
        onStatusChange={noop}
        onDelete={noop}
        onOpenTraining={noop}
      />,
    );
    expect(screen.getByTestId('kanban-column-accepted')).toHaveTextContent(
      'Déposez une carte ici',
    );
  });
});
