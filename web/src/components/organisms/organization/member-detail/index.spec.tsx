import { changeLanguage } from '@/i18n';
import type { OrganizationMemberDetail } from '@/services/organization/types';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MemberDetail from './index';

const detail: OrganizationMemberDetail = {
  user_id: 'u1',
  username: 'alice',
  user_role: 'user',
  email: 'alice@example.com',
  stats: {
    interviewCount: 2,
    completedCount: 1,
    avgScore: 72.5,
    lastActivityAt: '2026-07-01T10:00:00Z',
  },
  recentInterviews: [
    {
      interview_id: 'i1',
      type: 'behavioral',
      status: 'completed',
      score: 72.5,
      created_at: '2026-07-01T09:00:00Z',
      ended_at: '2026-07-01T10:00:00Z',
    },
    {
      interview_id: 'i2',
      type: 'technical',
      status: 'in_progress',
      score: null,
      created_at: '2026-07-02T09:00:00Z',
      ended_at: null,
    },
  ],
};

const renderDetail = () =>
  render(
    <MemberDetail
      isOpen={true}
      detail={detail}
      isLoading={false}
      onClose={vi.fn()}
    />,
  );

/** The value (`<dd>`) next to a stat label (`<dt>`). */
const statValue = (label: string) =>
  screen.getByText(label).closest('div')!.querySelector('dd')!;

/** The score cell (last column) of the recent interview whose type is `type`. */
const interviewScore = (type: string) =>
  screen.getByText(type).closest('li')!.lastElementChild!;

describe('MemberDetail', () => {
  it('formats the average and interview scores in English', () => {
    renderDetail();
    expect(statValue('Average score')).toHaveTextContent(/^72\.5$/);
    expect(interviewScore('behavioral')).toHaveTextContent(/^72\.5$/);
  });

  it('shows the placeholder for a null score', () => {
    renderDetail();
    expect(interviewScore('technical')).toHaveTextContent(/^·$/);
  });

  it('shows the placeholder for a null average score', () => {
    render(
      <MemberDetail
        isOpen={true}
        detail={{ ...detail, stats: { ...detail.stats, avgScore: null } }}
        isLoading={false}
        onClose={vi.fn()}
      />,
    );
    expect(statValue('Average score')).toHaveTextContent(/^·$/);
  });
});

describe('MemberDetail in French', () => {
  afterEach(async () => {
    await act(() => changeLanguage('en'));
    localStorage.clear();
  });

  it('formats the average and interview scores with the French separator', async () => {
    await act(() => changeLanguage('fr'));
    renderDetail();
    expect(screen.getByText('Entretiens récents')).toBeInTheDocument();
    expect(statValue('Score moyen')).toHaveTextContent(/^72,5$/);
    expect(interviewScore('behavioral')).toHaveTextContent(/^72,5$/);
    expect(interviewScore('technical')).toHaveTextContent(/^·$/);
  });
});
