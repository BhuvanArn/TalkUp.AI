import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';

import { EmptyStateProps } from './types';

/**
 * EmptyState component — displays a centered empty-state UI with an icon, title,
 * description and an optional action button.
 *
 * @param props : EmptyStateProps - Component props
 *
 * @default props.icon 'notes'
 *
 * @remarks
 * - Content is centered both vertically and horizontally and constrained for readable line length.
 * - When `actionLabel` and `onAction` are present, a contained accent Button with a "plus" icon is displayed.
 *
 * @returns A React element representing the empty state.
 *
 * @example
 * <EmptyState
 *   icon="inbox"
 *   title="No items"
 *   description="You don't have any items yet. Create your first item to get started."
 *   actionLabel="Create item"
 *   onAction={() => openCreateModal()}
 * />
 */
export const EmptyState = ({
  icon = 'notes',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-4">
      <div className="bg-neutral-weaker rounded-full p-6 mb-6">
        <Icon icon={icon} className="w-12 h-12 text-text-weaker" />
      </div>
      <h2 className="text-h2 text-text-idle font-semibold mb-2">{title}</h2>
      <p className="text-body-m text-text-weaker mb-6 text-center max-w-md">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="contained" color="accent" onClick={onAction}>
          <Icon icon="plus" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
