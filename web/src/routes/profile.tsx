import { AppearanceSettings } from '@/components/organisms/profile-settings/AppearanceSettings';
import { GeneralSettings } from '@/components/organisms/profile-settings/GeneralSettings';
import { NotifSettings } from '@/components/organisms/profile-settings/NotifSettings';
import { BANNER_PRESETS } from '@/components/organisms/profile-settings/constants';
import {
  type UnsavedChangesCtaAnchorRect,
  UnsavedChangesCta,
} from '@/components/molecules/unsaved-changes-cta';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { Avatar } from '@/components/atoms/avatar';
import { Button } from '@/components/atoms/button';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export const Route = createFileRoute('/profile')({
  beforeLoad: createAuthGuard('/profile'),
  component: Profile,
});

const THEME_ACCENT = '#2B70C9';
type Tab = 'general' | 'appearance' | 'notifications';

interface NotifSetting {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
}

interface ProfileSnapshot {
  firstName: string;
  lastName: string;
  bio: string;
  phoneNumber: string;
  avatarColor: string;
  bannerGradient: string;
  notifs: NotifSetting[];
}

const DEFAULT_NOTIFS: NotifSetting[] = [
  {
    id: 'training',
    label: 'Training reminders',
    desc: 'Daily practice notification',
    enabled: true,
  },
  {
    id: 'recruiters',
    label: 'Messages',
    desc: 'Alerts for new messages',
    enabled: true,
  },
  {
    id: 'simulations',
    label: 'Simulation results',
    desc: 'Report after each simulation',
    enabled: true,
  },
  {
    id: 'updates',
    label: 'TalkUp updates',
    desc: 'New tools and features',
    enabled: false,
  },
  {
    id: 'weekly',
    label: 'Weekly summary',
    desc: 'Progress recap every Monday',
    enabled: true,
  },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'notifications', label: 'Notifications' },
];

