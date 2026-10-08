import { provisioningQr, QrError } from '../lib/qr.ts';
import { createQrPixelReader } from './qr-pixels.ts';

function delay(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new globalThis.DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, 400);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

export async function scanCamera(
  video: HTMLVideoElement,
  signal: AbortSignal,
  ready: (devices: string[], selected: string) => void,
  deviceId?: string,
): Promise<string> {
  const media: unknown = Reflect.get(navigator, 'mediaDevices');
  if (
    !globalThis.isSecureContext ||
    typeof media !== 'object' ||
    media === null ||
    typeof Reflect.get(media, 'getUserMedia') !== 'function'
  )
    throw new QrError('cameraUnsupported');
  const cancelled = () => signal.aborted;
  const backgrounded = () => document.hidden;
  let stream: MediaStream | undefined;
  let reader: ReturnType<typeof createQrPixelReader> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  const isExpired = () => expired;
  const canvas = document.createElement('canvas');
  const stop = () => {
    stream?.getTracks().forEach((track) => {
      track.stop();
    });
    if (stream && video.srcObject === stream) {
      video.pause();
      video.srcObject = null;
    }
    canvas.width = 0;
    canvas.height = 0;
    reader?.close(expired ? new QrError('cameraTimeout') : undefined);
  };
  signal.addEventListener('abort', stop, { once: true });
  try {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { ideal: 'environment' } }),
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 15, max: 30 },
        },
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      throw new QrError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'cameraDenied'
          : name === 'NotFoundError'
            ? 'cameraMissing'
            : 'cameraBusy',
      );
    }
    if (cancelled() || backgrounded())
      throw new globalThis.DOMException('Cancelled', 'AbortError');
    deadline = setTimeout(() => {
      expired = true;
      stop();
    }, 120_000);
    video.srcObject = stream;
    await video.play();
    if (cancelled())
      throw new globalThis.DOMException('Cancelled', 'AbortError');
    reader = createQrPixelReader(signal);
    let devices: string[] = [];
    try {
      const mediaDevices: Partial<MediaDevices> = navigator.mediaDevices;
      const available = await mediaDevices.enumerateDevices?.();
      devices = [
        ...new Set(
          (available ?? [])
            .filter((device) => device.kind === 'videoinput' && device.deviceId)
            .map((device) => device.deviceId),
        ),
      ];
    } catch {
      // Camera switching is optional when device enumeration is unavailable.
    }
    if (cancelled() || backgrounded())
      throw new globalThis.DOMException('Cancelled', 'AbortError');
    if (isExpired()) throw new QrError('cameraTimeout');
    ready(devices, stream.getVideoTracks()[0]?.getSettings().deviceId ?? '');
    const started = performance.now();
    while (!cancelled()) {
      if (isExpired() || performance.now() - started > 120_000)
        throw new QrError('cameraTimeout');
      if (
        stream.getVideoTracks().every((track) => track.readyState === 'ended')
      )
        throw new QrError('cameraStopped');
      if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
        const scale = Math.min(
          1,
          1280 / Math.max(video.videoWidth, video.videoHeight),
        );
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new QrError('cameraBusy');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const texts = await reader.read(
          context.getImageData(0, 0, canvas.width, canvas.height),
        );
        if (texts.length) return provisioningQr(texts);
      }
      await delay(signal);
    }
    throw new globalThis.DOMException('Cancelled', 'AbortError');
  } finally {
    clearTimeout(deadline);
    signal.removeEventListener('abort', stop);
    stop();
  }
}
