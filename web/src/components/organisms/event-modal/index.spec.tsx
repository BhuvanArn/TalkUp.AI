import { EVENT_COLORS } from '@/utils/eventColors';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock child components to keep tests focused on the modal logic
vi.mock('@/components/atoms/base-input', () => ({
  BaseInput: (props: any) => {
    // strip internal props that should not be forwarded to DOM elements
    const { inputType: _inputType, ...rest } = props;
    return <input data-testid={`base-input-${rest.type ?? ''}`} {...rest} />;
  },
}));

vi.mock('@/components/atoms/button', () => ({
  Button: (props: any) => (
    <button {...props} data-testid={props['data-testid'] ?? undefined}>
      {props.children}
    </button>
  ),
}));

vi.mock('@/components/atoms/icon', () => ({
  Icon: (props: any) => <span data-testid={`icon-${props.icon}`} />,
}));

vi.mock('@/components/atoms/icon-action', () => ({
  __esModule: true,
  default: (props: any) => (
    <button data-testid="icon-action" onClick={props.onClick} />
  ),
}));

vi.mock('@/components/atoms/text-area', () => ({
  TextArea: (props: any) => {
    const { inputType: _inputType, ...rest } = props;
    return <textarea data-testid="text-area" {...rest} />;
  },
}));

vi.mock('@/components/molecules/input-molecule', () => ({
  InputMolecule: (props: any) => {
    const { inputType: _inputType, ...rest } = props;
    return <input data-testid="input-molecule" {...rest} />;
  },
}));

// Helper to dynamically mock the hook and import the component after mocking
const loadComponentWithMock = async (mockHook: any) => {
  // Ensure fresh module state per test
  vi.resetModules();
  vi.doMock('@/hooks/calendar/useCalendarEventModal', () => ({
    useCalendarEventModal: () => mockHook,
  }));

  const mod = await import('./index');
  return mod.default;
};

describe('CalendarModal / event-modal', () => {
  it('renders nothing when modal is closed', async () => {
    const mockHook = {
      isModalOpen: false,
      closeModal: vi.fn(),
      modalEventToEdit: null,
      formData: {
        title: '',
        description: '',
        color: 'blue',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
      },
      setFormData: vi.fn(),
      errorMessage: '',
      handleSubmit: vi.fn(),
      handleDelete: vi.fn(),
    };

    const CalendarModal = await loadComponentWithMock(mockHook);
    const { container } = render(<CalendarModal />);
    // When closed, nothing should be rendered
    expect(container.firstChild).toBeNull();
  });

  it('renders create mode, shows fields and Cancel triggers closeModal', async () => {
    const setFormData = vi.fn();
    const closeModal = vi.fn();
    const handleSubmit = vi.fn();

    const mockHook = {
      isModalOpen: true,
      closeModal,
      modalEventToEdit: null,
      formData: {
        title: '',
        description: '',
        color: 'blue',
        startDate: '2025-12-01',
        startTime: '09:00',
        endDate: '2025-12-01',
        endTime: '10:00',
      },
      setFormData,
      errorMessage: '',
      handleSubmit,
      handleDelete: vi.fn(),
    };

    const CalendarModal = await loadComponentWithMock(mockHook);
    const { container } = render(<CalendarModal />);

    // Heading for create
    expect(screen.getByText('Create Event')).toBeInTheDocument();

    // Cancel button should be present and call closeModal
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(closeModal).toHaveBeenCalled();

    // Submit button should be disabled because title is empty
    const submitBtn = screen.getByText('Create');
    expect(submitBtn.closest('button')).toBeDisabled();

    // Color buttons exist
    const colorContainer = container.querySelector('#event-modal-color-inputs');
    expect(colorContainer).toBeTruthy();
    const colorButtons = colorContainer?.querySelectorAll('button') ?? [];
    expect(colorButtons.length).toBe(Object.keys(EVENT_COLORS).length);

    // Click a color button and ensure setFormData was called with updater
    fireEvent.click(colorButtons[0]);
    expect(setFormData).toHaveBeenCalled();
    const lastCallArg =
      setFormData.mock.calls[setFormData.mock.calls.length - 1][0];
    // If the setter was called with a function, apply it to a sample prev
    if (typeof lastCallArg === 'function') {
      const result = lastCallArg({ color: 'initial' });
      // The result should include the selected color key
      const selected = Object.keys(EVENT_COLORS)[0];
      expect(result.color).toBe(selected);
    }
  });

  it('shows error message and update/delete flow in edit mode', async () => {
    const handleDelete = vi.fn();
    const mockHook = {
      isModalOpen: true,
      closeModal: vi.fn(),
      modalEventToEdit: { id: '1', title: 't' },
      formData: {
        title: 'My title',
        description: 'desc',
        color: 'green',
        startDate: '2025-12-01',
        startTime: '09:00',
        endDate: '2025-12-01',
        endTime: '10:00',
      },
      setFormData: vi.fn(),
      errorMessage: 'Some error',
      handleSubmit: vi.fn(),
      handleDelete,
    };

    const CalendarModal = await loadComponentWithMock(mockHook);
    render(<CalendarModal />);

    // Edit title
    expect(screen.getByText('Edit Event')).toBeInTheDocument();

    // Error message shown
    expect(screen.getByText('Some error')).toBeInTheDocument();

    // Delete button present and wired
    const deleteBtn = screen.getByText('Delete');
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalled();

    // Submit button enabled because title has text and shows 'Update'
    const updateBtn = screen.getByText('Update');
    expect(updateBtn).toBeInTheDocument();
    expect(updateBtn.closest('button')).not.toBeDisabled();
  });
});

export {};
