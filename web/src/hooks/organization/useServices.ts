import OrganizationApiService from '@/services/organization/http';
import type {
  OrganizationDetails,
  OrganizationInvite,
  OrganizationMemberDetail,
} from '@/services/organization/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const organizationService = new OrganizationApiService();

/** F13: current caller's organization + members with stats. */
export const useGetMyOrganization = (enabled = true) => {
  return useQuery<OrganizationDetails>({
    queryKey: ['organization', 'me'],
    queryFn: organizationService.getMyOrganization,
    enabled,
  });
};

/** F14: single member's profile + stats + recent interviews. Skipped until a userId is selected. */
export const useGetMemberDetail = (orgId: string, userId: string | null) => {
  return useQuery<OrganizationMemberDetail>({
    queryKey: ['organization', orgId, 'members', userId],
    queryFn: () => organizationService.getMemberDetail(orgId, userId as string),
    enabled: !!orgId && !!userId,
  });
};

/** F12: pending/accepted/revoked invites for the org (admin-only panel). */
export const useGetInvites = (orgId: string, enabled: boolean) => {
  return useQuery<OrganizationInvite[]>({
    queryKey: ['organization', orgId, 'invites'],
    queryFn: () => organizationService.listInvites(orgId),
    enabled: !!orgId && enabled,
  });
};

const useOrgInvalidation = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['organization'] });
};

export const useCreateInvite = (orgId: string) => {
  const invalidate = useOrgInvalidation();
  return useMutation({
    mutationFn: (body: { email?: string; role?: 'user' | 'employee' }) =>
      organizationService.createInvite(orgId, body),
    onSuccess: () => {
      toast.success('Invite code generated');
      invalidate();
    },
    onError: () => toast.error('Could not create the invite'),
  });
};

export const useRevokeInvite = (orgId: string) => {
  const invalidate = useOrgInvalidation();
  return useMutation({
    mutationFn: (inviteId: string) =>
      organizationService.revokeInvite(orgId, inviteId),
    onSuccess: () => {
      toast.success('Invite revoked');
      invalidate();
    },
    onError: () => toast.error('Could not revoke the invite'),
  });
};

export const useUpdateMemberRole = (orgId: string) => {
  const invalidate = useOrgInvalidation();
  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: 'user' | 'employee';
    }) => organizationService.updateMemberRole(orgId, userId, role),
    onSuccess: () => {
      toast.success('Member role updated');
      invalidate();
    },
    onError: () => toast.error('Could not update the role'),
  });
};

export const useRemoveMember = (orgId: string) => {
  const invalidate = useOrgInvalidation();
  return useMutation({
    mutationFn: (userId: string) =>
      organizationService.removeMember(orgId, userId),
    onSuccess: () => {
      toast.success('Member removed');
      invalidate();
    },
    onError: () => toast.error('Could not remove the member'),
  });
};

export const useUpdateOrganization = (orgId: string) => {
  const invalidate = useOrgInvalidation();
  return useMutation({
    mutationFn: (body: {
      OrganizationName?: string;
      OrganizationProfilePicture?: string;
    }) => organizationService.updateOrganization(orgId, body),
    onSuccess: () => {
      toast.success('Organization updated');
      invalidate();
    },
    onError: () => toast.error('Could not update the organization'),
  });
};
