import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  checkQrImage,
  imageDimensions,
  MAX_IMAGE_BYTES,
  provisioningQr,
  QrError,
} from '../src/lib/qr.ts';

const uri =
  'otpauth://totp/Example?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&digits=8';
void test('accept exactly one validated TOTP URI and never follow payload URLs', () => {
  assert.equal(provisioningQr([uri]), uri);
  for (const payload of [
    'https://example.com/',
    'GEZDGNBVGY3TQOJQ',
    'otpauth-migration://offline?data=aaa',
    uri.replace('/totp/', '/hotp/'),
    uri + '&digits=6',
    uri.replace('secret=', 'secret=1'),
    uri + '&period=0',
  ])
    assert.throws(
      () => provisioningQr([payload]),
      (e) => e instanceof QrError && e.code === 'payload',
    );
  assert.throws(
    () => provisioningQr([]),
    (e) => e instanceof QrError && e.code === 'noQR',
  );
  assert.throws(
    () => provisioningQr([uri, uri]),
    (e) => e instanceof QrError && e.code === 'multiple',
  );
});
void test('bound image dimensions without silently accepting unsupported data', async () => {
  assert.deepEqual(imageDimensions(6000, 3000), [4096, 2048]);
  for (const [width, height] of [
    [0, 1],
    [-1, 1],
    [1.5, 1],
    [NaN, 1],
    [12001, 1],
    [6000, 6000],
  ])
    assert.throws(() => imageDimensions(width ?? 0, height ?? 0), QrError);
  await assert.rejects(checkQrImage(new Blob()), QrError);
  await assert.rejects(
    checkQrImage(
      new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>'], {
        type: 'image/png',
      }),
    ),
    QrError,
  );
  await assert.rejects(
    checkQrImage(new Blob([new Uint8Array(MAX_IMAGE_BYTES + 1)])),
    (e) => e instanceof QrError && e.code === 'fileSize',
  );
  const header = new Uint8Array(32);
  header.set([137, 80, 78, 71, 13, 10, 26, 10]);
  new DataView(header.buffer).setUint32(16, 12001);
  new DataView(header.buffer).setUint32(20, 1);
  await assert.rejects(
    checkQrImage(new Blob([header])),
    (e) => e instanceof QrError && e.code === 'imageSize',
  );
});
