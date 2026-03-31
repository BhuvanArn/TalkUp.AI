interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  accentColor?: string;
}

export const Toggle = ({
  enabled,
  onToggle,
  accentColor = '#2B70C9',
}: ToggleProps) => {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: enabled ? accentColor : 'var(--color-background-secondary)',
        border: `0.5px solid ${enabled ? accentColor : 'var(--color-border-secondary)'}`,
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: 2,
          left: enabled ? 18 : 2,
          transition: 'left 0.2s',
        }}
      />
    </button>
  );
};
