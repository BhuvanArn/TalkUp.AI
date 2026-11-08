/**
 * Defines the props for the TranscriptionBubble component.
 */
export interface TranscriptionProps {
  /**
   * Whether the speaker is the AI or the user.
   * Determines the color and alignment of the bubble, and the speaker label
   * (translated at render, so it follows a language switch).
   */
  isIA: boolean;
  /**
   * The text content of the spoken message.
   */
  text: string;
}
