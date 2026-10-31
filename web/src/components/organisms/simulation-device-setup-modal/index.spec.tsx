import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SimulationDeviceSetupModal from './index';

const mediaDevices = {
  audioInputs: [
    { deviceId: 'mic-1', label: 'Built-in Microphone' },
    { deviceId: 'mic-2', label: 'USB Headset' },
  ],
  videoInputs: [{ deviceId: 'cam-1', label: 'FaceTime HD Camera' }],
  audioOutputs: [{ deviceId: 'out-1', label: 'Built-in Speakers' }],
  selectedAudioInput: 'mic-1',
  selectedVideoInput: 'cam-1',
  selectedAudioOutput: 'out-1',
  selectAudioInput: vi.fn(),
  selectVideoInput: vi.fn(),
  selectAudioOutput: vi.fn(),
  permission: 'granted' as 'granted' | 'denied' | 'pending',
  error: null as string | null,
  isOutputSelectionSupported: true,
  cameraEnabled: true,
  setCameraEnabled: vi.fn(),
  previewStream: null as MediaStream | null,
};

vi.mock('@/hooks/streams/useMediaDevices', () => ({
  useMediaDevices: vi.fn(() => mediaDevices),
}));

vi.mock('@/hooks/streams/useAudioAnalyzer', () => ({
  useAudioAnalyzer: vi.fn(() => ({ isSpeaking: false, audioLevel: 0 })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SimulationDeviceSetupModal', () => {
  it('lists the available microphones, cameras and outputs', () => {
    render(<SimulationDeviceSetupModal isOpen onStart={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: /microphone/i })).toHaveValue(
      'mic-1',
    );
    expect(
      screen.getByRole('option', { name: 'USB Headset' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /camera/i })).toHaveValue(
      'cam-1',
    );
    expect(screen.getByRole('combobox', { name: /audio output/i })).toHaveValue(
      'out-1',
    );
  });
  it('starts the simulation with the chosen devices', () => {
    const onStart = vi.fn();
    render(<SimulationDeviceSetupModal isOpen onStart={onStart} />);

    fireEvent.click(
      screen.getByRole('button', { name: /start the simulation/i }),
    );

    expect(onStart).toHaveBeenCalledWith({
      audioInputId: 'mic-1',
      videoInputId: 'cam-1',
      audioOutputId: 'out-1',
      cameraEnabled: true,
    });
  });
  it('renders nothing while closed', () => {
    const { container } = render(
      <SimulationDeviceSetupModal isOpen={false} onStart={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('offers only the system default output when the browser cannot switch it', () => {
    mediaDevices.isOutputSelectionSupported = false;

    render(<SimulationDeviceSetupModal isOpen onStart={vi.fn()} />);

    const output = screen.getByRole('combobox', { name: /audio output/i });
    expect(output).toBeDisabled();
    expect(output).toHaveTextContent(/system default/i);
    expect(
      screen.getByText(/cannot choose the audio output/i),
    ).toBeInTheDocument();

    mediaDevices.isOutputSelectionSupported = true;
  });

  it('blocks the start and explains why when the microphone is refused', () => {
    mediaDevices.permission = 'denied';
    mediaDevices.error = 'Microphone access was denied.';

    render(<SimulationDeviceSetupModal isOpen onStart={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /start the simulation/i }),
    ).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/micro/i);

    mediaDevices.permission = 'granted';
    mediaDevices.error = null;
  });

  it('switches the camera off from the toggle', () => {
    render(<SimulationDeviceSetupModal isOpen onStart={vi.fn()} />);

    fireEvent.click(
      screen.getByRole('button', { name: /turn the camera off/i }),
    );

    expect(mediaDevices.setCameraEnabled).toHaveBeenCalledWith(false);
  });
  it('says the devices are still being detected instead of faking a device name', () => {
    mediaDevices.permission = 'pending';
    mediaDevices.audioInputs = [];
    mediaDevices.videoInputs = [];

    render(<SimulationDeviceSetupModal isOpen onStart={vi.fn()} />);

    expect(
      screen.getByRole('combobox', { name: /microphone/i }),
    ).toHaveTextContent(/detecting/i);

    mediaDevices.permission = 'granted';
    mediaDevices.audioInputs = [
      { deviceId: 'mic-1', label: 'Built-in Microphone' },
      { deviceId: 'mic-2', label: 'USB Headset' },
    ];
    mediaDevices.videoInputs = [
      { deviceId: 'cam-1', label: 'FaceTime HD Camera' },
    ];
  });

  it('says when no microphone was found at all', () => {
    mediaDevices.audioInputs = [];

    render(<SimulationDeviceSetupModal isOpen onStart={vi.fn()} />);

    expect(
      screen.getByRole('combobox', { name: /microphone/i }),
    ).toHaveTextContent(/no microphone/i);

    mediaDevices.audioInputs = [
      { deviceId: 'mic-1', label: 'Built-in Microphone' },
      { deviceId: 'mic-2', label: 'USB Headset' },
    ];
  });

  it('can be dismissed with Escape or the backdrop when a way out is given', () => {
    const onCancel = vi.fn();

    render(
      <SimulationDeviceSetupModal
        isOpen
        onStart={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /close device setup/i }),
    );
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('stays put when the page offers no way out', () => {
    render(<SimulationDeviceSetupModal isOpen onStart={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: /close device setup/i }),
    ).not.toBeInTheDocument();
  });
});
