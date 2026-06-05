import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resizeImageFileToJpegDataUrl } from './resizeImageToJpegDataUrl';

describe('resizeImageFileToJpegDataUrl', () => {
  const OriginalImage = globalThis.Image;
  let origCreateObjectURL: typeof URL.createObjectURL | undefined;
  let origRevokeObjectURL: typeof URL.revokeObjectURL | undefined;

  beforeEach(() => {
    origCreateObjectURL = URL.createObjectURL;
    origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = () => 'blob:mock';
    URL.revokeObjectURL = () => {};

    globalThis.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 800;
      naturalHeight = 600;
      private _src = '';
      set src(v: string) {
        this._src = v;
        queueMicrotask(() => this.onload?.());
      }
      get src() {
        return this._src;
      }
    } as unknown as typeof Image;
  });

  afterEach(() => {
    globalThis.Image = OriginalImage;
    if (origCreateObjectURL !== undefined) {
      URL.createObjectURL = origCreateObjectURL;
    }
    if (origRevokeObjectURL !== undefined) {
      URL.revokeObjectURL = origRevokeObjectURL;
    }
    vi.restoreAllMocks();
  });

  it('returns a JPEG data URL', async () => {
    const toDataURL = vi.fn(() => 'data:image/jpeg;base64,stub');
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage,
      }),
      toDataURL,
    };
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'canvas') return canvas as unknown as HTMLCanvasElement;
        return origCreate(tag, options);
      },
    );

    const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' });
    const result = await resizeImageFileToJpegDataUrl(file);

    expect(drawImage).toHaveBeenCalled();
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', expect.any(Number));
    expect(result).toBe('data:image/jpeg;base64,stub');
  });
});
