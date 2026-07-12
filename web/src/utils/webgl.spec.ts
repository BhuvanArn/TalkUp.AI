import { describe, expect, it, vi } from 'vitest';

import { detectWebGLSupport } from './webgl';

describe('detectWebGLSupport', () => {
  it('returns forced-fallback when requested', () => {
    expect(detectWebGLSupport(true)).toEqual({
      supported: false,
      reason: 'forced-fallback',
    });
  });

  it('returns supported when a WebGL context can be created', () => {
    const loseContext = vi.fn();
    const getContext = vi.fn(() => ({
      getExtension: () => ({ loseContext }),
    }));

    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext,
    } as unknown as HTMLCanvasElement);

    expect(detectWebGLSupport(false)).toEqual({
      supported: true,
      reason: 'supported',
    });
    expect(loseContext).toHaveBeenCalled();
  });
});
