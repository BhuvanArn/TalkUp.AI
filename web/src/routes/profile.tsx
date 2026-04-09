import { Topbar } from '@/components/organisms/profile-custom/Topbar';
import { ApparenceSettings } from '@/components/organisms/profile-settings/ApparenceSettings';
import { GeneralSettings } from '@/components/organisms/profile-settings/GeneralSettings';
import { NotifSettings } from '@/components/organisms/profile-settings/NotifSettings';
import { BANNER_PRESETS } from '@/components/organisms/profile-settings/constants';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/profile')({
  beforeLoad: createAuthGuard('/profile'),
  component: Profile,
});

const THEME_ACCENT = '#2B70C9';
type Tab = 'general' | 'apparence' | 'notifs';

interface NotifSetting {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
}

const DEFAULT_NOTIFS: NotifSetting[] = [
  {
    id: 'training',
    label: "Rappels d'entraînement",
    desc: 'Notification quotidienne pour pratiquer',
    enabled: true,
  },
  {
    id: 'recruiters',
    label: 'Messages',
    desc: "Alertes lors d'un nouveau message",
    enabled: true,
  },
  {
    id: 'simulations',
    label: 'Résultats de simulation',
    desc: 'Rapport après chaque simulation',
    enabled: true,
  },
  {
    id: 'updates',
    label: 'Nouveautés TalkUp',
    desc: 'Nouveaux outils et fonctionnalités',
    enabled: false,
  },
  {
    id: 'weekly',
    label: 'Résumé hebdomadaire',
    desc: 'Récapitulatif de ta progression chaque lundi',
    enabled: true,
  },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'Général' },
  { key: 'apparence', label: 'Apparence' },
  { key: 'notifs', label: 'Notifications' },
];

