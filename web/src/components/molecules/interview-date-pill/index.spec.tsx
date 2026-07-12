import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InterviewDatePill } from './index';

const mockMutate = vi.fn();

vi.mock('@/services/applications/hooks', () => ({
  useUpdateApplicationInterviewAt: () => ({ mutate: mockMutate }),
}));

describe('InterviewDatePill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-12T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows date, countdown and pace when the interview date is set', () => {
    render(
      <InterviewDatePill
        applicationId="app-1"
        interviewAt="2026-07-26T10:00:00.000Z"
        topicsCount={4}
      />,
    );
    expect(screen.getByText(/26 Jul 2026/)).toBeInTheDocument();
    expect(screen.getByText(/14 days left/)).toBeInTheDocument();
    expect(screen.getByText(/2 topics\/week/)).toBeInTheDocument();
  });

  it('opens the picker from the unset state and saves the picked date', () => {
    render(
      <InterviewDatePill
        applicationId="app-1"
        interviewAt={null}
        topicsCount={4}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /add interview date/i }),
    );
    const input = screen.getByLabelText('Interview date');
    fireEvent.change(input, { target: { value: '2026-07-26' } });
    expect(mockMutate).toHaveBeenCalledWith({
      applicationId: 'app-1',
      interviewAt: new Date(2026, 6, 26).toISOString(),
    });
  });
});
