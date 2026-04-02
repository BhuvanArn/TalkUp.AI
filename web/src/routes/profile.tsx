import { Topbar } from '@/components/organisms/profile-custom/Topbar';
import { ApparenceSettings } from '@/components/organisms/profile-settings/ApparenceSettings';
import { GeneralSettings } from '@/components/organisms/profile-settings/GeneralSettings';
import { NotifSettings } from '@/components/organisms/profile-settings/NotifSettings';
import { createFileRoute } from '@tanstack/react-router';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * @description TanStack Router route definition for the Profile page.
 */
export const Route = createFileRoute('/profile')({
  component: Profile,
});

/** @constant {string} THEME_ACCENT - Default brand color used for accents and buttons. */
const THEME_ACCENT = '#2B70C9';

/** @typedef {"general" | "apparence" | "notifs"} Tab - Valid keys for navigation tabs. */
type Tab = 'general' | 'apparence' | 'notifs';

/**
 * @interface NotifSetting
 * @description Structure for a notification preference item.
 */
interface NotifSetting {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
}

/** @constant {Array} BANNER_PRESETS - Background styles available for the profile header. */
const BANNER_PRESETS = [
  { label: 'Minimal', value: '#FFFFFF' },
  {
    label: 'Ocean',
    value: 'linear-gradient(135deg, #2B70C9 0%, #1D9E75 100%)',
  },
  {
    label: 'Night',
    value: 'linear-gradient(135deg, #3b1f6e 0%, #2B70C9 100%)',
  },
];

/** @constant {NotifSetting[]} DEFAULT_NOTIFS - Initial state for user notification settings. */
const DEFAULT_NOTIFS: NotifSetting[] = [
  {
    id: 'training',
    label: 'Training Reminders',
    desc: 'Daily notification to practice',
    enabled: true,
  },
  {
    id: 'recruiters',
    label: 'Messages',
    desc: 'Alerts on new messages',
    enabled: true,
  },
  {
    id: 'simulations',
    label: 'Simulation Results',
    desc: 'Report after each simulation',
    enabled: true,
  },
  {
    id: 'updates',
    label: 'TalkUp News',
    desc: 'New tools and features',
    enabled: false,
  },
  {
    id: 'weekly',
    label: 'Weekly Summary',
    desc: 'Recap of progress every Monday',
    enabled: true,
  },
];

/** @constant {Array} TABS - Configuration for the horizontal navigation menu. */
const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'apparence', label: 'Appearance' },
  { key: 'notifs', label: 'Notifications' },
];

/**
 * Profile Component
 * @description Main dashboard for user settings including profile info, appearance, and notifications.
 * @returns {JSX.Element} The rendered Profile view.
 */
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

  /**
   * Effect to handle clicks outside the avatar menu to close it.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Simulates a save action and shows a success state in the Topbar.
   */
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /**
   * Toggles the enabled state of a specific notification setting.
   * @param {string} id - The unique identifier of the notification setting.
   */
  const toggleNotif = (id: string) =>
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    );

  /**
   * Cycles through the available banner presets.
   */
  const cycleBanner = () => {
    const idx = BANNER_PRESETS.findIndex((b) => b.value === bannerGradient);
    setBanner(BANNER_PRESETS[(idx + 1) % BANNER_PRESETS.length].value);
  };

  return (
    <div
      className="p-2"
      style={{ display: 'flex', height: '100vh', background: '#F4F7FB' }}
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
          accentColor={THEME_ACCENT}
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
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                <button onClick={cycleBanner} style={bannerBtnStyle}>
                  Change Style
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
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        <ImageIcon size={14} /> Choisir photo
                      </button>
                      <button
                        style={{
                          ...dropdownItemStyle,
                          background:
                            hoveredItem === 'take' ? '#F3F4F6' : 'none',
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
                    color: '#111827',
                    margin: 0,
                  }}
                >
                  {firstName} {lastName}
                </h2>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  Product Manager Candidate · TalkUp Pro
                </div>
              </div>

              <div style={tabsBarStyle}>
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      ...tabBtnStyle,
                      color: activeTab === key ? '#111827' : '#6B7280',
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
                gap: 24,
                alignItems: 'start',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div style={sideCardStyle}>
                  <div style={cardTitleStyle}>Introduction</div>
                  {/* CRITICAL FOR UNIT TESTS: Keep this specific text string */}
                  <p
                    style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}
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
                    Objectives
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
                    accentColor={THEME_ACCENT}
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
  background: '#FFF',
  borderRadius: 16,
  border: '0.5px solid #E5E7EB',
  overflow: 'hidden',
  marginBottom: 24,
};
const bannerBtnStyle: React.CSSProperties = {
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
const avatarCircleStyle: React.CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: '50%',
  border: '4px solid #FFF',
  fontSize: 28,
  fontWeight: 800,
  color: 'white',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};
const cameraBtnStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 2,
  right: 2,
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'white',
  borderStyle: 'solid',
  borderWidth: 2,
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
  borderRadius: 10,
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
  fontSize: 13,
  color: '#374151',
  border: 'none',
  borderRadius: 6,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  transition: 'background-color 0.2s ease',
};
const tabsBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  borderTop: '0.5px solid #F3F4F6',
  marginTop: 12,
};
const tabBtnStyle: React.CSSProperties = {
  padding: '14px 22px',
  fontSize: 13,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};
const sideCardStyle: React.CSSProperties = {
  background: '#FFF',
  borderRadius: 12,
  padding: 20,
  border: '0.5px solid #E5E7EB',
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
  marginBottom: 10,
};
const settingsPanelStyle: React.CSSProperties = {
  background: '#FFF',
  borderRadius: 16,
  padding: '32px',
  border: '0.5px solid #E5E7EB',
  minHeight: 500,
};

export default Profile;
