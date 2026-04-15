export type ProfileVisibility = 'public' | 'private' | 'hidden';

export interface UserProfile {
  userId: string;
  username: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  profilePicture: string | null;
  avatarAccentColor: string | null;
  bannerGradient: string | null;
  profileVisibility: ProfileVisibility;
  notificationPrefs: Record<string, boolean> | null;
}

export interface UpdateProfileBody {
  username?: string;
  profilePicture?: string | null;
  firstName?: string;
  lastName?: string;
  bio?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  avatarAccentColor?: string;
  bannerGradient?: string;
  profileVisibility?: ProfileVisibility;
  notificationPrefs?: Record<string, boolean>;
}
