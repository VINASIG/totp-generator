import DecoderWorker from './qr-decoder.worker.ts?worker&inline';
import { QrError, QR_TIMEOUT } from '../lib/qr.ts';

export function createQrPixelReader(signal: AbortSignal) {
  const worker = new DecoderWorker();
  let closed = false;
  let pending:
    | { resolve: (texts: string[]) => void; reject: (error: Error) => void }
    | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  function close(
    error: Error = new globalThis.DOMException('Cancelled', 'AbortError'),
  ) {
    closed = true;
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
    worker.terminate();
    pending?.reject(error);
    pending = undefined;
  }
  const abort = () => {
    close();
  };
  signal.addEventListener('abort', abort, { once: true });
  worker.onerror = (event) => {
    event.preventDefault();
    close(new QrError('decoderUnavailable'));
  };
  worker.onmessage = (
    event: MessageEvent<{ texts?: string[]; error?: QrError['code'] }>,
  ) => {
    clearTimeout(timeout);
    const task = pending;
    pending = undefined;
    if (event.data.error) task?.reject(new QrError(event.data.error));
    else task?.resolve(event.data.texts ?? []);
  };
  if (signal.aborted) close();
  return {
    close,
    read: (pixels: ImageData) =>
      new Promise<string[]>((resolve, reject) => {
        if (closed || signal.aborted) {
          reject(new globalThis.DOMException('Cancelled', 'AbortError'));
          return;
        }
        if (pending) {
          reject(new QrError('imageUnreadable'));
          return;
        }
        pending = { resolve, reject };
        timeout = setTimeout(() => {
          close(new QrError('timeout'));
        }, QR_TIMEOUT);
        worker.postMessage(
          {
            width: pixels.width,
            height: pixels.height,
            pixels: pixels.data.buffer,
          },
          [pixels.data.buffer],
        );
      }),
  };
}
