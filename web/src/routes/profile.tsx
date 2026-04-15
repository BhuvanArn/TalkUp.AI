import { Avatar } from '@/components/atoms/avatar';
import { Button } from '@/components/atoms/button';
import {
  UnsavedChangesCta,
  type UnsavedChangesCtaAnchorRect,
} from '@/components/molecules/unsaved-changes-cta';
import { AppearanceSettings } from '@/components/organisms/profile-settings/AppearanceSettings';
import { GeneralSettings } from '@/components/organisms/profile-settings/GeneralSettings';
import { NotifSettings } from '@/components/organisms/profile-settings/NotifSettings';
import {
  type AccountSession,
  SecuritySettings,
} from '@/components/organisms/profile-settings/SecuritySettings';
import { BANNER_PRESETS } from '@/components/organisms/profile-settings/constants';
import AuthService from '@/services/auth/http';
import {
  deleteMyAccount,
  fetchMyProfile,
  updateMyProfile,
} from '@/services/users/http';
import type { ProfileVisibility, UserProfile } from '@/services/users/types';
import { createAuthGuard } from '@/utils/auth.guards';
import { cn } from '@/utils/cn';
import { resizeImageFileToJpegDataUrl } from '@/utils/resizeImageToJpegDataUrl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import {
  type CSSProperties,
  type ChangeEvent,
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
const DEFAULT_JOB_TITLE = 'Product Manager Candidate';
const SECURITY_SIGNIN_PREF_KEY = 'securityEmailOnNewDevice';
const authService = new AuthService();

type Tab = 'general' | 'appearance' | 'notifications' | 'security';

function namesFromUsername(username: string): { first: string; last: string } {
  const parts = username.split(/[.\s_]+/).filter(Boolean);
  if (parts.length === 0) {
    return { first: '', last: '' };
  }
  const cap = (s: string) =>
    s.length ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  if (parts.length === 1) {
    return { first: cap(parts[0]), last: '' };
  }
  return {
    first: cap(parts[0]),
    last: parts.slice(1).map(cap).join(' '),
  };
}

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
  linkedinUrl: string;
  jobTitle: string;
  avatarColor: string;
  bannerGradient: string;
  profileVisibility: ProfileVisibility;
  profilePicture: string | null;
  emailOnNewDevice: boolean;
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

function mergeNotifsFromServer(
  prefs: Record<string, boolean> | null | undefined,
): NotifSetting[] {
  return DEFAULT_NOTIFS.map((n) => ({
    ...n,
    enabled: prefs?.[n.id] ?? n.enabled,
  }));
}

function profileToSnapshot(p: UserProfile): ProfileSnapshot {
  const guessed = namesFromUsername(p.username);
  const first = (p.firstName ?? '').trim() || guessed.first;
  const last = (p.lastName ?? '').trim() || guessed.last;
  return {
    firstName: first,
    lastName: last,
    bio: p.bio ?? '',
    phoneNumber: p.phone ?? '',
    linkedinUrl: p.linkedinUrl ?? '',
    jobTitle: p.jobTitle ?? DEFAULT_JOB_TITLE,
    avatarColor: p.avatarAccentColor ?? THEME_ACCENT,
    bannerGradient: p.bannerGradient ?? BANNER_PRESETS[0].value,
    profileVisibility: p.profileVisibility,
    profilePicture: p.profilePicture ?? null,
    emailOnNewDevice: p.notificationPrefs?.[SECURITY_SIGNIN_PREF_KEY] ?? true,
    notifs: mergeNotifsFromServer(p.notificationPrefs),
  };
}

const DEFAULT_SESSIONS: AccountSession[] = [
  {
    id: 'session-current',
    deviceLabel: 'Chrome on Windows 11',
    location: 'Paris, France',
    lastActive: 'Active now',
    isCurrent: true,
    kind: 'desktop',
  },
  {
    id: 'session-mobile',
    deviceLabel: 'Safari on iOS',
    location: 'Lyon, France',
    lastActive: '2 days ago',
    isCurrent: false,
    kind: 'mobile',
  },
  {
    id: 'session-work',
    deviceLabel: 'Firefox on macOS',
    location: 'Remote',
    lastActive: '1 week ago',
    isCurrent: false,
    kind: 'desktop',
  },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Security' },
];

const emptySnapshot = (): ProfileSnapshot => ({
  firstName: '',
  lastName: '',
  bio: '',
  phoneNumber: '',
  linkedinUrl: '',
  jobTitle: DEFAULT_JOB_TITLE,
  avatarColor: THEME_ACCENT,
  bannerGradient: BANNER_PRESETS[0].value,
  profileVisibility: 'public',
  profilePicture: null,
  emailOnNewDevice: true,
  notifs: DEFAULT_NOTIFS.map((n) => ({ ...n })),
});

