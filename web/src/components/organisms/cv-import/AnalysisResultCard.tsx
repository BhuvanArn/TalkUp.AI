/**
 * @interface AnalysisResultProps
 * @property {number} score - The matching percentage (0-100).
 * @property {string[]} missingSkills - List of keywords found in job but not in CV.
 * @property {string[]} strengths - List of matching high-value skills.
 */
interface AnalysisResultProps {
  score: number;
  missingSkills: string[];
  strengths: string[];
  onRetry: () => void;
}

/**
 * AnalysisResultCard Organism
 * @description Displays the final AI matching report with score and skill gaps.
 */
export const AnalysisResultCard = ({
  score,
  missingSkills,
  strengths,
  onRetry,
}: AnalysisResultProps) => {
  return (
    <div style={resultContainer}>
      {/* Circle Score */}
      <div style={scoreCircle}>
        <span style={{ fontSize: '48px', fontWeight: 800, color: '#2B70C9' }}>
          {score}%
        </span>
        <span style={{ fontSize: '14px', color: '#64748B' }}>Match Score</span>
      </div>

      <div style={detailsGrid}>
        {/* Strengths */}
        <div style={detailsBox}>
          <h4 style={{ color: '#1D9E75', marginBottom: '12px' }}>
            Points Forts ✅
          </h4>
          <ul style={listStyle}>
            {strengths.map((s) => (
              <li key={s} style={itemStyle}>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Gaps */}
        <div style={detailsBox}>
          <h4 style={{ color: '#EF4444', marginBottom: '12px' }}>
            Mots-clés manquants ❌
          </h4>
          <ul style={listStyle}>
            {missingSkills.map((s) => (
              <li key={s} style={itemStyle}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button onClick={onRetry} style={retryBtn}>
        Refaire une analyse
      </button>
    </div>
  );
};

// --- Styles ---
const resultContainer: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '32px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  maxWidth: '800px',
  margin: '0 auto',
  animation: 'fadeIn 0.5s ease',
};
const scoreCircle: React.CSSProperties = {
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  border: '8px solid #F0F9FF',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 32px',
};
const detailsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
  textAlign: 'left',
};
const detailsBox: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  padding: '20px',
  borderRadius: '16px',
};
const listStyle: React.CSSProperties = {
  padding: 0,
  listStyle: 'none',
  margin: 0,
};
const itemStyle: React.CSSProperties = {
  fontSize: '14px',
  marginBottom: '8px',
  paddingLeft: '12px',
  borderLeft: '2px solid #CBD5E1',
};
const retryBtn: React.CSSProperties = {
  marginTop: '32px',
  background: 'none',
  border: 'none',
  color: '#2B70C9',
  cursor: 'pointer',
  fontWeight: 600,
  textDecoration: 'underline',
};
