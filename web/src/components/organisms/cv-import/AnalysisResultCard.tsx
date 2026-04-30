export const AnalysisResultCard = ({
    onRetry,
    onStartCourse = () => console.log("Navigating to course..."),
  }: AnalysisResultProps) => {
    return (
      <div style={resultContainer}>
        {/* 1. Header avec Icône et Badge */}
        <div style={iconBadgeStyle}>
          <div style={checkCircle}>
            <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
              <path d="M2 7.5L7.5 13L18 2" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        <h2 style={finalTitle}>Analyse complétée !</h2>
        <p style={finalSubtitle}>
          Votre profil a été passé au crible. TalkUp a généré un plan d'action basé sur vos forces et les attentes du recruteur.
        </p>
  
        {/* 2. Éléments visuels qui "meublent" intelligemment (Les Highlights) */}
        <div style={highlightsGrid}>
          <div style={highlightItem}>
            <span style={highlightIcon}>✅</span>
            <span style={highlightText}>Compétences validées</span>
          </div>
          <div style={highlightItem}>
            <span style={highlightIcon}>📈</span>
            <span style={highlightText}>Parcours optimisé</span>
          </div>
          <div style={highlightItem}>
            <span style={highlightIcon}>🤖</span>
            <span style={highlightText}>IA personnalisée</span>
          </div>
        </div>
  
        {/* 3. Bloc de transition vers le parcours */}
        <div style={ctaBox}>
          <p style={ctaText}>Votre entraînement sur-mesure est prêt.</p>
          <button 
            onClick={onStartCourse} 
            style={primaryStartBtn}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e5bb3')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2B70C9')}
          >
            Débuter mon entraînement 🚀
          </button>
        </div>
        
        <button onClick={onRetry} style={retryLink}>
          Analyser un autre profil
        </button>
      </div>
    );
  };
  
  // --- Styles Enrichis ---
  
  const resultContainer: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '60px 48px',
    borderRadius: '32px',
    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
    maxWidth: '520px', // Un peu plus large pour accommoder la grille
    margin: '0 auto',
    animation: 'fadeIn 0.6s ease-out',
    border: '1px solid #F1F5F9', // Petite bordure pour définir la forme
  };
  
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
  
  const checkCircle: React.CSSProperties = {
    width: '40px', height: '40px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderRadius: '50%', border: '2px solid #1D9E75',
  };
  
  const finalTitle: React.CSSProperties = {
    fontSize: '28px', fontWeight: 800, color: '#0F172A', marginBottom: '12px',
  };
  
  const finalSubtitle: React.CSSProperties = {
    fontSize: '15px', color: '#64748B', marginBottom: '32px', lineHeight: '1.6',
  };
  
  /* La grille qui remplit l'espace */
  const highlightsGrid: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '40px',
  };
  
  const highlightItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '100px',
    border: '1px solid #E2E8F0',
  };
  
  const highlightIcon: React.CSSProperties = { fontSize: '14px' };
  const highlightText: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: '#475569' };
  
  const ctaBox: React.CSSProperties = {
    backgroundColor: '#F0F9FF', // Bloc bleu très clair pour isoler l'action
    padding: '32px',
    borderRadius: '24px',
    marginBottom: '24px',
  };
  
  const ctaText: React.CSSProperties = {
    fontSize: '16px', fontWeight: 700, color: '#0369A1', marginBottom: '20px',
  };
  
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
  
  const retryLink: React.CSSProperties = {
    background: 'none', border: 'none', color: '#94A3B8', 
    cursor: 'pointer', fontSize: '13px', textDecoration: 'underline',
  };