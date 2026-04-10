
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { AIProcessingOverlay } from '../components/organisms/cv-import/AIProcessingOverlay';
import { AnalysisResultCard } from '../components/organisms/cv-import/AnalysisResultCard';
import { UploaderCard } from '../components/organisms/cv-import/UploaderCard';

/**
 * @route /cv-analysis
 * @description Main route for CV and Job Offer URL matching.
 * Orchestrates the 3 steps: Upload, AI Web Scraping/Analysis, and Results.
 */
export const Route = createFileRoute('/cv-analysis')({
  component: CVAnalysisPage,
});

function CVAnalysisPage() {
  // --- States ---
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState(''); // Updated from jobText to jobUrl
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  /**
   * Mock data for AI analysis results.
   */
  const [analysisResult, setAnalysisResult] = useState({
    score: 0,
    strengths: [] as string[],
    missingSkills: [] as string[],
  });

  // --- Handlers ---

  /**
   * Starts the AI process. 
   * Validation check for both a file and a valid-looking URL.
   */
  const handleStartAnalysis = () => {
    if (cvFile && jobUrl.trim().startsWith('http')) {
      setIsAnalyzing(true);

      // Simulate receiving data from AI (After scraping the URL)
      setAnalysisResult({
        score: 82,
        strengths: [
          'React.js Expertise',
          'TypeScript Mastery',
          'UI/UX Sensitivity',
        ],
        missingSkills: ['Next.js', 'Docker', 'Unit Testing'],
      });
    }
  };

  /**
   * Resets the analysis to start over.
   */
  const handleReset = () => {
    setIsFinished(false);
    setCvFile(null);
    setJobUrl('');
  };

  // --- Render ---

  return (
    <div style={pageContainer}>
      {/* 1. HEADER */}
      {!isFinished && (
        <header style={headerStyle}>
          <h1 style={titleStyle}>Analyse de Compatibilité</h1>
          <p style={subtitleStyle}>
            Importez votre CV et collez le lien de l'annonce pour l'analyse IA.
          </p>
        </header>
      )}

      {/* 2. STEP 2: AI PROCESSING OVERLAY */}
      {isAnalyzing && (
        <AIProcessingOverlay
          onFinished={() => {
            setIsAnalyzing(false);
            setIsFinished(true);
          }}
        />
      )}

      {/* 3. MAIN CONTENT */}
      {isFinished ? (
        <AnalysisResultCard
          score={analysisResult.score}
          strengths={analysisResult.strengths}
          missingSkills={analysisResult.missingSkills}
          onRetry={handleReset}
        />
      ) : (
        <>
          <div style={mainGrid}>
            {/* Column 1: CV Upload */}
            <section style={columnStyle}>
              <h2 style={sectionTitle}>1. Votre CV</h2>
              {!cvFile ? (
                <UploaderCard onFileSelect={(file) => setCvFile(file)} />
              ) : (
                <div style={fileSuccessCard}>
                  <div style={fileIconCircle}>📄</div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: '14px' }}>
                      {cvFile.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                      {(cvFile.size / 1024 / 1024).toFixed(2)} MB • Prêt
                    </p>
                  </div>
                  <button onClick={() => setCvFile(null)} style={removeBtn}>
                    Supprimer
                  </button>
                </div>
              )}
            </section>

            {/* Column 2: Job URL Input */}
            <section style={columnStyle}>
              <h2 style={sectionTitle}>2. L'Annonce (Lien)</h2>
              <div style={jobCard}>
                <div style={urlInputWrapper}>
                  <span style={{ fontSize: '18px' }}>🔗</span>
                  <input
                    type="url"
                    style={urlInputStyle}
                    placeholder="Collez le lien de l'offre (LinkedIn, WTTJ...)"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                  />
                </div>
                <p style={helperText}>
                  TalkUp.AI extraira automatiquement les détails de l'offre.
                </p>
              </div>
            </section>
          </div>

          {/* Action Footer */}
          <footer style={footerStyle}>
            <button
              onClick={handleStartAnalysis}
              disabled={!cvFile || !jobUrl.trim().startsWith('http')}
              style={{
                ...analyzeButton,
                backgroundColor:
                  cvFile && jobUrl.trim().startsWith('http') ? '#1D9E75' : '#CBD5E1',
                cursor:
                  cvFile && jobUrl.trim().startsWith('http')
                    ? 'pointer'
                    : 'not-allowed',
              }}
            >
              Lancer l'analyse TalkUp 🚀
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

// --- Updated Styles ---

const pageContainer: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  minHeight: '100vh',
  padding: '60px 20px',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '48px',
};
const titleStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 800,
  color: '#0F172A',
};
const subtitleStyle: React.CSSProperties = {
  color: '#64748B',
  marginTop: '8px',
};

const mainGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '32px',
  maxWidth: '1100px',
  margin: '0 auto',
};

const columnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};
const sectionTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#1E293B',
};

const fileSuccessCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '24px',
  backgroundColor: '#F0FDF4',
  border: '2px solid #1D9E75',
  borderRadius: '24px',
  minHeight: '110px'
};

const fileIconCircle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  backgroundColor: '#DCFCE7',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
};

const removeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#EF4444',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '13px',
};

const jobCard: React.CSSProperties = {
  backgroundColor: '#FFF',
  padding: '24px',
  borderRadius: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  border: '1px solid #F1F5F9',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '110px'
};

const urlInputWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '12px 16px',
};

const urlInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  background: 'transparent',
  fontSize: '14px',
  outline: 'none',
  color: '#1E293B',
};

const helperText: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8',
  marginTop: '10px',
  fontStyle: 'italic'
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '48px',
};

const analyzeButton: React.CSSProperties = {
  color: 'white',
  padding: '16px 56px',
  borderRadius: '16px',
  border: 'none',
  fontSize: '18px',
  fontWeight: 700,
  transition: '0.3s ease',
};