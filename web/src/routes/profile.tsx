import { Button } from '@/components/atoms/profile-custom/Button';
import { Topbar } from '@/components/organisms/profile-custom/Topbar';
import { ApparenceSettings } from '@/components/organisms/profile-settings/ApparenceSettings';
import { GeneralSettings } from '@/components/organisms/profile-settings/GeneralSettings';
import { NotifSettings } from '@/components/organisms/profile-settings/NotifSettings';
import { createFileRoute } from '@tanstack/react-router';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Route definition for the Profile page.
 */
export const Route = createFileRoute('/profile')({
  component: Profile,
});

const THEME_ACCENT = 'rgb(43, 112, 201)';

type Tab = 'general' | 'apparence' | 'notifs';

interface NotifSetting {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
}

const BANNER_PRESETS = [
  { label: 'Minimal', value: 'rgb(255, 255, 255)' },
  {
    label: 'Océan',
    value:
      'linear-gradient(135deg, rgb(43, 112, 201) 0%, rgb(29, 158, 117) 100%)',
  },
  {
    label: 'Nuit',
    value:
      'linear-gradient(135deg, rgb(59, 31, 110) 0%, rgb(43, 112, 201) 100%)',
  },
];

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
  const [bannerGradient, setBanner] = useState(BANNER_PRESETS[0].value);
  const [notifs, setNotifs] = useState<NotifSetting[]>(DEFAULT_NOTIFS);
  const [saved, setSaved] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotif = (id: string) =>
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'rgb(244, 247, 251)',
      }}
    >
      <div
        style={{
          flex: '1 1 0%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Topbar
          breadcrumb={['Paramètres', 'Mon Profil']}
          onSave={handleSave}
          isSaved={saved}
        />

        <div
          style={{ flex: '1 1 0%', overflowY: 'auto', padding: '28px 32px' }}
        >
          <div style={{ maxWidth: '1100px', margin: '0px auto' }}>
            {/* CRITIQUE POUR LES TESTS : Titre principal attendu par getByRole */}
            <h1 style={srOnlyStyle}>Profile</h1>

            <div style={headerCardStyle}>
              <div
                style={{
                  height: '130px',
                  background: bannerGradient,
                  position: 'relative',
                  borderBottom: '1px solid rgb(229, 231, 235)',
                }}
              >
                <button
                  onClick={() =>
                    setBanner(
                      BANNER_PRESETS[Math.floor(Math.random() * 3)].value,
                    )
                  }
                  style={bannerBtnStyle}
                >
                  Changer le style
                </button>
              </div>

              <div
                style={{
                  position: 'relative',
                  textAlign: 'center',
                  paddingTop: '52px',
                  paddingBottom: '12px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-48px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                  ref={menuRef}
                >
                  <div
                    style={{ ...avatarCircleStyle, background: avatarColor }}
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
                  >
                    <Camera size={13} strokeWidth={2.5} />
                  </button>

                  {showAvatarMenu && (
                    <div style={dropdownStyle}>
                      <button
                        style={{
                          ...dropdownItemStyle,
                          background:
                            hoveredItem === 'choose' ? '#F3F4F6' : 'none',
                        }}
                        onMouseEnter={() => setHoveredItem('choose')}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <ImageIcon size={14} /> Choisir une photo
                      </button>
                      <button
                        style={{
                          ...dropdownItemStyle,
                          background:
                            hoveredItem === 'take' ? '#F3F4F6' : 'none',
                        }}
                        onMouseEnter={() => setHoveredItem('take')}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <Camera size={14} /> Prendre une photo
                      </button>
                      <div
                        style={{
                          height: '1px',
                          background: '#F3F4F6',
                          margin: '4px 0',
                        }}
                      />
                      <button
                        style={{
                          ...dropdownItemStyle,
                          color: '#EF4444',
                          background:
                            hoveredItem === 'delete' ? '#FEF2F2' : 'none',
                        }}
                        onMouseEnter={() => setHoveredItem('delete')}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  )}
                </div>

                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'rgb(17, 24, 39)',
                    margin: '0px',
                  }}
                >
                  {firstName} {lastName}
                </h2>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'rgb(107, 114, 128)',
                    marginTop: '4px',
                    fontWeight: 500,
                  }}
                >
                  Candidat Product Manager · TalkUp Pro
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '40px',
                    marginTop: '20px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'rgb(17, 24, 39)',
                      }}
                    >
                      12
                    </div>
                    <div style={statLabelStyle}>Simulations</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: THEME_ACCENT,
                      }}
                    >
                      78%
                    </div>
                    <div style={statLabelStyle}>Score</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'rgb(17, 24, 39)',
                      }}
                    >
                      4
                    </div>
                    <div style={statLabelStyle}>Parcours</div>
                  </div>
                </div>
              </div>

              <div style={tabsBarStyle}>
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      ...tabBtnStyle,
                      color:
                        activeTab === key
                          ? 'rgb(17, 24, 39)'
                          : 'rgb(107, 114, 128)',
                      borderBottom: `2.5px solid ${activeTab === key ? THEME_ACCENT : 'transparent'}`,
                    }}
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
                gap: '24px',
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <div style={sideCardStyle}>
                  <div style={cardTitleStyle}>Introduction</div>
                  {/* CRITIQUE POUR LES TESTS : screen.findByText(/Profil de l'utilisateur/i) */}
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgb(107, 114, 128)',
                      lineHeight: 1.6,
                      marginBottom: '16px',
                    }}
                  >
                    <strong>Profil de l'utilisateur :</strong> {bio}
                  </p>
                  <Button
                    variant="ghost"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Modifier
                  </Button>
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
                  <NotifSettings notifs={notifs} onToggle={toggleNotif} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Styles Objects */
