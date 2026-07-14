import { useRouterState } from '@tanstack/react-router';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatContext } from './useChatContext';

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(),
}));

const mockRouter = (pathname: string, search: Record<string, unknown> = {}) => {
  (useRouterState as any).mockImplementation((opts: any) =>
    opts.select({ location: { pathname, search } }),
  );
};

describe('useChatContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps the roadmap route to a roadmap surface with the application id', () => {
    mockRouter('/applications/app-1/roadmap');
    expect(renderHook(() => useChatContext()).result.current).toEqual({
      surface: 'roadmap',
      applicationId: 'app-1',
    });
  });

  it('maps the simulations route to a simulation surface', () => {
    mockRouter('/applications/app-1/simulations');
    expect(renderHook(() => useChatContext()).result.current).toEqual({
      surface: 'simulation',
      applicationId: 'app-1',
    });
  });

  it('maps the agenda route to an agenda surface with no id', () => {
    mockRouter('/agenda');
    expect(renderHook(() => useChatContext()).result.current).toEqual({
      surface: 'agenda',
    });
  });

  it('maps notes with an applicationId scope', () => {
    mockRouter('/notes', { applicationId: 'app-9' });
    expect(renderHook(() => useChatContext()).result.current).toEqual({
      surface: 'notes',
      applicationId: 'app-9',
    });
  });

  it('maps unscoped notes to a notes surface with no id', () => {
    mockRouter('/notes');
    expect(renderHook(() => useChatContext()).result.current).toEqual({
      surface: 'notes',
    });
  });

  it('maps the cv-analysis route to a cv surface', () => {
    mockRouter('/cv-analysis');
    expect(renderHook(() => useChatContext()).result.current).toEqual({
      surface: 'cv',
    });
  });

  it('returns undefined on a route with no grounding surface', () => {
    mockRouter('/settings/profile');
    expect(renderHook(() => useChatContext()).result.current).toBeUndefined();
  });
});
