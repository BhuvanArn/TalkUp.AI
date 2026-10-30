import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SimulationTranscriptionArea from './index';

describe('SimulationTranscriptionArea', () => {
  it('shows an empty-state hint when there are no transcriptions', () => {
    render(<SimulationTranscriptionArea transcriptions={[]} />);

    expect(
      screen.getByText(/transcriptions will appear here/i),
    ).toBeInTheDocument();
  });

  it('renders the turns and hides the empty-state hint when transcriptions exist', () => {
    render(
      <SimulationTranscriptionArea
        transcriptions={[
          { isIA: false, text: 'Hello there' },
          { isIA: true, text: 'Hi, welcome' },
        ]}
      />,
    );

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('Hi, welcome')).toBeInTheDocument();
    expect(
      screen.queryByText(/transcriptions will appear here/i),
    ).not.toBeInTheDocument();
  });
});