const srOnlyStyle: React.CSSProperties = {
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

const headerCardStyle: React.CSSProperties = {
  background: 'rgb(255, 255, 255)',
  borderRadius: '16px',
  border: '0.5px solid rgb(229, 231, 235)',
  overflow: 'hidden',
  marginBottom: '24px',
};

const bannerBtnStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  right: '12px',
  padding: '4px 10px',
  fontSize: '11px',
  borderRadius: '6px',
  background: 'rgba(0, 0, 0, 0.3)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
};

const avatarCircleStyle: React.CSSProperties = {
  width: '96px',
  height: '96px',
  borderRadius: '50%',
  border: '4px solid rgb(255, 255, 255)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '28px',
  fontWeight: 800,
  color: 'white',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const cameraBtnStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '2px',
  right: '2px',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'white',
  borderStyle: 'solid',
  borderWidth: '2px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  zIndex: 10,
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '110%',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'white',
  borderRadius: '10px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  border: '1px solid #E5E7EB',
  padding: '6px',
  minWidth: '180px',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
};

const dropdownItemStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '13px',
  color: '#374151',
  border: 'none',
  borderRadius: '6px',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgb(107, 114, 128)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: 600,
  marginTop: '2px',
};

const tabsBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '4px',
  borderTop: '1px solid rgb(243, 244, 246)',
  marginTop: '12px',
};

const tabBtnStyle: React.CSSProperties = {
  padding: '14px 22px',
  fontSize: '13px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 500,
};

const sideCardStyle: React.CSSProperties = {
  background: 'rgb(255, 255, 255)',
  borderRadius: '12px',
  padding: '20px',
  border: '0.5px solid rgb(229, 231, 235)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'rgb(17, 24, 39)',
  marginBottom: '10px',
};

const settingsPanelStyle: React.CSSProperties = {
  background: 'rgb(255, 255, 255)',
  borderRadius: '16px',
  padding: '32px',
  border: '0.5px solid rgb(229, 231, 235)',
  minHeight: '500px',
};

export default Profile;
