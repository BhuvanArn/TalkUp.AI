import { iconMap } from '../../atoms/icon/icon-map';

/**
 * Props for the AnalysisResultCard component.
 */
interface AnalysisResultProps {
  /** Callback function triggered when the user wants to perform a new analysis. */
  onRetry: () => void;
  /** Optional callback function to navigate the user to their generated course. */
  onStartCourse?: () => void;
}

/**
 * AnalysisResultCard Component
 * * @description
 * An organism component displayed after the AI has finished processing a user profile.
 * It features a success state badge, a summary of validated highlights (Skills, Path, AI),
 * and clear Call-to-Action (CTA) buttons to either start the training or restart the process.
 *
 * @param {AnalysisResultProps} props - The component props.
 * @returns {JSX.Element} A centered card containing the analysis results and actions.
 */
export const AnalysisResultCard = ({
  onRetry,
  onStartCourse = () => console.log('Navigating to course...'),
}: AnalysisResultProps) => {
  const SuccessIcon = iconMap['check-circle'];
  const SkillsIcon = iconMap['tasks'];
  const PathIcon = iconMap['progression'];
  const AiIcon = iconMap['cog'];
  const RetryIcon = iconMap['undo'];

  return (
    <div style={resultContainer}>
      {/* Main Success Badge */}
      <div style={iconBadgeStyle}>
        <div style={checkCircle}>
          <SuccessIcon size={24} color="#1D9E75" />
        </div>
      </div>

      <h2 style={finalTitle}>Analysis Complete!</h2>
      <p style={finalSubtitle}>
        Your profile has been fully processed. TalkUp has generated a
        personalized action plan based on your strengths and recruiter
        expectations.
      </p>

      {/* Highlights Grid */}
      <div style={highlightsGrid}>
        <div style={highlightItem}>
          <span style={highlightIcon}>
            <SkillsIcon />
          </span>
          <span style={highlightText}>Skills Validated</span>
        </div>
        <div style={highlightItem}>
          <span style={highlightIcon}>
            <PathIcon />
          </span>
          <span style={highlightText}>Optimized Path</span>
        </div>
        <div style={highlightItem}>
          <span style={highlightIcon}>
            <AiIcon />
          </span>
          <span style={highlightText}>Personalized AI</span>
        </div>
      </div>

      {/* Primary Action Zone */}
      <div style={ctaBox}>
        <p style={ctaText}>Your custom training is ready.</p>
        <button
          onClick={onStartCourse}
          style={primaryStartBtn}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = '#1e5bb3')
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = '#2B70C9')
          }
          onFocus={(e) => (e.currentTarget.style.backgroundColor = '#1e5bb3')}
          onBlur={(e) => (e.currentTarget.style.backgroundColor = '#2B70C9')}
        >
          Start My Training 🚀
        </button>
      </div>

      {/* Secondary Action Link */}
      <button onClick={onRetry} style={retryLink}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <RetryIcon size={14} />
          Analyze another profile
        </div>
      </button>
    </div>
  );
};

/** @type {React.CSSProperties} Main card container */
const resultContainer: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '60px 48px',
  borderRadius: '32px',
  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
  textAlign: 'center',
  maxWidth: '520px',
  margin: '0 auto',
  border: '1px solid #F1F5F9',
};

/** @type {React.CSSProperties} Background container for the success icon */
const iconBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F0FDF4',
  width: '80px',
  height: '80px',
  borderRadius: '28px',
  marginBottom: '24px',
};

/** @type {React.CSSProperties} Circular wrapper for the success checkmark */
const checkCircle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFF',
  borderRadius: '50%',
  boxShadow: '0 2px 8px rgba(29, 158, 117, 0.1)',
};

/** @type {React.CSSProperties} Main success heading */
const finalTitle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: '#0F172A',
  marginBottom: '12px',
};

/** @type {React.CSSProperties} Subtext description */
const finalSubtitle: React.CSSProperties = {
  fontSize: '15px',
  color: '#64748B',
  marginBottom: '32px',
  lineHeight: '1.6',
};

/** @type {React.CSSProperties} Layout grid for badge items */
const highlightsGrid: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  marginBottom: '40px',
};

/** @type {React.CSSProperties} Individual pill style for highlights */
const highlightItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  backgroundColor: '#F8FAFC',
  borderRadius: '100px',
  border: '1px solid #E2E8F0',
};

/** @type {React.CSSProperties} Icon styling within highlight pills */
const highlightIcon: React.CSSProperties = {
  display: 'flex',
  color: '#2B70C9',
  fontSize: '16px',
};

/** @type {React.CSSProperties} Text styling within highlight pills */
const highlightText: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#475569',
};

/** @type {React.CSSProperties} Container for the primary CTA section */
const ctaBox: React.CSSProperties = {
  backgroundColor: '#F0F9FF',
  padding: '32px',
  borderRadius: '24px',
  marginBottom: '24px',
};

/** @type {React.CSSProperties} Bold text inside CTA box */
const ctaText: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#0369A1',
  marginBottom: '20px',
};

/** @type {React.CSSProperties} Main action button styling */
const primaryStartBtn: React.CSSProperties = {
  backgroundColor: '#2B70C9',
  color: 'white',
  padding: '16px 32px',
  borderRadius: '14px',
  fontSize: '16px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  width: '100%',
  boxShadow: '0 4px 12px rgba(43, 112, 201, 0.2)',
};

/** @type {React.CSSProperties} Secondary text button styling */
const retryLink: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94A3B8',
  cursor: 'pointer',
  fontSize: '13px',
  textDecoration: 'underline',
};
