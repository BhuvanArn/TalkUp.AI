import type { Application } from '@/services/applications/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RoadmapSourcesModal } from './index';

const baseApplication: Application = {
  applicationId: 'app-1',
  companyName: 'Datadog',
  jobTitle: 'SRE',
  status: 'sent',
  offerUrl: 'https://example.com/job',
  offerDetails: null,
  cvDetails: {
    desired_job: 'Site Reliability Engineer',
    resume: 'Seasoned infra engineer.',
    experiences: [
      {
        company: 'Acme',
        title: 'DevOps',
        description: 'ran things',
        duration: '2y',
      },
    ],
    education: [{ degree: 'MSc CS', school_name: 'EPITECH', duration: '5y' }],
    technical_skills: ['Kubernetes', 'Go'],
    languages: [{ language: 'English', level: 'C1' }],
  },
  appliedAt: '2026-07-09T00:00:00.000Z',
  interviewAt: null,
  updatedAt: '2026-07-09T00:00:00.000Z',
};

describe('RoadmapSourcesModal', () => {
  it('renders the offer heading and an external link to the offer url', () => {
    render(
      <RoadmapSourcesModal application={baseApplication} onClose={vi.fn()} />,
    );
    expect(screen.getByText('SRE at Datadog')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /open job offer/i });
    expect(link).toHaveAttribute('href', 'https://example.com/job');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('renders the compact CV snapshot with skill and language chips', () => {
    render(
      <RoadmapSourcesModal application={baseApplication} onClose={vi.fn()} />,
    );
    expect(screen.getByText('Site Reliability Engineer')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('English (C1)')).toBeInTheDocument();
  });

  it('reveals typed experience and education rows in the disclosures', () => {
    render(
      <RoadmapSourcesModal application={baseApplication} onClose={vi.fn()} />,
    );
    expect(screen.getByText('DevOps · Acme')).toBeInTheDocument();
    expect(screen.getByText('MSc CS · EPITECH')).toBeInTheDocument();
  });

  it('shows "URL not available" when there is no offer url', () => {
    render(
      <RoadmapSourcesModal
        application={{ ...baseApplication, offerUrl: null }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/url not available/i)).toBeInTheDocument();
  });

  it('shows the no-snapshot message when cvDetails is null', () => {
    render(
      <RoadmapSourcesModal
        application={{ ...baseApplication, cvDetails: null }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/no cv snapshot stored/i)).toBeInTheDocument();
  });

  it('drops the experiences disclosure when the only row is all-null', () => {
    render(
      <RoadmapSourcesModal
        application={{
          ...baseApplication,
          cvDetails: {
            ...baseApplication.cvDetails!,
            experiences: [
              { company: null, title: null, description: null, duration: '1y' },
            ],
          },
        }}
        onClose={vi.fn()}
      />,
    );
    // The all-null row is filtered out, so the whole <details> is not rendered.
    expect(screen.queryByText(/experiences \(/i)).not.toBeInTheDocument();
  });

  it('calls onClose on the ✕ button, scrim click, and Escape', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <RoadmapSourcesModal application={baseApplication} onClose={onClose} />,
    );
    // ✕ button and scrim button have DISTINCT labels so each is addressable.
    fireEvent.click(screen.getByRole('button', { name: /^close sources$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <RoadmapSourcesModal application={baseApplication} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^dismiss sources$/i }));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(
      <RoadmapSourcesModal application={baseApplication} onClose={onClose} />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
