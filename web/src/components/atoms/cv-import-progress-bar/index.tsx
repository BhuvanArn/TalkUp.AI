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
  <div
    className="bg-surface-raised h-2 w-full overflow-hidden rounded"
    role="progressbar"
    aria-valuenow={progress}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div
      className="bg-accent h-full rounded transition-[width] duration-300 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);
