import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatWidget } from './ChatWidget';

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const openChat = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open TalkUp chat' }));
  };

  it('renders the FAB closed by default', () => {
    render(<ChatWidget />);
    expect(
      screen.getByRole('button', { name: 'Open TalkUp chat' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('the FAB is type="button" so it never submits a surrounding form', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ChatWidget />
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open TalkUp chat' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens the dialog and moves focus to the input', () => {
    render(<ChatWidget />);
    openChat();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat message input')).toHaveFocus();
  });

  it('closes on Escape and returns focus to the FAB', () => {
    render(<ChatWidget />);
    openChat();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open TalkUp chat' }),
    ).toHaveFocus();
  });

  it('renders a welcome message with a timestamp computed at mount', () => {
    render(<ChatWidget />);
    openChat();
    expect(screen.getByText(/Ask me anything/)).toBeInTheDocument();
    // A HH:MM timestamp is rendered alongside the welcome bubble.
    expect(screen.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('sends a user message and shows an AI reply after the delay', () => {
    render(<ChatWidget />);
    openChat();

    const input = screen.getByLabelText('Chat message input');
    fireEvent.change(input, { target: { value: 'Hello there' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByText('Hello there')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText(/prioritization frameworks/)).toBeInTheDocument();
  });

  it('does not send when the input is empty', () => {
    render(<ChatWidget />);
    openChat();
    const send = screen.getByRole('button', { name: 'Send message' });
    expect(send).toBeDisabled();
  });
});
