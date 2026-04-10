import { useEffect, useState } from 'react';
import { ProgressBar } from '../../atoms/cv-import/ProgressBar';
import { AnalysisStatus } from '../../molecules/cv-import/AnalysisStatus';

/**
 * @interface AIProcessingOverlayProps
 * @description Properties for the AIProcessingOverlay component.
 */
interface AIProcessingOverlayProps {
  /** Callback function triggered once the progress bar reaches 100% */
  onFinished: () => void;
}

/**
 * AIProcessingOverlay Organism
 * @description Manages the "Step 2: Analysis" UI logic. It simulates an AI processing 
 * phase by cycling through status messages and incrementing a progress bar.
 * * @param {AIProcessingOverlayProps} props - Component props.
 * @returns {JSX.Element} A full-screen fixed overlay with a progress indicator.
 */
export const AIProcessingOverlay = ({
  onFinished,
}: AIProcessingOverlayProps) => {
  /** * @type {number} 
   * Current progress percentage (0-100).
   */
  const [progress, setProgress] = useState(0);

  /** * @type {string} 
   * Current status message being displayed to the user.
   */
  const [currentMessage, setCurrentMessage] = useState(
    'Initializing AI Engine...',
  );

  /** * @constant {string[]} 
   * List of sequential messages to display during the simulation.
   */
  const messages = [
    'Reading CV structure...',
    'Extracting key skills...',
    'Analyzing job requirements...',
    'Comparing experiences with job keywords...',
    'Calculating matching score...',
    'Generating final report...',
  ];

  /**
   * Effect hook to run the progress simulation.
   * Increments progress every 100ms and updates the message index.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Stop simulation at 100% and trigger final callback
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinished, 500); // Slight delay for smoother transition
          return 100;
        }

        // Calculate which message to show based on progress percentage
        const msgIndex = Math.floor((prev / 100) * messages.length);
        setCurrentMessage(messages[msgIndex] || messages[messages.length - 1]);

        return prev + 2;
      });
    }, 100);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [onFinished]);

  return (
    <div style={overlayStyle}>
      <div style={contentBox}>
        <h2 style={{ marginBottom: '24px' }}>Analyse TalkUp.AI en cours</h2>
        
        <AnalysisStatus message={currentMessage} />
        
        <div style={{ marginTop: '24px' }}>
          <ProgressBar progress={progress} />
          <p
            style={{
              textAlign: 'right',
              fontSize: '12px',
              marginTop: '8px',
              color: '#64748B',
            }}
          >
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
};

/** @type {React.CSSProperties} Styles for the full-screen background */
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

/** @type {React.CSSProperties} Styles for the central information card */
const contentBox: React.CSSProperties = {
  width: '100%',
  maxWidth: '500px',
  padding: '40px',
  backgroundColor: 'white',
  borderRadius: '24px',
  textAlign: 'center',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};