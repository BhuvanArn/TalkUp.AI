export const EVENT_COLORS = {
  blue: {
    hex: '#3B82F6',
    background: 'rgba(96, 165, 250, 0.20)',
    border: '#3B82F6',
  },
  green: {
    hex: '#1EBA5A',
    background: 'rgba(128.43, 222.17, 172.18, 0.20)',
    border: '#1EBA5A',
  },
  red: {
    hex: '#EF4444',
    background: 'rgba(248, 113, 113, 0.20)',
    border: '#EF4444',
  },
  purple: {
    hex: '#A855F7',
    background: 'rgba(196, 181, 253, 0.20)',
    border: '#A855F7',
  },
} as const;

export type EventColorName = keyof typeof EVENT_COLORS;

export const getEventColorNameFromHex = (hex: string): EventColorName => {
  const entry = Object.entries(EVENT_COLORS).find(
    ([_, value]) => value.hex === hex,
  );
  return entry ? (entry[0] as EventColorName) : 'blue';
};

export const getEventColorData = (color: string) => {
  // Check if it's a known hex
  const fromHex = Object.values(EVENT_COLORS).find((c) => c.hex === color);
  if (fromHex) return fromHex;

  // Check if it's a known name
  const fromName = EVENT_COLORS[color as EventColorName];
  if (fromName) return fromName;

  // Default
  return EVENT_COLORS.blue;
};
