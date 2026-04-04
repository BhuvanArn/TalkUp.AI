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
  <div style={{ textAlign: 'center', padding: '20px' }}>
    <div className="spinner" style={spinnerStyle} />
    <p style={messageStyle}>{message}</p>
  </div>
);

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '4px solid #F1F5F9',
  borderTop: '4px solid #2B70C9',
  borderRadius: '50%',
  margin: '0 auto 16px',
  animation: 'spin 1s linear infinite',
};

const messageStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#1E293B',
  fontWeight: 500,
};
