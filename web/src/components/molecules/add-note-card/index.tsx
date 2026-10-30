import { Icon } from '@/components/atoms/icon';
import { useTranslation } from 'react-i18next';

export interface AddNoteCardProps {
  onClick: () => void;
}

/**
 * AddNoteCard component
 * @param {AddNoteCardProps} props - component props
 * @param {() => void} props.onClick - function called when clicking the button
 * @returns JSX.Element
 */
export const AddNoteCard = ({ onClick }: AddNoteCardProps) => {
  const { t } = useTranslation('app');

  return (
    <button
      onClick={onClick}
      className="bg-note-card/50 hover:bg-note-card rounded-lg p-3 transition-all duration-200 cursor-pointer h-full flex flex-col items-center justify-center gap-3 min-h-[240px] group"
    >
      <div className="w-12 h-12 rounded-full bg-neutral-weaker group-hover:bg-accent-weaker flex items-center justify-center transition-colors">
        <Icon
          icon="plus"
          className="w-6 h-6 text-text-weaker group-hover:text-accent transition-colors"
        />
      </div>
      <span className="text-body-md text-text-weaker group-hover:text-accent transition-colors font-medium">
        {t('notes.addNote')}
      </span>
    </button>
  );
};
