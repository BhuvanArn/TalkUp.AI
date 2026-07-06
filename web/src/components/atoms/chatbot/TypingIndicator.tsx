/**
 * TypingIndicator
 *
 * Displays an animated three-dot indicator to signal that the TalkUp AI
 * is currently generating a response. Uses CSS animations via Tailwind.
 *
 * @returns An animated typing indicator as a React functional component.
 *
 * @example
 * {isTyping && <TypingIndicator />}
 */

export const TypingIndicator = () => {
  return (
    <div
      className="flex items-center gap-1 px-3 py-2"
      // No own live region: this sits inside ChatWindow's role="log"
      // aria-live="polite" list, so a nested status region would
      // double-announce on some screen readers.
      aria-label="TalkUp AI is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-weaker animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
};
