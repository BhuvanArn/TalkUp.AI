/**
 * @interface AnalysisStatusProps
 * @property {string} message - The current status message (e.g., "Extracting skills...").
 */
interface AnalysisStatusProps {
  message: string;
}

/**
 * AnalysisStatus Molecule
 * @description Combines a spinning loader icon with dynamic AI status messages.
 */
export const AnalysisStatus = ({ message }: AnalysisStatusProps) => (
  <div className="p-5 text-center">
    <div
      className="border-surface-raised border-t-accent mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4"
      aria-hidden="true"
    />
    <p className="text-body-l text-text font-medium">{message}</p>
  </div>
);
