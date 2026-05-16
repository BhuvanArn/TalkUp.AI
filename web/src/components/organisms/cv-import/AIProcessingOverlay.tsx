import { useEffect, useMemo, useState } from 'react';

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
 * @param {AIProcessingOverlayProps} props - Component props.
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
   * Wrapped in useMemo to prevent unnecessary re-runs of the useEffect hook.
   */
  const messages = useMemo(
    () => [
      'Reading CV structure...',
      'Extracting key skills...',
      'Analyzing job requirements...',
      'Comparing experiences with job keywords...',
      'Calculating matching score...',
      'Generating final report...',
    ],
    [],
  );

  /**
   * Effect hook to run the progress simulation.
   * Increments progress every 100ms and updates the message index.
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Si on est déjà à 100 ou plus, on arrête tout
        if (prev >= 100) {
          clearInterval(interval);
          timeoutId = setTimeout(onFinished, 500);
          return 100;
        }

        // On calcule la prochaine étape sans jamais dépasser 100
        const nextProgress = Math.min(prev + 2, 100);

        // Mise à jour du message en fonction de la progression réelle corrigée
        const msgIndex = Math.floor((nextProgress / 100) * messages.length);
        setCurrentMessage(messages[msgIndex] || messages[messages.length - 1]);

        return nextProgress;
      });
    }, 100);

    // Nettoyage de l'intervalle ET du timeout au démontage du composant
    return () => {
      clearInterval(interval);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onFinished, messages]);

  return (
    <div style={overlayStyle}>
      <div style={contentBox}>
        <h2 style={{ marginBottom: '24px' }}>Analys TalkUp.AI in processe</h2>

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
