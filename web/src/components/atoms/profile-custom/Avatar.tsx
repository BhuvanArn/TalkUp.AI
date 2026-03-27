interface AvatarProps {
    initials: string;
    color: string;
    size?: number;
  }
  
  export const Avatar = ({ initials, color, size = 60 }: AvatarProps) => {
    const fontSize = size * 0.32;
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 700,
          color: "white",
          flexShrink: 0,
        }}
      >
        {initials.toUpperCase()}
      </div>
    );
  };