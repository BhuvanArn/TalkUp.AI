import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { iconMap } from '../components/atoms/icon/icon-map';
import { AIProcessingOverlay } from '../components/organisms/cv-import/AIProcessingOverlay';
import { AnalysisResultCard } from '../components/organisms/cv-import/AnalysisResultCard';
import { UploaderCard } from '../components/organisms/cv-import/UploaderCard';

/**
 * @route /cv-analysis
 * @description Main route for CV and Job Offer matching analysis.
 * Orchestrates the three-step workflow: Document Upload, AI Web Scraping/Processing, and Results Display.
 */
export const Route = createFileRoute('/cv-analysis')({
  component: CVAnalysisPage,
});

/**
 * CVAnalysisPage Component
 * @description
 * Manages the global state and business logic for the CV analysis workflow.
 * Handles file management, URL tracking, and switching between the upload,
 * processing, and result screens.
 * * @returns {JSX.Element} The rendered CV Analysis page.
 */
function CVAnalysisPage() {
  const CvIcon = iconMap.cv;
  const LinkIcon = iconMap.search;
  const TrashIcon = iconMap.delete;

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  /**
   * Triggers the AI analysis process.
   * Validates that a file is uploaded and a valid URL is provided before starting.
   */
  const handleStartAnalysis = () => {
    if (cvFile && jobUrl.trim().startsWith('http')) {
      setIsAnalyzing(true);
    }
  };

  /**
   * Resets the analysis workflow and clears all local states.
   * Used to allow the user to analyze another profile.
   */
  const handleReset = () => {
    setIsFinished(false);
    setCvFile(null);
    setJobUrl('');
    setDeadline(null);
  };

  return (
    <div style={pageContainer}>
      {/* 1. HEADER - Hidden when results are shown */}
      {!isFinished && (
        <header style={headerStyle}>
          <h1 style={titleStyle}>Compatibility Analysis</h1>
          <p style={subtitleStyle}>
            Upload your CV and paste the job offer link to begin.
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
          onRetry={handleReset}
          onStartCourse={() => console.log('Navigating to course path...')}
        />
      ) : (
        <>
          <div style={mainGrid}>
            {/* Column 1: CV Upload & Deadline */}
            <section style={columnStyle}>
              <h2 style={sectionTitle}>1. Your CV</h2>
              {!cvFile ? (
                <UploaderCard
                  onFileSelect={(file) => setCvFile(file)}
                  deadline={deadline}
                  onDeadlineChange={(date) => setDeadline(date)}
                />
              ) : (
                <div style={fileSuccessCard}>
                  <div style={fileIconCircle}>
                    <CvIcon size={24} color="#1D9E75" />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: '14px' }}>
                      {cvFile.name}
                    </p>
                    <p
                      style={{ fontSize: '12px', color: '#64748B', margin: 0 }}
                    >
                      {(cvFile.size / 1024 / 1024).toFixed(2)} MB • Ready
                    </p>
                  </div>
                  <button onClick={() => setCvFile(null)} style={removeBtn}>
                    <TrashIcon size={16} style={{ marginRight: '4px' }} />
                    Remove
                  </button>
                </div>
              )}
            </section>

            {/* Column 2: Job URL Input */}
            <section style={columnStyle}>
              <h2 style={sectionTitle}>2. Job Offer (Link)</h2>
              <div style={jobCard}>
                <div style={urlInputWrapper}>
                  <LinkIcon size={18} color="#94A3B8" />
                  <input
                    type="url"
                    style={urlInputStyle}
                    placeholder="Paste LinkedIn, WTTJ link..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                  />
                </div>
                <p style={helperText}>
                  TalkUp will automatically extract details from the listing.
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
                  cvFile && jobUrl.trim().startsWith('http')
                    ? '#2B70C9'
                    : '#CBD5E1',
                cursor:
                  cvFile && jobUrl.trim().startsWith('http')
                    ? 'pointer'
                    : 'not-allowed',
              }}
            >
              Start TalkUp Analysis
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

/** @type {React.CSSProperties} Layout for the main page container */
const pageContainer: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  minHeight: '100vh',
  padding: '60px 20px',
  fontFamily: 'Inter, system-ui, sans-serif',
};

/** @type {React.CSSProperties} Centered header layout */
const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '48px',
};

/** @type {React.CSSProperties} Main title typography */
const titleStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 800,
  color: '#0F172A',
};

/** @type {React.CSSProperties} Subtitle typography */
const subtitleStyle: React.CSSProperties = {
  color: '#64748B',
  marginTop: '8px',
};

/** @type {React.CSSProperties} Grid layout for the two main sections */
const mainGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '32px',
  maxWidth: '1100px',
  margin: '0 auto',
};

/** @type {React.CSSProperties} Vertical column alignment */
const columnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

/** @type {React.CSSProperties} Section heading typography */
const sectionTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#1E293B',
};

/** @type {React.CSSProperties} Card style for a successfully uploaded file */
const fileSuccessCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '24px',
  backgroundColor: '#F0FDF4',
  border: '2px solid #1D9E75',
  borderRadius: '24px',
  minHeight: '110px',
};

/** @type {React.CSSProperties} Icon container for the file preview */
const fileIconCircle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  backgroundColor: '#DCFCE7',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/** @type {React.CSSProperties} Styling for the file removal button */
const removeBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: '#EF4444',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '13px',
};

/** @type {React.CSSProperties} Card container for the job URL input */
const jobCard: React.CSSProperties = {
  backgroundColor: '#FFF',
  padding: '24px',
  borderRadius: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  border: '1px solid #F1F5F9',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '110px',
};

/** @type {React.CSSProperties} Visual wrapper for the URL text field */
const urlInputWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '12px 16px',
};

/** @type {React.CSSProperties} The text input for the URL */
const urlInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  background: 'transparent',
  fontSize: '14px',
  outline: 'none',
  color: '#1E293B',
};

/** @type {React.CSSProperties} Small help text below inputs */
const helperText: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8',
  marginTop: '10px',
  fontStyle: 'italic',
};

/** @type {React.CSSProperties} Centered footer area */
const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '48px',
};

/** @type {React.CSSProperties} The primary button to start the analysis */
const analyzeButton: React.CSSProperties = {
  color: 'white',
  padding: '16px 56px',
  borderRadius: '16px',
  border: 'none',
  fontSize: '18px',
  fontWeight: 700,
  transition: '0.3s ease',
};
