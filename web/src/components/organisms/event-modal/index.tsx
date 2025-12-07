import { BaseInput } from '@/components/atoms/base-input';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import IconAction from '@/components/atoms/icon-action';
import { TextArea } from '@/components/atoms/text-area';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { useCalendarEventModal } from '@/hooks/calendar/useCalendarEventModal';
import type { InputChangeEvent, TextAreaChangeEvent } from '@/types/events';
import { EVENT_COLORS, EventColorName } from '@/utils/eventColors';

/**
 * CalendarModal component.
 * Displays a modal for creating and editing calendar events.
 *
 * @returns The CalendarModal component for creating and editing calendar events.
 */
const CalendarModal = () => {
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

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-60 p-4">
      <button
        className="w-full h-full absolute bg-black/40"
        onClick={closeModal}
      />
      <div className="bg-white rounded-xl p-4 w-96 flex flex-col gap-3 z-70">
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
            type="text"
            value={title}
            onChange={(e: InputChangeEvent) =>
              handleChange('title', e.target.value)
            }
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
              onChange={(e: TextAreaChangeEvent) =>
                handleChange('description', e.target.value)
              }
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
                  onChange={(e: InputChangeEvent) =>
                    handleChange('startDate', e.target.value)
                  }
                />
                <BaseInput
                  type="time"
                  value={startTime}
                  onChange={(e: InputChangeEvent) =>
                    handleChange('startTime', e.target.value)
                  }
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
              <div className="flex flex-col gap-2" id="event-modal-end-inputs">
                <BaseInput
                  type="date"
                  value={endDate}
                  onChange={(e: InputChangeEvent) =>
                    handleChange('endDate', e.target.value)
                  }
                />
                <BaseInput
                  type="time"
                  value={endTime}
                  onChange={(e: InputChangeEvent) =>
                    handleChange('endTime', e.target.value)
                  }
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
            <div className="flex gap-1 flex-wrap" id="event-modal-color-inputs">
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
            <Button color="error" onClick={handleDelete} className="mr-auto">
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
  );
};

export default CalendarModal;