function Profile() {
  const queryClient = useQueryClient();
  const hydratedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [jobTitle, setJobTitle] = useState(DEFAULT_JOB_TITLE);
  const [accountUsername, setAccountUsername] = useState('');
  const [avatarColor, setAvatarColor] = useState(THEME_ACCENT);
  const [bannerGradient, setBanner] = useState<string>(BANNER_PRESETS[0].value);
  const [profileVisibility, setProfileVisibility] =
    useState<ProfileVisibility>('public');
  const [notifs, setNotifs] = useState<NotifSetting[]>(() =>
    DEFAULT_NOTIFS.map((n) => ({ ...n })),
  );
  const [sessions, setSessions] = useState<AccountSession[]>(DEFAULT_SESSIONS);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ctaAttentionTick, setCtaAttentionTick] = useState(0);
  const [ctaAnchorRect, setCtaAnchorRect] =
    useState<UnsavedChangesCtaAnchorRect | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [emailOnNewDevice, setEmailOnNewDevice] = useState(true);
  const [avatarImageError, setAvatarImageError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const profileColumnRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [snapshot, setSnapshot] = useState<ProfileSnapshot>(emptySnapshot);

  const profileQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchMyProfile,
    staleTime: Infinity,
  });

  useEffect(() => {
    const data = profileQuery.data;
    if (!data || hydratedRef.current) {
      return;
    }
    hydratedRef.current = true;
    const snap = profileToSnapshot(data);
    setAccountUsername(data.username);
    setFirstName(snap.firstName);
    setLastName(snap.lastName);
    setBio(snap.bio);
    setPhoneNumber(snap.phoneNumber);
    setLinkedinUrl(snap.linkedinUrl);
    setJobTitle(snap.jobTitle);
    setAvatarColor(snap.avatarColor);
    setBanner(snap.bannerGradient);
    setProfileVisibility(snap.profileVisibility);
    setProfilePicture(snap.profilePicture);
    setEmailOnNewDevice(snap.emailOnNewDevice);
    setNotifs(snap.notifs);
    setSnapshot(snap);
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        firstName,
        lastName,
        bio,
        linkedinUrl,
        jobTitle,
        profilePicture,
        avatarAccentColor: avatarColor,
        bannerGradient,
        profileVisibility,
        notificationPrefs: Object.fromEntries([
          ...notifs.map((n) => [n.id, n.enabled] as const),
          [SECURITY_SIGNIN_PREF_KEY, emailOnNewDevice] as const,
        ]),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user-profile'], updated);
      setAccountUsername(updated.username);
      const snap = profileToSnapshot(updated);
      setFirstName(snap.firstName);
      setLastName(snap.lastName);
      setBio(snap.bio);
      setPhoneNumber(snap.phoneNumber);
      setLinkedinUrl(snap.linkedinUrl);
      setJobTitle(snap.jobTitle);
      setAvatarColor(snap.avatarColor);
      setBanner(snap.bannerGradient);
      setProfileVisibility(snap.profileVisibility);
      setProfilePicture(snap.profilePicture);
      setEmailOnNewDevice(snap.emailOnNewDevice);
      setNotifs(snap.notifs.map((n) => ({ ...n })));
      setSnapshot(snap);
      setSaveError(null);
      setSaved(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => setSaved(false), 2000);
    },
    onError: () => {
      setSaveError('Could not save your profile. Please try again.');
    },
  });
  const deleteAccountMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      window.location.assign('/login');
    },
  });
  const passwordResetRequestMutation = useMutation({
    mutationFn: (email: string) => authService.postPasswordResetRequest(email),
    onSuccess: (_data, email) => {
      window.location.assign(
        `/reset-password?email=${encodeURIComponent(email)}`,
      );
    },
    onError: () => {
      setSaveError(
        'Could not start password reset right now. Please try again.',
      );
    },
  });

  const initials =
    (firstName[0] || 'A').toUpperCase() + (lastName[0] || 'B').toUpperCase();

  const currentSnapshot = useMemo<ProfileSnapshot>(
    () => ({
      firstName,
      lastName,
      bio,
      phoneNumber,
      linkedinUrl,
      jobTitle,
      avatarColor,
      bannerGradient,
      profileVisibility,
      profilePicture,
      emailOnNewDevice,
      notifs,
    }),
    [
      firstName,
      lastName,
      bio,
      phoneNumber,
      linkedinUrl,
      jobTitle,
      avatarColor,
      bannerGradient,
      profileVisibility,
      profilePicture,
      emailOnNewDevice,
      notifs,
    ],
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
    setSaveError(null);
    saveMutation.mutate();
  };

  const handleCancelChanges = () => {
    setFirstName(snapshot.firstName);
    setLastName(snapshot.lastName);
    setBio(snapshot.bio);
    setPhoneNumber(snapshot.phoneNumber);
    setLinkedinUrl(snapshot.linkedinUrl);
    setJobTitle(snapshot.jobTitle);
    setAvatarColor(snapshot.avatarColor);
    setBanner(snapshot.bannerGradient);
    setProfileVisibility(snapshot.profileVisibility);
    setProfilePicture(snapshot.profilePicture);
    setEmailOnNewDevice(snapshot.emailOnNewDevice);
    setNotifs(snapshot.notifs.map((n) => ({ ...n })));
  };

  const openAvatarFilePicker = (capture?: 'user' | 'environment') => {
    const input = avatarFileInputRef.current;
    if (!input) return;
    if (capture) {
      input.setAttribute('capture', capture);
    } else {
      input.removeAttribute('capture');
    }
    input.value = '';
    input.click();
  };

  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarImageError(null);
    try {
      const dataUrl = await resizeImageFileToJpegDataUrl(file);
      setProfilePicture(dataUrl);
      setShowAvatarMenu(false);
    } catch {
      setAvatarImageError('Could not use this image. Try another file.');
    }
  };

  const toggleNotif = (id: string) =>
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    );

  const revokeSession = (sessionId: string) =>
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

  const logoutEverywhere = () =>
    setSessions((prev) => prev.filter((s) => s.isCurrent));

  const cycleBanner = () => {
    const idx = BANNER_PRESETS.findIndex((b) => b.value === bannerGradient);
    setBanner(BANNER_PRESETS[(idx + 1) % BANNER_PRESETS.length].value);
  };

  if (profileQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-text-weaker">
        Loading profile…
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="p-6 text-body-s text-error">
        We could not load your profile. Refresh the page or try again later.
      </div>
    );
  }

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
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={handleAvatarFileChange}
                    data-testid="avatar-file-input"
                    title="Upload profile photo"
                  />
                  <Avatar
                    data-testid="user-avatar-initials"
                    src={profilePicture ?? undefined}
                    alt={`${firstName} ${lastName}`.trim() || 'Profile'}
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
                        onClick={() => {
                          setAvatarImageError(null);
                          setShowAvatarMenu(false);
                          queueMicrotask(() => openAvatarFilePicker());
                        }}
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
                        onClick={() => {
                          setAvatarImageError(null);
                          setShowAvatarMenu(false);
                          queueMicrotask(() => openAvatarFilePicker('user'));
                        }}
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
                        onClick={() => {
                          setProfilePicture(null);
                          setShowAvatarMenu(false);
                        }}
                      >
                        <Trash2 size={14} /> Remove
                      </Button>
                    </div>
                  )}
                </div>
                {avatarImageError ? (
                  <p
                    className="mt-2 text-center text-body-s text-error"
                    role="alert"
                  >
                    {avatarImageError}
                  </p>
                ) : null}

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
                  {jobTitle || 'Member'} · TalkUp Pro
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
                    accountUsername={accountUsername}
                    firstName={firstName}
                    lastName={lastName}
                    bio={bio}
                    phoneNumber={phoneNumber}
                    linkedinUrl={linkedinUrl}
                    jobTitle={jobTitle}
                    onFirstNameChange={setFirstName}
                    onLastNameChange={setLastName}
                    onBioChange={setBio}
                    onPhoneNumberChange={setPhoneNumber}
                    onLinkedinUrlChange={setLinkedinUrl}
                    onJobTitleChange={setJobTitle}
                  />
                )}
                {activeTab === 'appearance' && (
                  <AppearanceSettings
                    avatarColor={avatarColor}
                    bannerGradient={bannerGradient}
                    initials={initials}
                    profilePictureSrc={profilePicture}
                    profileVisibility={profileVisibility}
                    onColorChange={setAvatarColor}
                    onBannerChange={setBanner}
                    onProfileVisibilityChange={setProfileVisibility}
                  />
                )}
                {activeTab === 'notifications' && (
                  <NotifSettings notifs={notifs} onToggle={toggleNotif} />
                )}
                {activeTab === 'security' && (
                  <SecuritySettings
                    sessions={sessions}
                    onRevokeSession={revokeSession}
                    emailOnNewDevice={emailOnNewDevice}
                    onEmailOnNewDeviceChange={setEmailOnNewDevice}
                    onLogoutEverywhere={logoutEverywhere}
                    onChangePassword={() => {
                      const email = profileQuery.data?.email?.trim();
                      if (!email) {
                        window.location.assign('/forgot-password');
                        return;
                      }
                      setSaveError(null);
                      passwordResetRequestMutation.mutate(email);
                    }}
                    onRequestDataExport={() => {}}
                    onDeleteAccount={() => deleteAccountMutation.mutate()}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {saveError ? (
        <div
          className="fixed bottom-28 left-1/2 z-[121] max-w-md -translate-x-1/2 rounded-lg border border-error bg-background px-4 py-2 text-center text-body-s text-error shadow-lg"
          role="alert"
        >
          {saveError}
        </div>
      ) : null}
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
