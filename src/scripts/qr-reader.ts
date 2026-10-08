import { createQrPixelReader } from './qr-pixels.ts';
import {
  provisioningQr,
  QrError,
  QR_TIMEOUT,
  checkQrImage,
  imageDimensions,
} from '../lib/qr.ts';

export async function decodeQr(
  blob: Blob,
  signal: AbortSignal,
): Promise<string> {
  await checkQrImage(blob);
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new globalThis.DOMException('Cancelled', 'AbortError'));
      return;
    }
    let reader: ReturnType<typeof createQrPixelReader> | undefined;
    const image = new Image();
    const imageUrl = URL.createObjectURL(blob);
    const canvas = document.createElement('canvas');
    const finish = () => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      reader?.close();
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
      URL.revokeObjectURL(imageUrl);
      canvas.width = 0;
      canvas.height = 0;
    };
    const abort = () => {
      finish();
      reject(new globalThis.DOMException('Cancelled', 'AbortError'));
    };
    const timeout = setTimeout(() => {
      finish();
      reject(new QrError('timeout'));
    }, QR_TIMEOUT);
    signal.addEventListener('abort', abort, { once: true });
    image.onerror = () => {
      finish();
      reject(new QrError('imageUnreadable'));
    };
    image.onload = () => {
      try {
        const [width, height] = imageDimensions(
          image.naturalWidth,
          image.naturalHeight,
        );
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new QrError('imageUnreadable');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height);
        reader = createQrPixelReader(signal);
        void reader.read(pixels).then(
          (texts) => {
            finish();
            try {
              resolve(provisioningQr(texts));
            } catch (error) {
              reject(
                error instanceof QrError
                  ? error
                  : new QrError('imageUnreadable'),
              );
            }
          },
          (error: unknown) => {
            finish();
            reject(
              error instanceof Error ? error : new QrError('imageUnreadable'),
            );
          },
        );
      } catch (error) {
        finish();
        reject(
          error instanceof QrError ? error : new QrError('imageUnreadable'),
        );
      }
    };
    image.src = imageUrl;
  });
}
