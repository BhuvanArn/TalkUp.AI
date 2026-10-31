/** The devices the user picked before starting the simulation. */
export interface SimulationDeviceSelection {
  audioInputId: string;
  videoInputId: string;
  audioOutputId: string;
  cameraEnabled: boolean;
}

export interface SimulationDeviceSetupModalProps {
  /** Whether the setup step is on screen. Probing stops when it is not. */
  isOpen: boolean;
  /** Starts the simulation with the chosen devices. */
  onStart: (selection: SimulationDeviceSelection) => void;
  /** Dismisses the setup without starting. Omit to make the step mandatory. */
  onCancel?: () => void;
}
