import { BaseInput } from '@/components/atoms/base-input';
import { Button } from '@/components/atoms/button';
import ConfirmationModal from '@/components/atoms/confirmation-modal';
import { Icon } from '@/components/atoms/icon';
import IconAction from '@/components/atoms/icon-action';
import { TextArea } from '@/components/atoms/text-area';
import { TimeComboBox } from '@/components/atoms/time-combobox';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { useCalendarEventModal } from '@/hooks/calendar/useCalendarEventModal';
import { EVENT_COLORS, EventColorName } from '@/utils/eventColors';
import { useState } from 'react';

/**
 * CalendarModal component.
 * Displays a modal for creating and editing calendar events.
 *
 * @returns The CalendarModal component for creating and editing calendar events.
 */
const CalendarModal = () => {
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);

  const {
    isModalOpen,
    closeModal,
    modalEventToEdit,
    formData,
    setFormData,
    errorMessage,
    handleSubmit,
    handleDelete,
  } = useCalendarEventModal();

  const { title, description, color, startDate, startTime, endDate, endTime } =
    formData;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmationOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
  };

  const handleConfirmDelete = async () => {
    await handleDelete();
    setIsDeleteConfirmationOpen(false);
  };

  if (!isModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <button
          type="button"
          className="w-full h-full absolute bg-scrim/40"
          onClick={closeModal}
          aria-label="Close event modal"
        />
        <div className="relative z-10 bg-white rounded-xl p-4 w-96 flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-body-xl-strong text-active flex items-center gap-2">
              <Icon icon="schedule" size="lg" />
              {modalEventToEdit ? 'Edit Event' : 'Create Event'}
            </h2>
            <IconAction icon="times" size="md" onClick={closeModal} />
          </div>

          {errorMessage && (
            <div className="text-error text-body-s">{errorMessage}</div>
          )}

          <div className="flex flex-col gap-3 mb-3">
            <InputMolecule
              label="Event Title"
              inputType="base"
              name="title"
              value={title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Add title"
            />

            <div>
              <label
                className="text-label-m text-idle"
                htmlFor="event-modal-description-text-area"
              >
                Description
              </label>
              <TextArea
                id="event-modal-description-text-area"
                value={description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Add description"
                rows={3}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="text-label-m text-idle"
                  htmlFor="event-modal-start-inputs"
                >
                  Start
                </label>
                <div
                  className="flex flex-col gap-2"
                  id="event-modal-start-inputs"
                >
                  <BaseInput
                    type="date"
                    value={startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                  />
                  <TimeComboBox
                    value={startTime}
                    onChange={(e) => handleChange('startTime', e)}
                  />
                </div>
              </div>
              <div>
                <label
                  className="text-label-m text-idle"
                  htmlFor="event-modal-start-inputs"
                >
                  End
                </label>
                <div
                  className="flex flex-col gap-2"
                  id="event-modal-end-inputs"
                >
                  <BaseInput
                    type="date"
                    value={endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                  />
                  <TimeComboBox
                    value={endTime}
                    onChange={(e) => handleChange('endTime', e)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                className="text-label-m text-idle"
                htmlFor="event-modal-color-inputs"
              >
                Color
              </label>
              <div
                className="flex gap-1 flex-wrap"
                id="event-modal-color-inputs"
              >
                {(Object.keys(EVENT_COLORS) as EventColorName[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-8 h-8 rounded-full cursor-pointer border-2 border-border"
                    style={{ backgroundColor: EVENT_COLORS[c].border }}
                    onClick={() => handleChange('color', c)}
                  >
                    {color === c && (
                      <span className="flex items-center justify-center h-full">
                        <Icon icon="check" size="xs" color="white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {modalEventToEdit && (
              <Button
                color="error"
                onClick={handleDeleteClick}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button color="sidebar" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              color="accent"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              {modalEventToEdit ? 'Update' : 'Create'}
              <Icon icon="save" size="sm" color="white" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteConfirmationOpen}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default CalendarModal;
