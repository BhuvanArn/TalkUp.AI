/**
 * ChatAvatar
 *
 * Displays a small circular avatar inside the chatbot interface.
 * The 'ai' variant uses the TalkUp gradient with a "T" initial.
 * The 'user' variant uses a neutral slate background with a "U" initial.
 *
 * @param props - ChatAvatarProps
 * @returns A circular avatar badge as a React functional component.
 *
 * @example
 * <ChatAvatar variant="ai" />
 * <ChatAvatar variant="user" />
 */

interface ChatAvatarProps {
  /** 'ai' for the TalkUp assistant avatar, 'user' for the current user */
  variant: 'ai' | 'user';
}

export const ChatAvatar = ({ variant }: ChatAvatarProps) => {
  const isAi = variant === 'ai';

  return (
    <div
      className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
        isAi
          ? 'bg-gradient-to-br from-[#2B70C9] to-[#1D9E75] text-white'
          : 'bg-slate-200 text-slate-600'
      }`}
    >
      {isAi ? 'T' : 'U'}
    </div>
  );
};
