import { Toggle } from '../../atoms/profile-custom/Toggle';

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
  /** * Primary color for the active toggle state.
   * Defaults to the TalkUp brand blue (#2B70C9).
   */
  accentColor?: string;
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
export const NotifSettings = ({
  notifs,
  accentColor = '#2B70C9',
  onToggle,
}: NotifSettingsProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {notifs.map((n, i) => (
        <div
          key={n.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderBottom:
              i < notifs.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}
        >
          <div style={{ paddingRight: '16px' }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              {n.label}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-weaker)',
                marginTop: 4,
                lineHeight: '1.4',
              }}
            >
              {n.desc}
            </div>
          </div>
          <Toggle
            enabled={n.enabled}
            onToggle={() => onToggle(n.id)}
            accentColor={accentColor}
          />
        </div>
      ))}
    </div>
  );
};
