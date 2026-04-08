import type { CSSProperties } from 'react';

import { Avatar } from '../../atoms/profile-custom/Avatar';

interface SidebarProps {
  avatarColor: string;
  initials: string;
  name: string;
  email: string;
}

export const Sidebar = ({
  avatarColor,
  initials,
  name,
  email,
}: SidebarProps) => {
  const menuItems = [
    { icon: '◫', label: 'Applications' },
    { icon: '◷', label: 'Curriculum' },
    { icon: '◈', label: 'Agenda' },
    { icon: '✦', label: 'AI Chat' },
    { icon: '◎', label: 'Profil', active: true },
  ];

  return (
    <aside style={sidebarStyle}>
      <div style={logoSectionStyle}>
        <div style={{ ...logoIconStyle, background: avatarColor }}>t</div>
        <span style={logoTextStyle}>TALKUP</span>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {menuItems.map((item) => (
          <div
            key={item.label}
            style={{
              ...navItemStyle,
              color: item.active ? avatarColor : 'var(--color-text-secondary)',
              background: item.active ? `${avatarColor}18` : 'transparent',
            }}
          >
            <span style={{ width: 20 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div style={userSectionStyle}>
        <Avatar initials={initials} color={avatarColor} size={30} />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {email}
          </div>
        </div>
      </div>
    </aside>
  );
};

const sidebarStyle: CSSProperties = {
  width: 220,
  background: 'var(--color-background-primary)',
  borderRight: '0.5px solid var(--color-border-tertiary)',
  display: 'flex',
  flexDirection: 'column',
};

const logoSectionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '18px 16px',
  borderBottom: '0.5px solid var(--color-border-tertiary)',
};

const logoIconStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 700,
};

const logoTextStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: -0.3,
};

const navItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 8,
  fontSize: 13,
  cursor: 'pointer',
};

const userSectionStyle: CSSProperties = {
  padding: '12px 10px',
  borderTop: '0.5px solid var(--color-border-tertiary)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};
