import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '../axiosInstance';
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  updateApplicationStatus,
} from './http';

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axiosInstance, true);

describe('applications http', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the applications list', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    await expect(fetchApplications()).resolves.toEqual([]);
    expect(mockedAxios.get).toHaveBeenCalledWith('/v1/api/applications');
  });

  it('creates an application from a url', async () => {
    mockedAxios.post.mockResolvedValue({ data: { applicationId: 'a1' } });
    const app = await createApplication('https://example.com/job');
    expect(mockedAxios.post).toHaveBeenCalledWith('/v1/api/applications', {
      url: 'https://example.com/job',
    });
    expect(app.applicationId).toBe('a1');
  });

  it('patches the status', async () => {
    mockedAxios.patch.mockResolvedValue({
      data: { applicationId: 'a1', status: 'interview' },
    });
    await updateApplicationStatus('a1', 'interview');
    expect(mockedAxios.patch).toHaveBeenCalledWith('/v1/api/applications/a1', {
      status: 'interview',
    });
  });

  it('deletes an application', async () => {
    mockedAxios.delete.mockResolvedValue({ data: undefined });
    await deleteApplication('a1');
    expect(mockedAxios.delete).toHaveBeenCalledWith('/v1/api/applications/a1');
  });
});
