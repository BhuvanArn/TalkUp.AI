import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '../axiosInstance';
import OrganizationApiService from './http';

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axiosInstance, true);

describe('OrganizationApiService', () => {
  const service = new OrganizationApiService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyOrganization hits GET /v1/api/organization', async () => {
    mockedAxios.get.mockResolvedValue({ data: { organization_id: 'o1' } });

    const result = await service.getMyOrganization();

    expect(mockedAxios.get).toHaveBeenCalledWith('/v1/api/organization');
    expect(result.organization_id).toBe('o1');
  });

  it('createInvite posts body to the invites route', async () => {
    mockedAxios.post.mockResolvedValue({ data: { code: 'X' } });

    await service.createInvite('o1', { email: 'a@b.co', role: 'user' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/v1/api/organization/o1/invites',
      { email: 'a@b.co', role: 'user' },
    );
  });

  it('updateMemberRole patches the role route', async () => {
    mockedAxios.patch.mockResolvedValue({ data: { message: 'ok' } });

    await service.updateMemberRole('o1', 'u1', 'employee');

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      '/v1/api/organization/o1/members/u1/role',
      { role: 'employee' },
    );
  });

  it('revokeInvite deletes the invite route', async () => {
    mockedAxios.delete.mockResolvedValue({ data: { message: 'ok' } });

    await service.revokeInvite('o1', 'i1');

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      '/v1/api/organization/o1/invites/i1',
    );
  });
});
