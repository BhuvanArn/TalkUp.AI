import type { RecruiterFallbackReasonKey } from './types';

/** Avaturn recruiter model is ~14 MB; allow time on slower connections. */
const AVATAR_LOAD_TIMEOUT_MS = 45_000;

async function fetchAvatarBlob(
  url: string,
  onProgress?: (pct: number) => void,
) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Avatar model HTTP ${response.status} for ${url}`);
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (!response.body) {
    const blob = await response.blob();
    onProgress?.(100);
    return blob;
  }

  const reader = response.body.getReader();
  // Typed as BlobPart[] so `new Blob(chunks)` type-checks: a Uint8Array's
  // backing buffer is ArrayBufferLike (possibly SharedArrayBuffer), which the
  // BlobPart[] parameter of Blob accepts but Uint8Array[] does not under lib.dom.
  const chunks: BlobPart[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (contentLength > 0) {
      onProgress?.(Math.min(99, Math.round((loaded / contentLength) * 100)));
    }
  }

  onProgress?.(100);
  return new Blob(chunks, { type: 'model/gltf-binary' });
}

/** Rejection of `withTimeout`, carrying the fallback reason to show. */
class TimeoutError extends Error {
  readonly reasonKey: RecruiterFallbackReasonKey;

  constructor(reasonKey: RecruiterFallbackReasonKey, ms: number) {
    super(`Avatar load step timed out after ${ms} ms (${reasonKey})`);
    this.name = 'TimeoutError';
    this.reasonKey = reasonKey;
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  reasonKey: RecruiterFallbackReasonKey,
) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new TimeoutError(reasonKey, ms)), ms);
    }),
  ]);
}

/** Fallback reason for a failed 3D load: the timeout's own, else a generic one. */
function toFallbackReasonKey(error: unknown): RecruiterFallbackReasonKey {
  return error instanceof TimeoutError
    ? error.reasonKey
    : 'recruiter.fallback.loadFailed';
}

/** Waits until the container has non-zero layout dimensions. */
function waitForElementSize(
  element: HTMLElement,
  timeoutMs = 5_000,
): Promise<void> {
  if (element.clientWidth > 0 && element.clientHeight > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const observer = new ResizeObserver(() => {
      if (element.clientWidth > 0 && element.clientHeight > 0) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(element);

    window.setTimeout(() => {
      observer.disconnect();
      if (element.clientWidth > 0 && element.clientHeight > 0) {
        resolve();
      } else {
        reject(new Error('Avatar container has no dimensions'));
      }
    }, timeoutMs);
  });
}

export {
  AVATAR_LOAD_TIMEOUT_MS,
  TimeoutError,
  fetchAvatarBlob,
  toFallbackReasonKey,
  waitForElementSize,
  withTimeout,
};
