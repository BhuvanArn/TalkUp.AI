import type { Application } from '@/services/applications/types';
import { DndContext } from '@dnd-kit/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  interviewAt: null,
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
        onInterviewAtChange={noop}
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
        onInterviewAtChange={noop}
        onOpenTraining={noop}
      />,
    );
    fireEvent.click(screen.getByLabelText('Application actions'));
    // Menu items are grouped under a "Move to" header; the item is the status.
    fireEvent.click(screen.getByRole('menuitem', { name: 'Interview' }));
    expect(onStatusChange).toHaveBeenCalledWith('a1', 'interview');
  });

  // Regression for the CI e2e flake (issue #189): the outside-dismiss handler
  // must not swallow a menuitem activation. user-event fires the real
  // pointerdown/mousedown -> mouseup -> click ordering against a live document
  // listener, unlike fireEvent.click above, so it reproduces the race where a
  // press inside the menu closed it before the click landed.
  it('activates a menu item through a full press/release gesture', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    wrap(
      <ApplicationCard
        application={app}
        isPending={false}
        onStatusChange={onStatusChange}
        onDelete={noop}
        onInterviewAtChange={noop}
        onOpenTraining={noop}
      />,
    );
    await user.click(screen.getByLabelText('Application actions'));
    await user.click(screen.getByRole('menuitem', { name: 'Interview' }));
    expect(onStatusChange).toHaveBeenCalledWith('a1', 'interview');
  });

  it('closes the menu on an outside press but keeps it open for inside presses', async () => {
    const user = userEvent.setup();
    wrap(
      <ApplicationCard
        application={app}
        isPending={false}
        onStatusChange={noop}
        onDelete={noop}
        onInterviewAtChange={noop}
        onOpenTraining={noop}
      />,
    );
    await user.click(screen.getByLabelText('Application actions'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // A press that starts inside the menu (e.g. on the interview date input)
    // must not dismiss it mid-gesture.
    await user.click(screen.getByLabelText('Interview date'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // A genuine outside press dismisses.
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('requires a confirmation modal to delete', () => {
    const onDelete = vi.fn();
    wrap(
      <ApplicationCard
        application={app}
        isPending={false}
        onStatusChange={noop}
        onDelete={onDelete}
        onInterviewAtChange={noop}
        onOpenTraining={noop}
      />,
    );
    // The menu "Delete" item only opens the confirmation modal; it does not
    // delete on its own.
    fireEvent.click(screen.getByLabelText('Application actions'));
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText('Delete this application?')).toBeInTheDocument();

    // Confirming in the modal fires the delete.
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('a1');
  });

  it('disables the menu while a mutation is pending', () => {
    wrap(
      <ApplicationCard
        application={app}
        isPending={true}
        onStatusChange={noop}
        onDelete={noop}
        onInterviewAtChange={noop}
        onOpenTraining={noop}
      />,
    );
    expect(screen.getByLabelText('Application actions')).toBeDisabled();
  });
});
