/**
 * @interface ProgressBarProps
 * @property {number} progress - Progress percentage (0 to 100).
 */
interface ProgressBarProps {
  progress: number;
}

/**
 * ProgressBar Atom
 * @description A horizontal bar that fills up based on the progress percentage.
 */
export const ProgressBar = ({ progress }: ProgressBarProps) => (
  <div style={container}>
    <div style={{ ...fill, width: `${progress}%` }} />
  </div>
);

const container: React.CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: '#E2E8F0',
  borderRadius: '4px',
  overflow: 'hidden',
};

const fill: React.CSSProperties = {
  height: '100%',
  backgroundColor: '#2B70C9',
  transition: 'width 0.4s ease-out',
};
