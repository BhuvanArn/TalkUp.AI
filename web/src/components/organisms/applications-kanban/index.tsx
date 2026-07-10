import {
  ApplicationCard,
  STATUS_LABELS,
} from '@/components/molecules/application-card';
import type {
  Application,
  ApplicationStatus,
} from '@/services/applications/types';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

const COLUMNS: {
  status: ApplicationStatus;
  dotClass: string;
  emptyHint: string;
}[] = [
  {
    status: 'sent',
    dotClass: 'bg-accent',
    emptyHint: 'Drop a card here, or start a new analysis',
  },
  {
    status: 'interview',
    dotClass: 'bg-warning',
    emptyHint: 'Drop a card here when an interview is scheduled',
  },
  {
    status: 'accepted',
    dotClass: 'bg-success',
    emptyHint: "Drop a card here when it's a win 🎉",
  },
  {
    status: 'rejected',
    dotClass: 'bg-error',
    emptyHint: 'Rejections archive here. The training stays yours',
  },
];

interface ApplicationsKanbanProps {
  applications: Application[];
  /** Ids with an in-flight status/delete mutation (cards frozen). */
  pendingIds: Set<string>;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
  onDelete: (applicationId: string) => void;
  onOpenTraining: (applicationId: string) => void;
}

const KanbanColumn = ({
  status,
  dotClass,
  emptyHint,
  applications,
  ...cardHandlers
}: {
  status: ApplicationStatus;
  dotClass: string;
  emptyHint: string;
  applications: Application[];
  pendingIds: Set<string>;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
  onDelete: (applicationId: string) => void;
  onOpenTraining: (applicationId: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      data-testid={`kanban-column-${status}`}
      aria-label={STATUS_LABELS[status]}
      className={`bg-surface-raised flex min-h-[180px] flex-col gap-2.5 rounded-xl p-3 ${
        isOver ? 'ring-accent ring-2' : ''
      }`}
    >
      <h3 className="text-label-s text-text-idle flex items-center gap-1.5 font-bold tracking-wide uppercase">
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${dotClass}`}
        />
        {STATUS_LABELS[status]}
        <span className="bg-background ml-auto rounded-full px-2">
          {applications.length}
        </span>
      </h3>

      {applications.map((app) => (
        <ApplicationCard
          key={app.applicationId}
          application={app}
          isPending={cardHandlers.pendingIds.has(app.applicationId)}
          onStatusChange={cardHandlers.onStatusChange}
          onDelete={cardHandlers.onDelete}
          onOpenTraining={cardHandlers.onOpenTraining}
        />
      ))}

      {applications.length === 0 && (
        <p className="border-border-strong text-body-s text-text-weakest rounded-lg border-2 border-dashed p-3.5 text-center">
          {emptyHint}
        </p>
      )}
    </section>
  );
};

/**
 * 4-column status kanban. Drag & drop moves a card between columns
 * (status PATCH). Pointer drag works on mouse and touch; keyboard drag
 * (Space to pick up, arrows to move, Space to drop, Esc to cancel) works
 * via the KeyboardSensor. The card ▾ menu remains as an explicit fallback.
 * Columns stack vertically on mobile; the PointerSensor still allows
 * touch-drag between the stacked columns.
 */
export const ApplicationsKanban = ({
  applications,
  pendingIds,
  onStatusChange,
  onDelete,
  onOpenTraining,
}: ApplicationsKanbanProps) => {
  // 8px activation distance so simple clicks (menu, training link) don't
  // start a drag. KeyboardSensor makes the draggable handle (which dnd-kit
  // already exposes as a focusable role="button") operable via the keyboard.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const applicationId = String(active.id);
    const status = over.id as ApplicationStatus;
    const current = applications.find(
      (app) => app.applicationId === applicationId,
    );
    if (current && current.status !== status) {
      onStatusChange(applicationId, status);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map(({ status, dotClass, emptyHint }) => (
          <KanbanColumn
            key={status}
            status={status}
            dotClass={dotClass}
            emptyHint={emptyHint}
            applications={applications.filter((app) => app.status === status)}
            pendingIds={pendingIds}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onOpenTraining={onOpenTraining}
          />
        ))}
      </div>
    </DndContext>
  );
};
