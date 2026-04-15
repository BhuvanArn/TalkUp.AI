import { Toggle } from '@/components/atoms/toggle';
import { cn } from '@/utils/cn';

/**
 * @interface NotifSetting
 * @description Represents an individual notification configuration item.
 */
interface NotifSetting {
  /** Unique identifier for the notification type (e.g., 'training', 'updates') */
  id: string;
  /** Primary label displayed to the user */
  label: string;
  /** Short description explaining what this notification covers */
  desc: string;
  /** Current toggle state indicating if the notification is active */
  enabled: boolean;
}

/**
 * @interface NotifSettingsProps
 * @description Properties for the NotifSettings component.
 */
interface NotifSettingsProps {
  /** Array of notification settings to be rendered as a list */
  notifs: NotifSetting[];
  /** Callback function triggered when a toggle switch is clicked */
  onToggle: (id: string) => void;
}

/**
 * NotifSettings Component
 * * Renders a list of notification preferences with toggle switches.
 * * This component is used within the "Notifications" tab of the profile settings.
 * * @param {NotifSettingsProps} props - Component properties.
 * @returns {JSX.Element} A structured list of notification toggles.
 */
export const NotifSettings = ({ notifs, onToggle }: NotifSettingsProps) => {
  return (
    <div className="flex flex-col">
      {notifs.map((n, i) => (
        <div
          key={n.id}
          data-testid={`notif-row-${n.id}`}
          className={cn(
            'flex items-center justify-between gap-4 py-4',
            i < notifs.length - 1 && 'border-b border-border',
          )}
        >
          <label
            htmlFor={`notif-${n.id}`}
            className="min-w-0 pr-4 cursor-pointer text-text"
          >
            <div className="text-sm font-semibold text-text">{n.label}</div>
            <div className="mt-1 text-xs leading-snug text-text-weaker">
              {n.desc}
            </div>
          </label>
          <Toggle
            id={`notif-${n.id}`}
            enabled={n.enabled}
            onToggle={() => onToggle(n.id)}
            aria-label={`${n.label} notifications`}
          />
        </div>
      ))}
    </div>
  );
};
