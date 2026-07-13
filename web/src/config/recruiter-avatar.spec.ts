import {
  DEFAULT_RECRUITER_OFFICE_BACKGROUND_URL,
  RECRUITER_OFFICE_BACKGROUND_VERSION,
  resolveRecruiterAvatarUrl,
  resolveRecruiterOfficeBackgroundUrl,
} from '@/config/recruiter-avatar';
import { describe, expect, it, vi } from 'vitest';

describe('resolveRecruiterAvatarUrl', () => {
  it('returns the bundled default with a cache-bust version when env is unset', () => {
    expect(resolveRecruiterAvatarUrl()).toBe(
      '/avatars/recruiter-professional.glb?v=3',
    );
  });

  it('allows same-origin relative paths from env', () => {
    vi.stubEnv('VITE_RECRUITER_AVATAR_URL', '/avatars/custom.glb');
    expect(resolveRecruiterAvatarUrl()).toBe('/avatars/custom.glb');
    vi.unstubAllEnvs();
  });

  it('rejects protocol-relative and external URLs', () => {
    vi.stubEnv('VITE_RECRUITER_AVATAR_URL', '//evil.example/avatar.glb');
    expect(resolveRecruiterAvatarUrl()).toBe(
      '/avatars/recruiter-professional.glb?v=3',
    );
    vi.unstubAllEnvs();
  });
});

describe('resolveRecruiterOfficeBackgroundUrl', () => {
  it('returns the bundled office background with cache-bust when env is unset', () => {
    expect(resolveRecruiterOfficeBackgroundUrl()).toBe(
      `${DEFAULT_RECRUITER_OFFICE_BACKGROUND_URL}?v=${RECRUITER_OFFICE_BACKGROUND_VERSION}`,
    );
  });

  it('allows same-origin relative paths from env', () => {
    vi.stubEnv(
      'VITE_RECRUITER_OFFICE_BACKGROUND_URL',
      '/backgrounds/custom.jpg',
    );
    expect(resolveRecruiterOfficeBackgroundUrl()).toBe(
      '/backgrounds/custom.jpg',
    );
    vi.unstubAllEnvs();
  });
});
