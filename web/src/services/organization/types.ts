export type OrgMemberRole = 'admin' | 'employee' | 'user';

export interface OrganizationMember {
  user_id: string;
  username: string;
  user_role: OrgMemberRole;
  interviewCount: number;
  completedCount: number;
  avgScore: number | null;
  lastActivityAt: string | null;
}

export interface OrganizationDetails {
  organization_id: string;
  organization_name: string;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
  members?: OrganizationMember[];
}

export interface OrganizationInvite {
  invite_id: string;
  code: string;
  email: string | null;
  role: 'user' | 'employee';
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export interface MemberRecentInterview {
  interview_id: string;
  type: string;
  status: string;
  score: number | null;
  created_at: string;
  ended_at: string | null;
}

export interface OrganizationMemberDetail {
  user_id: string;
  username: string;
  user_role: OrgMemberRole;
  email: string | null;
  stats: {
    interviewCount: number;
    completedCount: number;
    avgScore: number | null;
    lastActivityAt: string | null;
  };
  recentInterviews: MemberRecentInterview[];
}
