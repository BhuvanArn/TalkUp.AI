import { CalendarEvent, useCalendarStore } from '@/stores/useCalendarStore';
import {
  EVENT_COLORS,
  EventColorName,
  getEventColorNameFromHex,
} from '@/utils/eventColors';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

/**
 * Interface representing the form data for the event modal.
 */
export interface EventFormData {
  title: string;
  description: string;
  color: EventColorName;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

/**
 * Return type for the useCalendarEventModal hook.
 */
export interface UseCalendarEventModalReturn {
  isModalOpen: boolean;
  closeModal: () => void;
  modalEventToEdit: CalendarEvent | null;
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  errorMessage: string | null;
  handleSubmit: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

/**
 * Custom hook to manage the logic of the calendar event modal.
 * Handles form state, validation, and submission for creating or editing events.
 *
 * @returns {UseCalendarEventModalReturn} An object containing modal state, form data, and handlers.
 */
export const useCalendarEventModal = (): UseCalendarEventModalReturn => {
  const {
    isModalOpen,
    closeModal,
    addEvent,
    updateEvent,
    deleteEvent,
    modalInitialDate,
    modalInitialEndDate,
    modalEventToEdit,
  } = useCalendarStore();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    color: 'blue',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form data when the modal opens or the event to edit changes
  useEffect(() => {
    if (modalEventToEdit) {
      const { start, end, title, description, color } = modalEventToEdit;
      setFormData({
        title,
        description: description || '',
        color: getEventColorNameFromHex(color || ''),
        startDate: format(start, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endDate: format(end, 'yyyy-MM-dd'),
        endTime: format(end, 'HH:mm'),
      });
    } else if (modalInitialDate) {
      const start = modalInitialDate;
      const end =
        modalInitialEndDate || new Date(start.getTime() + 60 * 60 * 1000);

      setFormData({
        title: '',
        description: '',
        color: 'blue',
        startDate: format(start, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endDate: format(end, 'yyyy-MM-dd'),
        endTime: format(end, 'HH:mm'),
      });
    }
    setErrorMessage(null);
  }, [modalEventToEdit, isModalOpen, modalInitialDate, modalInitialEndDate]);

  // Close modal on unmount
  useEffect(() => {
    return () => {
      closeModal();
    };
  }, [closeModal]);

  const handleSubmit = async () => {
    setErrorMessage(null);
    const {
      title,
      description,
      color,
      startDate,
      startTime,
      endDate,
      endTime,
    } = formData;

    if (!title.trim()) {
      setErrorMessage('Please provide a title for your event.');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setErrorMessage('Invalid date or time.');
      return;
    }

    if (endDateTime <= startDateTime) {
      setErrorMessage('The end time must be after the start time.');
      return;
    }

    if (startDate !== endDate) {
      setErrorMessage('Events cannot span multiple days.');
      return;
    }

    const eventData = {
      title,
      description,
      color: EVENT_COLORS[color].hex,
      start_at: startDateTime.toISOString(),
      end_at: endDateTime.toISOString(),
    };

    if (modalEventToEdit) {
      await updateEvent(modalEventToEdit.id, eventData);
    } else {
      await addEvent(eventData);
    }
  };

  const handleDelete = async () => {
    if (modalEventToEdit) {
      await deleteEvent(modalEventToEdit.id);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return {
    isModalOpen,
    closeModal,
    modalEventToEdit,
    formData,
    setFormData,
    errorMessage,
    handleSubmit,
    handleDelete,
    handleInputChange,
  };
};
