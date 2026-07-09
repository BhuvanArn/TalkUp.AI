import { API_ROUTES } from '../api';
import axiosInstance from '../axiosInstance';
import type {
  OrganizationDetails,
  OrganizationInvite,
  OrganizationMemberDetail,
} from './types';

/**
 * Organization API (F12–F14): org details + members with stats, invites,
 * member management. All routes require the auth cookie.
 */
export default class OrganizationApiService {
  getMyOrganization = async (): Promise<OrganizationDetails> => {
    const response = await axiosInstance.get(API_ROUTES.organization);
    return response.data;
  };

  getMemberDetail = async (
    orgId: string,
    userId: string,
  ): Promise<OrganizationMemberDetail> => {
    const response = await axiosInstance.get(
      `${API_ROUTES.organization}/${orgId}/members/${userId}`,
    );
    return response.data;
  };

  createInvite = async (
    orgId: string,
    body: { email?: string; role?: 'user' | 'employee' },
  ): Promise<OrganizationInvite> => {
    const response = await axiosInstance.post(
      `${API_ROUTES.organization}/${orgId}/invites`,
      body,
    );
    return response.data;
  };

  listInvites = async (orgId: string): Promise<OrganizationInvite[]> => {
    const response = await axiosInstance.get(
      `${API_ROUTES.organization}/${orgId}/invites`,
    );
    return response.data;
  };

  revokeInvite = async (
    orgId: string,
    inviteId: string,
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(
      `${API_ROUTES.organization}/${orgId}/invites/${inviteId}`,
    );
    return response.data;
  };

  updateMemberRole = async (
    orgId: string,
    userId: string,
    role: 'user' | 'employee',
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.patch(
      `${API_ROUTES.organization}/${orgId}/members/${userId}/role`,
      { role },
    );
    return response.data;
  };

  removeMember = async (
    orgId: string,
    userId: string,
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(
      `${API_ROUTES.organization}/${orgId}/members/${userId}`,
    );
    return response.data;
  };

  updateOrganization = async (
    orgId: string,
    body: { OrganizationName?: string; OrganizationProfilePicture?: string },
  ): Promise<{ message: string } | void> => {
    const response = await axiosInstance.patch(
      `${API_ROUTES.organization}/${orgId}`,
      body,
    );
    return response.data;
  };
}
