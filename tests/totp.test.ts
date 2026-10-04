import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import {
  decodeBase32,
  defaults,
  generateTotp,
  hotp,
  importSecret,
  parseSecret,
  timeWindow,
  TotpError,
} from '../src/lib/totp.ts';
import type { Algorithm } from '../src/lib/totp.ts';

const seeds = {
  SHA1: '12345678901234567890',
  SHA256: '12345678901234567890123456789012',
  SHA512: '1234567890123456789012345678901234567890123456789012345678901234',
};
const vectors = [
  [59, '94287082', '46119246', '90693936'],
  [1111111109, '07081804', '68084774', '25091201'],
  [1111111111, '14050471', '67062674', '99943326'],
  [1234567890, '89005924', '91819424', '93441116'],
  [2000000000, '69279037', '90698825', '38618901'],
  [20000000000, '65353130', '77737706', '47863826'],
] as const;
for (const [seconds, ...codes] of vectors)
  for (const [index, algorithm] of (
    ['SHA1', 'SHA256', 'SHA512'] as const
  ).entries()) {
    void test(`RFC 6238 ${algorithm} at ${String(seconds)}`, async () => {
      const key = await importSecret(
        new TextEncoder().encode(seeds[algorithm]),
        algorithm,
      );
      assert.equal(key.extractable, false);
      assert.equal(
        await hotp(key, timeWindow(seconds * 1000, 30).counter, 8),
        codes[index],
      );
    });
  }
void test('RFC 4226 counters and six digits including leading zero', async () => {
  const key = await importSecret(new TextEncoder().encode(seeds.SHA1), 'SHA1');
  for (const [counter, expected] of [
    '755224',
    '287082',
    '359152',
    '969429',
    '338314',
    '254676',
    '287922',
    '162583',
    '399871',
    '520489',
  ].entries())
    assert.equal(await hotp(key, BigInt(counter), 6), expected);
});
void test('Base32 decoding, spacing, casing, padding and noncanonical rejection', () => {
  assert.equal(Buffer.from(decodeBase32('mzxw6===')).toString(), 'foo');
  assert.equal(Buffer.from(decodeBase32(' MZ-XW 6\n')).toString(), 'foo');
  assert.equal(
    Buffer.from(decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')).toString(),
    seeds.SHA1,
  );
  for (const value of [
    '',
    'A',
    'AAA',
    'AAAAAA',
    'MZ',
    'MZX',
    'MZXW7',
    'MZXW6=',
    'M=ZXW6',
    'ABC1',
    'ABCDE0',
    'ıA',
    'ſA',
    'ßAAAAAA',
    '=',
    'A'.repeat(2050),
  ])
    assert.throws(() => decodeBase32(value), TotpError);
});
void test('TOTP end-to-end defaults, full-width time counters and independent HMAC reference', async () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(await generateTotp(secret, defaults, 59000), '287082');
  for (const algorithm of ['SHA1', 'SHA256', 'SHA512'] as Algorithm[])
    for (const period of [1, 30, 60, 300]) {
      const now = 1791155555123;
      const counter = timeWindow(now, period, -12).counter;
      const buffer = Buffer.alloc(8);
      buffer.writeBigUInt64BE(counter);
      const digest = createHmac(
        algorithm.toLowerCase(),
        Buffer.from(decodeBase32(secret)),
      )
        .update(buffer)
        .digest();
      const last = digest.at(-1);
      assert(last !== undefined);
      const expected = String(
        (digest.readUInt32BE(last & 15) & 0x7fffffff) % 100000000,
      ).padStart(8, '0');
      assert.equal(
        await generateTotp(secret, { algorithm, period, digits: 8 }, now, -12),
        expected,
      );
    }
});
void test('time step boundaries, offset and invalid options', async () => {
  assert.equal(timeWindow(29999, 30).counter, 0n);
  assert.equal(timeWindow(30000, 30).counter, 1n);
  assert.equal(timeWindow(30000, 30).remaining, 30);
  assert.equal(timeWindow(10000, 30, 20).counter, 1n);
  assert.equal(timeWindow(10000, 30, 20).expiresAt, 40000);
  assert.equal(timeWindow(2 ** 32 * 30000, 30).counter, 4294967296n);
  for (const period of [0, -1, 1.5, 301, NaN])
    assert.throws(() => timeWindow(0, period), TotpError);
  for (const offset of [-301, 301, NaN])
    assert.throws(() => timeWindow(1000000, 30, offset), TotpError);
  await assert.rejects(
    () => generateTotp('MY', { ...defaults, period: 0 }),
    TotpError,
  );
});
void test('setup URI import and strict rejection without fetching any URI', () => {
  const parsed = parseSecret(
    'otpauth://totp/Example%3Aalice%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&algorithm=SHA256&digits=8&period=60',
  );
  assert.equal(parsed.label, 'Example:alice@example.com');
  assert.deepEqual(parsed.options, {
    algorithm: 'SHA256',
    digits: 8,
    period: 60,
  });
  assert.equal(parsed.fromUri, true);
  assert.deepEqual(parseSecret('MY').options, defaults);
  assert.equal(
    parseSecret('otpauth://totp/Test?secret=MY&algorithm=sha512').options
      .algorithm,
    'SHA512',
  );
  for (const uri of [
    'otpauth://hotp/Account?secret=MY&counter=0',
    'otpauth://totp/Account?secret=MY&secret=MY',
    'otpauth://totp/Account?secret=MY&digits=7',
    'otpauth://totp/Account?secret=MY&algorithm=MD5',
    'otpauth://totp/Account?secret=MY&algorithm=ſHA1',
    'otpauth://totp/Account?secret=MY&period=0',
    'otpauth://totp/Account?secret=MY&period=3.5',
    'otpauth://totp/Account?secret=MY&period=',
    'otpauth://totp/%Q?secret=MY',
    'otpauth://totp/Example:Alice?secret=MY&issuer=Other',
    'otpauth://totp/Account',
    'otpauth://user@totp/Account?secret=MY',
    'otpauth://totp/Account?secret=MY#fragment',
    'https://example.com/?secret=MY',
  ])
    assert.throws(() => parseSecret(uri), TotpError);
});
