import { parseSecret } from './totp.ts';

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 24_000_000;
export const MAX_IMAGE_SIDE = 12_000;
export const QR_TIMEOUT = 15_000;
export type QrErrorCode =
  | 'fileSize'
  | 'fileType'
  | 'imageSize'
  | 'imageUnreadable'
  | 'decoderUnavailable'
  | 'noQR'
  | 'multiple'
  | 'payload'
  | 'pasteUnavailable'
  | 'pasteMultiple'
  | 'cameraUnsupported'
  | 'cameraDenied'
  | 'cameraMissing'
  | 'cameraBusy'
  | 'cameraStopped'
  | 'cameraTimeout'
  | 'timeout';
export class QrError extends Error {
  readonly code: QrErrorCode;
  constructor(code: QrErrorCode) {
    super(code);
    this.code = code;
  }
}
export function imageDimensions(
  width: number,
  height: number,
): [number, number] {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1
  )
    throw new QrError('imageUnreadable');
  if (
    width > MAX_IMAGE_SIDE ||
    height > MAX_IMAGE_SIDE ||
    width * height > MAX_IMAGE_PIXELS
  )
    throw new QrError('imageSize');
  const scale = Math.min(1, 4096 / Math.max(width, height));
  return [
    Math.max(1, Math.round(width * scale)),
    Math.max(1, Math.round(height * scale)),
  ];
}
export async function checkQrImage(blob: Blob): Promise<void> {
  if (!blob.size) throw new QrError('imageUnreadable');
  if (blob.size > MAX_IMAGE_BYTES) throw new QrError('fileSize');
  const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  const ascii = new TextDecoder().decode(bytes);
  const png =
    bytes[0] === 137 &&
    ascii.slice(1, 4) === 'PNG' &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
  const gif = /^(GIF87a|GIF89a)/u.test(ascii);
  if (!png && !jpeg && !webp && !gif) throw new QrError('fileType');
  if (png && bytes.length >= 24) {
    const view = new DataView(bytes.buffer);
    imageDimensions(view.getUint32(16), view.getUint32(20));
  }
  if (gif && bytes.length >= 10) {
    const view = new DataView(bytes.buffer);
    imageDimensions(view.getUint16(6, true), view.getUint16(8, true));
  }
}
export function provisioningQr(texts: string[]): string {
  if (!texts.length) throw new QrError('noQR');
  if (texts.length !== 1) throw new QrError('multiple');
  const value = texts[0] ?? '';
  if (!/^otpauth:\/\/totp\//iu.test(value)) throw new QrError('payload');
  try {
    const parsed = parseSecret(value);
    parsed.bytes.fill(0);
    return value;
  } catch {
    throw new QrError('payload');
  }
}
