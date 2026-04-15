const MAX_EDGE_PX = 512;
const JPEG_QUALITY = 0.82;

/**
 * Downscales an image file in the browser and returns a JPEG data URL
 * suitable for storing in Postgres (demo / student scope).
 */
export function resizeImageFileToJpegDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);
        let { naturalWidth: w, naturalHeight: h } = img;
        if (w < 1 || h < 1) {
          reject(new Error('Invalid image dimensions'));
          return;
        }
        const scale = Math.min(1, MAX_EDGE_PX / Math.max(w, h));
        const width = Math.max(1, Math.round(w * scale));
        const height = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Resize failed'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
