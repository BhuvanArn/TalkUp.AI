import { useState, useEffect } from 'react';
import { useCalendarStore, CalendarEvent } from '@/components/molecules/calendar-option-bar/useCalendarStore';

interface CalendarModalProps {
  /** Event to edit. If null, modal will be in creation mode */
  eventToEdit?: CalendarEvent | null;
}

/**
 * CalendarModal component.
 * Displays a modal for creating a new event or editing an existing one.
 * Allows setting title, description, and color according to the design system.
 *
 * @param {CalendarModalProps} props - Props containing the event to edit (optional).
 * @returns {JSX.Element | null} The modal element or null if closed.
 */
const CalendarModal = ({ eventToEdit = null }: CalendarModalProps) => {
  const { isModalOpen, closeModal, addEvent, updateEvent, modalInitialDate } = useCalendarStore();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [color, setColor] = useState<'blue' | 'green' | 'red' | 'purple'>('blue');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setSubtitle(eventToEdit.subtitle);
      setColor(eventToEdit.color);
    } else {
      setTitle('');
      setSubtitle('');
      setColor('blue');
    }
  }, [eventToEdit, isModalOpen]);

  if (!isModalOpen) return null;

  /** Handles submission of the modal (create or update event) */
  const handleSubmit = () => {
    if (!title.trim()) return;

    const eventData = { title, subtitle, color, startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 };

    if (eventToEdit) {
      updateEvent({ ...eventToEdit, ...eventData });
    } else if (modalInitialDate) {
      addEvent(eventData);
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">{eventToEdit ? 'Edit Event' : 'Create Event'}</h2>
        
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full mb-4 p-2 border rounded"
          placeholder="Description"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        <div className="flex gap-2 mb-4">
          {(['blue', 'green', 'red', 'purple'] as const).map((c) => (
            <button
              key={c}
              className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-black' : 'border-gray-300'}`}
              style={{
                backgroundColor:
                  c === 'blue' ? '#2263b3' :
                  c === 'green' ? '#1fe0ac' :
                  c === 'red' ? '#e85348' :
                  '#ffebf3',
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={closeModal}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit}>
            {eventToEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
