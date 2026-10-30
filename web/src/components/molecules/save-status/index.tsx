import { Icon } from '@/components/atoms/icon';
import { useTranslation } from 'react-i18next';

export type SaveStatusType = 'saved' | 'saving' | 'unsaved' | 'error';

export interface SaveStatusProps {
  status: SaveStatusType;
}

/**
 * SaveStatus component displays the current save status of a note.
 * @param {SaveStatusProps} props - Component props.
 * @param {SaveStatusType} props.status - Current save status: 'saved' | 'saving' | 'unsaved' | 'error'.
 * @returns Status indicator element.
 */
export const SaveStatus = ({ status }: SaveStatusProps) => {
  const { t } = useTranslation();

  switch (status) {
    case 'saving':
      return (
        <div className="flex items-center gap-2 text-text-weaker text-body-sm">
          <div
            className="loader"
            style={{
              width: '12px',
              height: '12px',
              borderWidth: '2px',
            }}
          />
          <span>{t('saveStatus.saving')}</span>
        </div>
      );
    case 'saved':
      return (
        <div className="flex items-center gap-2 text-success text-body-sm">
          <Icon icon="check" className="w-4 h-4" />
          <span>{t('saveStatus.saved')}</span>
        </div>
      );
    case 'unsaved':
      return (
        <div className="flex items-center gap-2 text-warning text-body-sm">
          <Icon icon="warning" className="w-4 h-4" />
          <span>{t('saveStatus.unsaved')}</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-2 text-error text-body-sm">
          <Icon icon="error" className="w-4 h-4" />
          <span>{t('saveStatus.error')}</span>
        </div>
      );
  }
};
