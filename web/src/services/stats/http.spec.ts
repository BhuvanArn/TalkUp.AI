import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '../axiosInstance';
import { getPublicStats } from './http';

vi.mock('../axiosInstance', () => ({
  default: { get: vi.fn() },
}));

const mockedAxios = vi.mocked(axiosInstance, true);

describe('getPublicStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hits GET /v1/api/stats/public as an anonymous-allowed call', async () => {
    mockedAxios.get.mockResolvedValue({ data: { totalAccounts: 1284 } });

    const result = await getPublicStats();

    expect(mockedAxios.get).toHaveBeenCalledWith('/v1/api/stats/public', {
      anonymousAllowed: true,
    });
    expect(result).toEqual({ totalAccounts: 1284 });
  });

  it('propagates errors to the caller', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    await expect(getPublicStats()).rejects.toThrow('Network Error');
  });
});