function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [firstName, setFirstName] = useState('Adam');
  const [lastName, setLastName] = useState('Bouffy');
  const [bio, setBio] = useState(
    "Passionné par les langues et le management, je m'entraîne pour mes futurs entretiens.",
  );
  const [phoneNumber, setPhoneNumber] = useState('+33 6 00 00 00 00');
  const [avatarColor, setAvatarColor] = useState(THEME_ACCENT);
  const [bannerGradient, setBanner] = useState<string>(BANNER_PRESETS[0].value);
  const [notifs, setNotifs] = useState<NotifSetting[]>(DEFAULT_NOTIFS);
  const [saved, setSaved] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initials =
    (firstName[0] || 'A').toUpperCase() + (lastName[0] || 'B').toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(
    () => () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    },
    [],
  );

  const handleSave = () => {
    setSaved(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotif = (id: string) =>
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    );

  const cycleBanner = () => {
    const idx = BANNER_PRESETS.findIndex((b) => b.value === bannerGradient);
    setBanner(BANNER_PRESETS[(idx + 1) % BANNER_PRESETS.length].value);
  };

  return (
    <div
      className="p-2"
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Topbar
          breadcrumb={['Settings', 'My Profile']}
          onSave={handleSave}
          isSaved={saved}
          accentColor="var(--color-accent)"
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h1 style={srOnlyStyle}>Profile</h1>

            <div style={headerCardStyle}>
              <div
                style={{
                  height: 130,
                  background: bannerGradient,
                  position: 'relative',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={cycleBanner}
                  style={bannerBtnStyle}
                  data-testid="banner-style-button"
                  aria-label="Changer le style de bannière"
                >
                  Changer le style
                </button>
              </div>

              <div
                style={{
                  position: 'relative',
                  textAlign: 'center',
                  paddingTop: 52,
                  paddingBottom: 12,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -48,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                  ref={menuRef}
                >
                  <div
                    style={{
                      ...avatarCircleStyle,
                      background: avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    data-testid="user-avatar-initials"
                  >
                    {initials}
                  </div>
                  <button
                    onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                    style={{
                      ...cameraBtnStyle,
                      borderColor: avatarColor,
                      color: avatarColor,
                    }}
                    data-testid="avatar-camera-button"
                    aria-label="Changer la photo de profil"
                  >
                    <Camera size={13} strokeWidth={2.5} />
                  </button>

                  {showAvatarMenu && (
                    <div
                      style={dropdownStyle}
                      data-testid="avatar-dropdown-menu"
                    >
                      <button
                        style={{
                          ...dropdownItemStyle,
                          background:
                            hoveredItem === 'choose'
                              ? 'var(--color-surface-raised-hover)'
                              : 'transparent',
                        }}
                        onMouseEnter={() => setHoveredItem('choose')}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        <ImageIcon size={14} /> Choisir une photo
                      </button>
                      <button
                        style={{
                          ...dropdownItemStyle,
                          background:
                            hoveredItem === 'take'
                              ? 'var(--color-surface-raised-hover)'
                              : 'transparent',
                        }}
                        onMouseEnter={() => setHoveredItem('take')}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        <Camera size={14} /> Prendre une photo
                      </button>
                      <div
                        style={{
                          height: '1px',
                          background: 'var(--color-border)',
                          margin: '4px 0',
                        }}
                      />
                      <button
                        style={{
                          ...dropdownItemStyle,
                          color: '#EF4444',
                          background:
                            hoveredItem === 'delete'
                              ? 'var(--color-error-weaker)'
                              : 'transparent',
                        }}
                        onMouseEnter={() => setHoveredItem('delete')}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  )}
                </div>

                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    margin: 0,
                  }}
                >
                  {firstName} {lastName}
                </h2>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-weaker)',
                    marginTop: 4,
                  }}
                >
                  Candidat Product Manager · TalkUp Pro
                </div>
              </div>

              <div style={tabsBarStyle} role="tablist">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={activeTab === key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      ...tabBtnStyle,
                      color:
                        activeTab === key
                          ? 'var(--color-text)'
                          : 'var(--color-text-weaker)',
                      borderBottom: `2.5px solid ${activeTab === key ? 'var(--color-accent)' : 'transparent'}`,
                    }}
                    data-testid={`tab-${key}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '300px 1fr',
                gap: 24,
                alignItems: 'start',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div style={sideCardStyle}>
                  <div style={cardTitleStyle}>Introduction</div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text-weaker)',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>Profil de l'utilisateur :</strong> {bio}
                  </p>
                </div>

                <div
                  style={{
                    ...sideCardStyle,
                    background: `linear-gradient(135deg, ${THEME_ACCENT} 0%, #1E40AF 100%)`,
                    color: 'white',
                    border: 'none',
                  }}
                >
                  <div
                    style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}
                  >
                    Objectif
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: '78%',
                        height: '100%',
                        background: 'white',
                        borderRadius: 10,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 6,
                      opacity: 0.8,
                      textAlign: 'right',
                    }}
                  >
                    78%
                  </div>
                </div>
              </div>

              <div style={settingsPanelStyle}>
                {activeTab === 'general' && (
                  <GeneralSettings
                    firstName={firstName}
                    lastName={lastName}
                    bio={bio}
                    phoneNumber={phoneNumber}
                    avatarColor={avatarColor}
                    onFirstNameChange={setFirstName}
                    onLastNameChange={setLastName}
                    onBioChange={setBio}
                    onPhoneNumberChange={setPhoneNumber}
                  />
                )}
                {activeTab === 'apparence' && (
                  <ApparenceSettings
                    avatarColor={avatarColor}
                    bannerGradient={bannerGradient}
                    initials={initials}
                    onColorChange={setAvatarColor}
                    onBannerChange={setBanner}
                  />
                )}
                {activeTab === 'notifs' && (
                  <NotifSettings
                    notifs={notifs}
                    accentColor="var(--color-accent)"
                    onToggle={toggleNotif}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const srOnlyStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
};
const headerCardStyle: CSSProperties = {
  background: 'var(--color-background)',
  borderRadius: 16,
  border: '0.5px solid var(--color-border)',
  overflow: 'hidden',
  marginBottom: 24,
};
const bannerBtnStyle: CSSProperties = {
  position: 'absolute',
  bottom: 10,
  right: 12,
  padding: '4px 10px',
  fontSize: 11,
  borderRadius: 6,
  background: 'rgba(0,0,0,0.3)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
};
const avatarCircleStyle: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: '50%',
  border: '4px solid var(--color-background)',
  fontSize: 28,
  fontWeight: 800,
  color: 'white',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};
const cameraBtnStyle: CSSProperties = {
  position: 'absolute',
  bottom: 2,
  right: 2,
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'var(--color-background)',
  borderStyle: 'solid',
  borderWidth: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  zIndex: 10,
};
const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: '110%',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--color-background)',
  borderRadius: 10,
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  border: '1px solid var(--color-border)',
  padding: '6px',
  minWidth: '180px',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
};
const dropdownItemStyle: CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  color: 'var(--color-text)',
  border: 'none',
  borderRadius: 6,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  transition: 'background-color 0.2s ease',
};
const tabsBarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  borderTop: '0.5px solid var(--color-border)',
  marginTop: 12,
};
const tabBtnStyle: CSSProperties = {
  padding: '14px 22px',
  fontSize: 13,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};
const sideCardStyle: CSSProperties = {
  background: 'var(--color-background)',
  borderRadius: 12,
  padding: 20,
  border: '0.5px solid var(--color-border)',
};
const cardTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: 10,
};
const settingsPanelStyle: CSSProperties = {
  background: 'var(--color-background)',
  borderRadius: 16,
  padding: '32px',
  border: '0.5px solid var(--color-border)',
  minHeight: 500,
};

export default Profile;
