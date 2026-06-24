/**
 * ChatAvatar
 *
 * Displays a small circular avatar inside the chatbot interface.
 * The 'ai' variant uses the TalkUp gradient with a "T" initial.
 * The 'user' variant uses a neutral background with a "U" initial.
 *
 * @param props - ChatAvatarProps
 * @returns A circular avatar badge as a React functional component.
 *
 * @example
 * <ChatAvatar variant="ai" />
 * <ChatAvatar variant="user" size="lg" />
 */

interface ChatAvatarProps {
  /** 'ai' for the TalkUp assistant avatar, 'user' for the current user */
  variant: 'ai' | 'user';
  /** Visual size — 'sm' for message rows, 'lg' for the window header */
  size?: 'sm' | 'lg';
}

const sizeClasses = {
  sm: 'w-7 h-7 text-body-s',
  lg: 'w-9 h-9 text-body-m',
} as const;

export const ChatAvatar = ({ variant, size = 'sm' }: ChatAvatarProps) => {
  const isAi = variant === 'ai';

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex-shrink-0 flex items-center justify-center font-bold ${
        isAi
          ? 'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-success)] text-white'
          : 'bg-surface-raised text-text-weak'
      }`}
    >
      {isAi ? 'T' : 'U'}
    </div>
  );
};
