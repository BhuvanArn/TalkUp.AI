import type { Application } from '@/services/applications/types';
import { DndContext } from '@dnd-kit/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApplicationCard } from './index';

// useDraggable needs a DndContext ancestor.
const wrap = (ui: ReactNode) => render(<DndContext>{ui}</DndContext>);

const app: Application = {
  applicationId: 'a1',
  companyName: 'Datadog Paris',
  jobTitle: 'SRE Junior',
  status: 'sent',
  offerUrl: null,
  offerDetails: null,
  cvDetails: null,
  appliedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-08T00:00:00.000Z',
};

const noop = () => undefined;

describe('ApplicationCard', () => {
  it('renders company, job title and training link', () => {
    wrap(
      <ApplicationCard
        application={app}
        isPending={false}
        onStatusChange={noop}
        onDelete={noop}
        onOpenTraining={noop}
      />,
    );
    expect(screen.getByText('Datadog Paris')).toBeInTheDocument();
    expect(screen.getByText('SRE Junior')).toBeInTheDocument();
    expect(screen.getByText('Resume training')).toBeInTheDocument();
  });

  it('changes status through the menu', () => {
    const onStatusChange = vi.fn();
    wrap(
      <ApplicationCard
        application={app}
        isPending={false}
        onStatusChange={onStatusChange}
        onDelete={noop}
        onOpenTraining={noop}
      />,
    );
    fireEvent.click(screen.getByLabelText('Application actions'));
    fireEvent.click(screen.getByText('Interview'));
    expect(onStatusChange).toHaveBeenCalledWith('a1', 'interview');
  });

  it('requires a confirmation click to delete', () => {
    const onDelete = vi.fn();
    wrap(
      <ApplicationCard
        application={app}
        isPending={false}
        onStatusChange={noop}
        onDelete={onDelete}
        onOpenTraining={noop}
      />,
    );
    fireEvent.click(screen.getByLabelText('Application actions'));
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirm deletion'));
    expect(onDelete).toHaveBeenCalledWith('a1');
  });

  it('disables the menu while a mutation is pending', () => {
    wrap(
      <ApplicationCard
        application={app}
        isPending={true}
        onStatusChange={noop}
        onDelete={noop}
        onOpenTraining={noop}
      />,
    );
    expect(screen.getByLabelText('Application actions')).toBeDisabled();
  });
});
