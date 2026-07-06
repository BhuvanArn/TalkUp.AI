import { sendChatMessage } from '@/services/ai/http';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatWidget } from './ChatWidget';

vi.mock('@/services/ai/http', () => ({
  sendChatMessage: vi.fn(),
}));

const mockedSendChatMessage = vi.mocked(sendChatMessage);

describe('ChatWidget', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const openChat = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open TalkUp chat' }));
  };

  it('renders the FAB closed by default', () => {
    render(<ChatWidget />);
    expect(
      screen.getByRole('button', { name: 'Open TalkUp chat' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
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

  it('opens the chat panel and moves focus to the input', () => {
    render(<ChatWidget />);
    openChat();

    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat message input')).toHaveFocus();
  });

  it('closes on Escape and returns focus to the FAB', () => {
    render(<ChatWidget />);
    openChat();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
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

  it('sends a user message and shows the assistant reply from the API', async () => {
    mockedSendChatMessage.mockResolvedValueOnce({
      reply: 'Use the STAR method.',
    });

    render(<ChatWidget />);
    openChat();

    const input = screen.getByLabelText('Chat message input');
    fireEvent.change(input, { target: { value: 'Hello there' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByText('Hello there')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('Use the STAR method.')).toBeInTheDocument(),
    );

    // Welcome bubble is excluded; only the prior user turn would be sent, and
    // here there is no prior turn so history is empty.
    expect(mockedSendChatMessage).toHaveBeenCalledWith({
      message: 'Hello there',
      history: [],
    });
  });

  it('sends prior turns as history on the second message', async () => {
    mockedSendChatMessage
      .mockResolvedValueOnce({ reply: 'First reply.' })
      .mockResolvedValueOnce({ reply: 'Second reply.' });

    render(<ChatWidget />);
    openChat();

    const input = screen.getByLabelText('Chat message input');
    const send = screen.getByRole('button', { name: 'Send message' });

    fireEvent.change(input, { target: { value: 'first' } });
    fireEvent.click(send);
    await waitFor(() =>
      expect(screen.getByText('First reply.')).toBeInTheDocument(),
    );

    fireEvent.change(input, { target: { value: 'second' } });
    fireEvent.click(send);
    await waitFor(() =>
      expect(screen.getByText('Second reply.')).toBeInTheDocument(),
    );

    expect(mockedSendChatMessage).toHaveBeenLastCalledWith({
      message: 'second',
      history: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'First reply.' },
      ],
    });
  });

  it('shows a fallback message when the API call fails', async () => {
    mockedSendChatMessage.mockRejectedValueOnce(new Error('network'));

    render(<ChatWidget />);
    openChat();

    const input = screen.getByLabelText('Chat message input');
    fireEvent.change(input, { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() =>
      expect(
        screen.getByText(/could not reach the assistant/),
      ).toBeInTheDocument(),
    );
  });

  it('does not send when the input is empty', () => {
    render(<ChatWidget />);
    openChat();
    const send = screen.getByRole('button', { name: 'Send message' });
    expect(send).toBeDisabled();
  });
});
