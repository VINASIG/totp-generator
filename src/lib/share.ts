import { decodeBase32, validateOptions } from './totp.ts';
import type { Options } from './totp.ts';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const fields = ['totp', 'secret', 'algorithm', 'digits', 'period'] as const;
export const shareFragmentLimit = 2304;

export class ShareError extends Error {
  constructor() {
    super('Invalid TOTP share');
  }
}

export function encodeBase32(bytes: Uint8Array): string {
  if (bytes.length === 0 || bytes.length > 1280) throw new ShareError();
  let buffer = 0;
  let bits = 0;
  let result = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += alphabet.charAt((buffer >>> bits) & 31);
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) result += alphabet.charAt((buffer << (5 - bits)) & 31);
  return result;
}

export function shareFragment(bytes: Uint8Array, options: Options): string {
  validateOptions(options);
  const params = new URLSearchParams({
    totp: '1',
    secret: encodeBase32(bytes),
    algorithm: options.algorithm,
    digits: String(options.digits),
    period: String(options.period),
  });
  return '#' + params.toString();
}

export function isShareFragment(fragment: string): boolean {
  return /^#totp(?:[=&]|$)/.test(fragment);
}

export function parseShareFragment(fragment: string): {
  secret: string;
  options: Options;
} {
  if (!isShareFragment(fragment) || fragment.length > shareFragmentLimit)
    throw new ShareError();
  const params = new URLSearchParams(fragment.slice(1));
  if (
    [...params.keys()].length !== fields.length ||
    fields.some((field) => params.getAll(field).length !== 1) ||
    params.get('totp') !== '1'
  )
    throw new ShareError();
  const secret = params.get('secret') ?? '';
  const algorithm = params.get('algorithm');
  const digits = params.get('digits');
  const period = params.get('period') ?? '';
  if (
    !/^[A-Z2-7]{2,2048}$/.test(secret) ||
    (algorithm !== 'SHA1' &&
      algorithm !== 'SHA256' &&
      algorithm !== 'SHA512') ||
    (digits !== '6' && digits !== '8') ||
    !/^[1-9]\d{0,2}$/.test(period)
  )
    throw new ShareError();
  const options: Options = {
    algorithm,
    digits: digits === '8' ? 8 : 6,
    period: Number(period),
  };
  let bytes: Uint8Array | undefined;
  try {
    validateOptions(options);
    bytes = decodeBase32(secret);
    if (encodeBase32(bytes) !== secret) throw new ShareError();
    return { secret, options };
  } catch {
    throw new ShareError();
  } finally {
    bytes?.fill(0);
  }
}

export function shareUrl(
  page: string,
  bytes: Uint8Array,
  options: Options,
): string {
  const url = new URL(page);
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
  )
    throw new ShareError();
  url.username = '';
  url.password = '';
  url.search = '';
  url.hash = shareFragment(bytes, options);
  return url.href;
}
