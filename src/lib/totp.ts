export type Algorithm = 'SHA1' | 'SHA256' | 'SHA512';
export interface Options {
  algorithm: Algorithm;
  digits: 6 | 8;
  period: number;
}
export const defaults: Options = { algorithm: 'SHA1', digits: 6, period: 30 };
export type InputError =
  | 'empty'
  | 'base32'
  | 'length'
  | 'uri'
  | 'hotp'
  | 'algorithm'
  | 'digits'
  | 'period'
  | 'offset'
  | 'crypto';
export class TotpError extends Error {
  readonly code: InputError;
  constructor(code: InputError) {
    super(code);
    this.code = code;
  }
}
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function decodeBase32(input: string): Uint8Array<ArrayBuffer> {
  const value = input.replace(/[\s-]/gu, '');
  if (!value) throw new TotpError('empty');
  if (value.length > 2048) throw new TotpError('length');
  if (!/^[A-Za-z2-7]+={0,6}$/.test(value)) throw new TotpError('base32');
  const body = value.replace(/=+$/, '').toUpperCase();
  const remainder = body.length % 8;
  if (![0, 2, 4, 5, 7].includes(remainder)) throw new TotpError('base32');
  if (
    value.includes('=') &&
    (value.length % 8 !== 0 ||
      value.length - body.length !== (8 - remainder) % 8)
  )
    throw new TotpError('base32');
  const bytes = new Uint8Array(Math.floor((body.length * 5) / 8));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const character of body) {
    buffer = (buffer << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes[index++] = (buffer >>> bits) & 255;
      buffer &= (1 << bits) - 1;
    }
  }
  if (buffer !== 0 || bytes.length === 0) throw new TotpError('base32');
  return bytes;
}

export function validateOptions(options: Options): void {
  if (!['SHA1', 'SHA256', 'SHA512'].includes(options.algorithm))
    throw new TotpError('algorithm');
  if (![6, 8].includes(options.digits)) throw new TotpError('digits');
  if (
    !Number.isInteger(options.period) ||
    options.period < 1 ||
    options.period > 300
  )
    throw new TotpError('period');
}

export interface ParsedSecret {
  bytes: Uint8Array<ArrayBuffer>;
  options: Options;
  label: string;
  fromUri: boolean;
}
export function parseSecret(input: string): ParsedSecret {
  if (input.length > 8192) throw new TotpError('length');
  const value = input.trim();
  if (!/^otpauth:/i.test(value))
    return {
      bytes: decodeBase32(value),
      options: { ...defaults },
      label: '',
      fromUri: false,
    };
  try {
    const uri = new URL(value);
    if (
      uri.protocol !== 'otpauth:' ||
      uri.username ||
      uri.password ||
      uri.port ||
      uri.hash
    )
      throw new TotpError('uri');
    if (uri.hostname === 'hotp') throw new TotpError('hotp');
    if (
      uri.hostname !== 'totp' ||
      !uri.pathname.startsWith('/') ||
      uri.pathname.length < 2
    )
      throw new TotpError('uri');
    for (const key of ['secret', 'algorithm', 'digits', 'period', 'issuer']) {
      if (uri.searchParams.getAll(key).length > 1) throw new TotpError('uri');
    }
    const secret = uri.searchParams.get('secret');
    if (!secret) throw new TotpError('empty');
    const algorithm = (uri.searchParams.get('algorithm') ?? 'SHA1').replace(
      /[a-z]/g,
      (letter) => letter.toUpperCase(),
    );
    if (
      algorithm !== 'SHA1' &&
      algorithm !== 'SHA256' &&
      algorithm !== 'SHA512'
    )
      throw new TotpError('algorithm');
    const digitText = uri.searchParams.get('digits') ?? '6';
    if (digitText !== '6' && digitText !== '8') throw new TotpError('digits');
    const periodText = uri.searchParams.get('period') ?? '30';
    if (!/^\d+$/.test(periodText)) throw new TotpError('period');
    const options: Options = {
      algorithm,
      digits: digitText === '8' ? 8 : 6,
      period: Number(periodText),
    };
    validateOptions(options);
    const label = decodeURIComponent(uri.pathname.slice(1));
    const issuer = uri.searchParams.get('issuer');
    if (issuer && label.includes(':') && label.split(':')[0]?.trim() !== issuer)
      throw new TotpError('uri');
    return { bytes: decodeBase32(secret), options, label, fromUri: true };
  } catch (error) {
    if (error instanceof TotpError) throw error;
    throw new TotpError('uri');
  }
}

export function timeWindow(now: number, period: number, offset = 0) {
  if (
    !Number.isFinite(now) ||
    now < 0 ||
    !Number.isFinite(offset) ||
    Math.abs(offset) > 300
  )
    throw new TotpError('offset');
  if (!Number.isInteger(period) || period < 1 || period > 300)
    throw new TotpError('period');
  const adjusted = now + offset * 1000;
  if (adjusted < 0) throw new TotpError('offset');
  const counter = BigInt(Math.floor(adjusted / (period * 1000)));
  const remaining = period - ((adjusted / 1000) % period);
  return {
    counter,
    remaining,
    expiresAt: (Number(counter) + 1) * period * 1000 - offset * 1000,
  };
}

export async function importSecret(
  bytes: Uint8Array<ArrayBuffer>,
  algorithm: Algorithm,
): Promise<CryptoKey> {
  if (!supportsCrypto()) throw new TotpError('crypto');
  const hash = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' }[
    algorithm
  ];
  return globalThis.crypto.subtle.importKey(
    'raw',
    bytes,
    { name: 'HMAC', hash },
    false,
    ['sign'],
  );
}

export async function hotp(
  key: CryptoKey,
  counter: bigint,
  digits: 6 | 8,
): Promise<string> {
  if (counter < 0n || counter > 0xffffffffffffffffn)
    throw new TotpError('offset');
  if (![6, 8].includes(digits)) throw new TotpError('digits');
  const message = new ArrayBuffer(8);
  new DataView(message).setBigUint64(0, counter, false);
  const mac = new Uint8Array(
    await globalThis.crypto.subtle.sign('HMAC', key, message),
  );
  const last = mac.at(-1);
  if (last === undefined) throw new TotpError('crypto');
  const binary =
    new DataView(mac.buffer).getUint32(last & 15, false) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, '0');
}

export async function generateTotp(
  secret: string,
  options: Options = defaults,
  now = Date.now(),
  offset = 0,
): Promise<string> {
  validateOptions(options);
  const bytes = decodeBase32(secret);
  try {
    const key = await importSecret(bytes, options.algorithm);
    return await hotp(
      key,
      timeWindow(now, options.period, offset).counter,
      options.digits,
    );
  } finally {
    bytes.fill(0);
  }
}

export function supportsCrypto(): boolean {
  return (
    typeof Reflect.get(globalThis, 'crypto') === 'object' &&
    typeof Reflect.get(globalThis.crypto, 'subtle') === 'object'
  );
}
