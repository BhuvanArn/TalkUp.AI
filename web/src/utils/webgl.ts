export type WebGLSupportReason =
  | 'supported'
  | 'no-window'
  | 'forced-fallback'
  | 'webgl-unavailable'
  | 'webgl-context-failed';

export interface WebGLSupportResult {
  supported: boolean;
  reason: WebGLSupportReason;
}

/**
 * Detects basic WebGL availability without creating a persistent context.
 * Safe to call during SSR (returns unsupported).
 */
export function detectWebGLSupport(
  forceFallback = false,
): WebGLSupportResult {
  if (forceFallback) {
    return { supported: false, reason: 'forced-fallback' };
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { supported: false, reason: 'no-window' };
  }

  const canvas = document.createElement('canvas');
  const contextOptions: WebGLContextAttributes = {
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: false,
  };

  const gl =
    canvas.getContext('webgl2', contextOptions) ??
    canvas.getContext('webgl', contextOptions);

  if (!gl) {
    return { supported: false, reason: 'webgl-unavailable' };
  }

  // Release the probe context immediately.
  const loseExt = gl.getExtension('WEBGL_lose_context');
  loseExt?.loseContext();

  return { supported: true, reason: 'supported' };
}
