interface ProgressBarProps {
    progress: number;
    color: string;
}

export const ProgressBar = ({ progress, color }: ProgressBarProps) => {
  return (
    <div style={{ 
      height: 5, 
      borderRadius: 3, 
      background: "var(--color-background-secondary)", 
      marginTop: 8, 
      overflow: "hidden" 
    }}>
      <div style={{ 
        height: "100%", 
        borderRadius: 3, 
        background: color, 
        width: `${progress}%`,
        transition: "width 0.3s ease-in-out" 
      }} />
    </div>
  );
};
