import { Icon } from '@/components/atoms/icon';
import {
  CalendarEvent,
  useCalendarStore,
} from '@/components/molecules/calendar-option-bar/useCalendarStore';
import { useEffect, useState } from 'react';

interface CalendarModalProps {
  /** Event to edit. If null, modal will be in creation mode */
  eventToEdit?: CalendarEvent | null;
}

/**
 * CalendarModal component.
 * Displays a modal for creating a new event or editing an existing one,
 * complete with title, time slot, and color selection.
 *
 * @param {CalendarModalProps} props - Props containing the event to edit (optional).
 * @returns {JSX.Element | null} The modal element or null if closed.
 */
const CalendarModal = ({ eventToEdit = null }: CalendarModalProps) => {
  const { isModalOpen, closeModal, addEvent, updateEvent, modalInitialDate } =
    useCalendarStore();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [color, setColor] = useState<'blue' | 'green' | 'red' | 'purple'>(
    'blue',
  );
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);

  /** State for displaying validation errors */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Initializes the modal state based on the event to edit or the initial click date.
   */
  useEffect(() => {
    if (eventToEdit) {
      // EDIT MODE
      setTitle(eventToEdit.title);
      setSubtitle(eventToEdit.subtitle);
      setColor(eventToEdit.color);
      setStartHour(eventToEdit.startHour);
      setStartMinute(eventToEdit.startMinute);
      setEndHour(eventToEdit.endHour);
      setEndMinute(eventToEdit.endMinute);
    } else if (modalInitialDate) {
      // CREATION MODE: Use clicked time
      const clickedHour = modalInitialDate.getHours();
      setTitle('');
      setSubtitle('');
      setColor('blue');

      setStartHour(clickedHour);
      setStartMinute(0);
      setEndHour(clickedHour < 23 ? clickedHour + 1 : 23);
      setEndMinute(0);
    } else {
      setTitle('');
      setSubtitle('');
      setColor('blue');
      setStartHour(9);
      setStartMinute(0);
      setEndHour(10);
      setEndMinute(0);
    }

    setErrorMessage(null);
  }, [eventToEdit, isModalOpen, modalInitialDate]);

  if (!isModalOpen) return null;

  /**
   * Handles submission, validates fields, and calls the appropriate store action (add or update).
   */
  const handleSubmit = () => {
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please provide a title for your event.');
      return;
    }

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      setErrorMessage('The end time must be after the start time.');
      return;
    }

    const eventData = {
      title,
      subtitle,
      color,
      startHour,
      startMinute,
      endHour,
      endMinute,
    };

    if (eventToEdit) {
      updateEvent({ ...eventToEdit, ...eventData });
    } else if (modalInitialDate) {
      addEvent(eventData);
    }
    closeModal();
  };

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, '0'),
  );
  const minutes = ['00', '15', '30', '45'];

  /**
   * Gets the hex color code for the style attribute based on the event color name.
   * @param {('blue' | 'green' | 'red' | 'purple')} c - The color name.
   * @returns {string} The hex color code.
   */
  const getColorStyle = (c: 'blue' | 'green' | 'red' | 'purple') => {
    switch (c) {
      case 'blue':
        return '#2263b3';
      case 'green':
        return '#1fe0ac';
      case 'red':
        return '#e85348';
      case 'purple':
        return '#a058d9';
      default:
        return '#2263b3';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Icon icon="schedule" size="lg" color="primary" />
            {eventToEdit ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon icon="times" size="lg" />
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
            <Icon icon="error" size="md" color="error" />
            <span className="block sm:inline text-sm font-medium">
              {errorMessage}
            </span>
          </div>
        )}

        {/* TEXT FIELDS */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Icon
              icon="tag"
              size="sm"
              color="neutral"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all ${errorMessage && !title.trim() ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Event Title (Required)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="relative">
            <Icon
              icon="info"
              size="sm"
              color="neutral"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Description (Optional)"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
        </div>

        {/* TIME SELECTION */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Icon icon="clock" size="sm" color="neutral" />
            Time Details
          </h3>

          {modalInitialDate && !eventToEdit && (
            <p className="text-sm text-gray-600 mb-3 p-2 bg-white rounded-md border">
              <span className="font-medium">Selected Date:</span> **
              {modalInitialDate.toLocaleDateString()}**
            </p>
          )}

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 w-1/4">
              Start:
            </span>
            <div className="flex gap-1 items-center flex-grow">
              <select
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
                className="p-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                {hours.map((h) => (
                  <option key={`sh-${h}`} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-gray-500">:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(parseInt(e.target.value))}
                className="p-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                {minutes.map((m) => (
                  <option key={`sm-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 w-1/4">
              End:
            </span>
            <div className="flex gap-1 items-center flex-grow">
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
                className="p-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                {hours.map((h) => (
                  <option key={`eh-${h}`} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-gray-500">:</span>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(parseInt(e.target.value))}
                className="p-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                {minutes.map((m) => (
                  <option key={`em-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* COLOR SELECTION */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Icon icon="palette" size="sm" color="neutral" />
            Event Color
          </h3>
          <div className="flex gap-3 justify-center">
            {(['blue', 'green', 'red', 'purple'] as const).map((c) => (
              <button
                key={c}
                className={`w-10 h-10 rounded-full transition-all duration-150 ease-in-out shadow-md hover:scale-110`}
                style={{
                  backgroundColor: getColorStyle(c),
                  border: color === c ? '4px solid #fff' : 'none',
                  outline:
                    color === c ? `2px solid ${getColorStyle(c)}` : 'none',
                }}
                onClick={() => setColor(c)}
              >
                {color === c && (
                  <div className="flex items-center justify-center h-full w-full">
                    <Icon icon="check" size="sm" color="white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-blue-600 hover:bg-blue-700`}
            onClick={handleSubmit}
          >
            <div className="flex items-center gap-1">
              {eventToEdit ? 'Update' : 'Create'}
              <Icon icon="save" size="sm" color="white" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
