import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import {
  encodeBase32,
  isShareFragment,
  parseShareFragment,
  ShareError,
  shareFragment,
  shareFragmentLimit,
  shareUrl,
} from '../src/lib/share.ts';
import { decodeBase32, defaults } from '../src/lib/totp.ts';

void test('Base32 export agrees with RFC 4648 vectors without padding', () => {
  const vectors = [
    ['f', 'MY'],
    ['fo', 'MZXQ'],
    ['foo', 'MZXW6'],
    ['foob', 'MZXW6YQ'],
    ['fooba', 'MZXW6YTB'],
    ['foobar', 'MZXW6YTBOI'],
  ] as const;
  for (const [input, expected] of vectors)
    assert.equal(encodeBase32(new TextEncoder().encode(input)), expected);
  assert.throws(() => encodeBase32(new Uint8Array()), ShareError);
  assert.throws(() => encodeBase32(new Uint8Array(1281)), ShareError);
});

void test('export matches a separately implemented bit-string reference', () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  for (const size of [1, 2, 3, 4, 5, 7, 8, 16, 20, 32, 64, 127, 1280]) {
    const bytes = Uint8Array.from({ length: size }, (_, index) =>
      createHash('sha256').update(String(index)).digest().readUInt8(0),
    );
    const bits = [...bytes].map((n) => n.toString(2).padStart(8, '0')).join('');
    const expected = (bits.match(/.{1,5}/g) ?? [])
      .map((chunk) => alphabet[Number.parseInt(chunk.padEnd(5, '0'), 2)])
      .join('');
    assert.equal(encodeBase32(bytes), expected);
    assert.deepEqual(decodeBase32(expected), bytes);
    const parsed = parseShareFragment(shareFragment(bytes, defaults));
    assert.equal(parsed.secret, expected);
    assert.deepEqual(parsed.options, defaults);
  }
});

void test('links include only canonical material and the current supported settings', () => {
  const bytes = decodeBase32('jbsw-y3dp ehpk3pxp');
  const before = bytes.slice();
  for (const algorithm of ['SHA1', 'SHA256', 'SHA512'] as const)
    for (const digits of [6, 8] as const)
      for (const period of [1, 30, 60, 300]) {
        const options = { algorithm, digits, period };
        const url = new URL(
          shareUrl(
            'https://totp.vinasig.io.vn/en/?tracking=x#old',
            bytes,
            options,
          ),
        );
        assert.equal(
          url.origin + url.pathname,
          'https://totp.vinasig.io.vn/en/',
        );
        assert.equal(url.search, '');
        assert.deepEqual(parseShareFragment(url.hash), {
          secret: 'JBSWY3DPEHPK3PXP',
          options,
        });
        assert.deepEqual(
          [...new URLSearchParams(url.hash.slice(1)).keys()],
          ['totp', 'secret', 'algorithm', 'digits', 'period'],
        );
      }
  assert.deepEqual(bytes, before);
  assert.throws(
    () => shareUrl('http://totp.vinasig.io.vn/', bytes, defaults),
    ShareError,
  );
  assert.ok(
    shareUrl('http://127.0.0.1:1234/', bytes, defaults).startsWith(
      'http://127.0.0.1:1234/#totp=1',
    ),
  );
  assert.throws(
    () => shareUrl('javascript:alert(1)', bytes, defaults),
    ShareError,
  );
  assert.throws(
    () => shareUrl('file:///test.html', bytes, defaults),
    ShareError,
  );
});

void test('strict import rejects corruption, duplicate fields, unknown versions and unbounded input', () => {
  const valid = shareFragment(decodeBase32('MY'), defaults);
  const invalid = [
    '',
    '#generator',
    '#totp',
    '#totp=1',
    '#/JBSWY3DPEHPK3PXP',
    valid.replace('totp=1', 'totp=2'),
    valid.replace('totp=1', 'totp=01'),
    valid + '&secret=MY',
    valid + '&digits=6',
    valid + '&unknown=x',
    valid.replace('&period=30', ''),
    valid.replace('secret=MY', 'secret=MZ'),
    valid.replace('secret=MY', 'secret=my'),
    valid.replace('secret=MY', 'secret=MY%3D%3D%3D%3D%3D%3D'),
    valid.replace('secret=MY', 'secret=M%00Y'),
    valid.replace('secret=MY', 'secret=M%EF%BC%B9'),
    valid.replace('secret=MY', 'secret=MY%0A'),
    valid.replace('secret=MY', 'secret=%3Cscript%3E'),
    valid.replace('algorithm=SHA1', 'algorithm=SHA384'),
    valid.replace('digits=6', 'digits=7'),
    valid.replace('digits=6', 'digits=06'),
    ...['0', '301', '-1', '1.5', '030', '1e2', '%2030', 'NaN'].map((period) =>
      valid.replace('period=30', 'period=' + period),
    ),
    '#totp=' + 'A'.repeat(shareFragmentLimit),
  ];
  for (const fragment of invalid)
    assert.throws(() => parseShareFragment(fragment), ShareError);
  assert.equal(isShareFragment('#generator'), false);
  assert.equal(isShareFragment('#totp=2'), true);
  const maximum = shareFragment(new Uint8Array(1280), defaults);
  assert.ok(maximum.length <= shareFragmentLimit);
  assert.equal(parseShareFragment(maximum).secret.length, 2048);
});