function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [firstName, setFirstName] = useState('Adam');
  const [lastName, setLastName] = useState('Bouffy');
  const [bio, setBio] = useState(
    'Passionate about languages and management, practicing for future interviews.',
  );
  const [phoneNumber, setPhoneNumber] = useState('+33 6 00 00 00 00');
  const [avatarColor, setAvatarColor] = useState(THEME_ACCENT);
  const [bannerGradient, setBanner] = useState<string>(BANNER_PRESETS[0].value);
  const [notifs, setNotifs] = useState<NotifSetting[]>(DEFAULT_NOTIFS);
  const [saved, setSaved] = useState(false);
  const [ctaAttentionTick, setCtaAttentionTick] = useState(0);
  const [ctaAnchorRect, setCtaAnchorRect] =
    useState<UnsavedChangesCtaAnchorRect | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileColumnRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [snapshot, setSnapshot] = useState<ProfileSnapshot>({
    firstName: 'Adam',
    lastName: 'Bouffy',
    bio: 'Passionate about languages and management, practicing for future interviews.',
    phoneNumber: '+33 6 00 00 00 00',
    avatarColor: THEME_ACCENT,
    bannerGradient: BANNER_PRESETS[0].value,
    notifs: DEFAULT_NOTIFS,
  });

  const initials =
    (firstName[0] || 'A').toUpperCase() + (lastName[0] || 'B').toUpperCase();

  const currentSnapshot = useMemo<ProfileSnapshot>(
    () => ({
      firstName,
      lastName,
      bio,
      phoneNumber,
      avatarColor,
      bannerGradient,
      notifs,
    }),
    [firstName, lastName, bio, phoneNumber, avatarColor, bannerGradient, notifs],
  );

  const hasUnsavedChanges =
    JSON.stringify(currentSnapshot) !== JSON.stringify(snapshot);

  useLayoutEffect(() => {
    const el = profileColumnRef.current;
    if (!el) return;

    const updateAnchor = () => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0) {
        setCtaAnchorRect(null);
        return;
      }
      setCtaAnchorRect({ left: r.left, width: r.width });
    };

    updateAnchor();

    const resizeObservers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== 'undefined') {
      const roColumn = new ResizeObserver(updateAnchor);
      roColumn.observe(el);
      resizeObservers.push(roColumn);

      // When the profile column stays 1200px wide but recenters (e.g. sidebar toggle),
      // its width may not change — only `left` does. Observing `<main>` catches layout
      // width changes so the CTA recenters with the column.
      const mainEl = el.closest('main');
      if (mainEl) {
        const roMain = new ResizeObserver(updateAnchor);
        roMain.observe(mainEl);
        resizeObservers.push(roMain);
      }
    }

    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);

    return () => {
      resizeObservers.forEach((o) => o.disconnect());
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('scroll', updateAnchor, true);
    };
  }, []);

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
    setSnapshot(currentSnapshot);
    setSaved(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => setSaved(false), 2000);
  };

  const handleCancelChanges = () => {
    setFirstName(snapshot.firstName);
    setLastName(snapshot.lastName);
    setBio(snapshot.bio);
    setPhoneNumber(snapshot.phoneNumber);
    setAvatarColor(snapshot.avatarColor);
    setBanner(snapshot.bannerGradient);
    setNotifs(snapshot.notifs);
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
    <div className="p-6 bg-background text-text">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowY: 'auto' }}>
          <div
            ref={profileColumnRef}
            style={{ maxWidth: 1200, margin: '0 auto' }}
          >
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
                <Button
                  type="button"
                  onClick={cycleBanner}
                  variant="outlined"
                  color="neutral"
                  size="xs"
                  className="absolute bottom-2.5 right-3 border-border bg-background text-[11px] text-text"
                  data-testid="banner-style-button"
                  aria-label="Change banner style"
                >
                  Change style
                </Button>
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
                  <Avatar
                    data-testid="user-avatar-initials"
                    fallback={initials}
                    size="xl"
                    className="!h-24 !w-24 !border-4 !text-[28px] font-extrabold text-white shadow-md"
                    style={{
                      backgroundColor: avatarColor,
                      borderColor: 'var(--color-background)',
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                    variant="outlined"
                    color="neutral"
                    size="sm"
                    squared
                    circled
                    className="absolute bottom-0.5 right-0.5 z-10 !h-7 !w-7 min-h-0 min-w-0 border-2 bg-background p-0 shadow-md"
                    style={{ borderColor: avatarColor, color: avatarColor }}
                    data-testid="avatar-camera-button"
                    aria-label="Change profile picture"
                  >
                    <Camera size={13} strokeWidth={2.5} />
                  </Button>

                  {showAvatarMenu && (
                    <div
                      style={dropdownStyle}
                      data-testid="avatar-dropdown-menu"
                    >
                      <Button
                        type="button"
                        variant="text"
                        color="neutral"
                        className={cn(
                          'h-auto w-full justify-start rounded-md px-3 py-2.5 text-body-s text-text',
                          hoveredItem === 'choose' && 'bg-surface-raised-hover',
                        )}
                        onMouseEnter={() => setHoveredItem('choose')}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        <ImageIcon size={14} /> Choose photo
                      </Button>
                      <Button
                        type="button"
                        variant="text"
                        color="neutral"
                        className={cn(
                          'h-auto w-full justify-start rounded-md px-3 py-2.5 text-body-s text-text',
                          hoveredItem === 'take' && 'bg-surface-raised-hover',
                        )}
                        onMouseEnter={() => setHoveredItem('take')}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        <Camera size={14} /> Take photo
                      </Button>
                      <div className="my-1 h-px bg-border" />
                      <Button
                        type="button"
                        variant="text"
                        color="error"
                        className={cn(
                          'h-auto w-full justify-start rounded-md px-3 py-2.5 text-body-s',
                          hoveredItem === 'delete' && 'bg-error-weaker',
                        )}
                        onMouseEnter={() => setHoveredItem('delete')}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        <Trash2 size={14} /> Remove
                      </Button>
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
                  Product Manager Candidate · TalkUp Pro
                </div>
              </div>

              <div style={tabsBarStyle} role="tablist">
                {TABS.map(({ key, label }) => (
                  <Button
                    key={key}
                    type="button"
                    role="tab"
                    variant="text"
                    color="neutral"
                    aria-selected={activeTab === key}
                    onClick={() => {
                      if (hasUnsavedChanges && activeTab !== key) {
                        setCtaAttentionTick((prev) => prev + 1);
                        return;
                      }
                      setActiveTab(key);
                    }}
                    className={cn(
                      'rounded-none border-b-[2.5px] border-transparent px-5 py-3.5 text-[13px] font-normal',
                      activeTab === key
                        ? 'border-accent text-text'
                        : 'text-text-weaker',
                    )}
                    data-testid={`tab-${key}`}
                  >
                    {label}
                  </Button>
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
                    <strong>User profile :</strong> {bio}
                  </p>
                </div>

                <div
                  style={{
                    ...sideCardStyle,
                    background:
                      'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  <div
                    style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}
                  >
                    Goal
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
                    onFirstNameChange={setFirstName}
                    onLastNameChange={setLastName}
                    onBioChange={setBio}
                    onPhoneNumberChange={setPhoneNumber}
                  />
                )}
                {activeTab === 'appearance' && (
                  <AppearanceSettings
                    avatarColor={avatarColor}
                    bannerGradient={bannerGradient}
                    initials={initials}
                    onColorChange={setAvatarColor}
                    onBannerChange={setBanner}
                  />
                )}
                {activeTab === 'notifications' && (
                  <NotifSettings notifs={notifs} onToggle={toggleNotif} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <UnsavedChangesCta
        isVisible={hasUnsavedChanges}
        isSaved={saved}
        onSave={handleSave}
        onReset={handleCancelChanges}
        attentionTrigger={ctaAttentionTick}
        anchorRect={ctaAnchorRect}
      />
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
  background: 'var(--color-surface)',
  borderRadius: 16,
  border: '0.5px solid var(--color-border)',
  overflow: 'hidden',
  marginBottom: 24,
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
const tabsBarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  borderTop: '0.5px solid var(--color-border)',
  marginTop: 12,
};
const sideCardStyle: CSSProperties = {
  background: 'var(--color-surface)',
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
  background: 'var(--color-surface)',
  borderRadius: 16,
  padding: '32px',
  border: '0.5px solid var(--color-border)',
  minHeight: 500,
};

export default Profile;
