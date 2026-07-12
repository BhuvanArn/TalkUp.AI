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

  it('saves the picked date from the unset state', () => {
    render(
      <InterviewDatePill
        applicationId="app-1"
        interviewAt={null}
        topicsCount={4}
      />,
    );
    // Unset pill shows the prompt and a full-bleed date input as the hit target.
    expect(screen.getByText(/add interview date/i)).toBeInTheDocument();
    const input = screen.getByLabelText('Interview date');
    fireEvent.change(input, { target: { value: '2026-07-26' } });
    expect(mockMutate).toHaveBeenCalledWith({
      applicationId: 'app-1',
      interviewAt: new Date(2026, 6, 26).toISOString(),
    });
  });

  it('opening the picker never throws showPicker gesture errors', () => {
    // Regression: showPicker() must be called from the click gesture, not a ref
    // (which threw "requires a user gesture"). jsdom has no showPicker, so the
    // guarded call must simply no-op rather than crash.
    render(
      <InterviewDatePill
        applicationId="app-1"
        interviewAt={null}
        topicsCount={4}
      />,
    );
    expect(() =>
      fireEvent.click(screen.getByText(/add interview date/i)),
    ).not.toThrow();
  });
});
