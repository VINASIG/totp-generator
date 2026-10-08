import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import QRCode from 'qrcode';
import AxeBuilder from '@axe-core/playwright';
import { startServer } from '../../scripts/serve.ts';
import {
  inspectInterface,
  inspectControlSurfaces,
} from '../../.vinasig/standards/templates/web/interface.mjs';

let app: Awaited<ReturnType<typeof startServer>>;
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const uri = 'otpauth://totp/Public?secret=' + secret + '&digits=8';
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});

async function cameraFixture(
  page: Page,
  mode: 'qr' | 'blank' | 'pending' | 'invalid' = 'qr',
) {
  const png = await QRCode.toBuffer(
    mode === 'invalid' ? 'https://example.com/' : uri,
    { width: 480, margin: 4 },
  );
  await page.addInitScript(
    ({ bytes, mode }) => {
      let calls = 0;
      let stops = 0;
      let ended = false;
      let now = 0;
      Object.defineProperty(performance, 'now', {
        configurable: true,
        value: () => now,
      });
      document.addEventListener('camera-fixture-timeout', () => {
        now = 121000;
      });
      document.addEventListener('camera-fixture-disconnect', () => {
        ended = true;
      });
      const image = new Image();
      const blobUrl = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
      );
      image.src = blobUrl;
      const originalDraw = Reflect.get(
        CanvasRenderingContext2D.prototype,
        'drawImage',
      ) as (
        this: CanvasRenderingContext2D,
        source: CanvasImageSource,
        x: number,
        y: number,
        width: number,
        height: number,
      ) => void;
      CanvasRenderingContext2D.prototype.drawImage = function (
        source: CanvasImageSource,
      ) {
        if (
          source instanceof HTMLVideoElement &&
          mode !== 'qr' &&
          mode !== 'invalid'
        ) {
          this.fillStyle = '#fff';
          this.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else
          originalDraw.call(
            this,
            source instanceof HTMLVideoElement ? image : source,
            0,
            0,
            this.canvas.width,
            this.canvas.height,
          );
      };
      Object.defineProperties(HTMLVideoElement.prototype, {
        readyState: { configurable: true, get: () => 2 },
        videoWidth: { configurable: true, get: () => 480 },
        videoHeight: { configurable: true, get: () => 480 },
      });
      let attached: unknown = null;
      Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
        configurable: true,
        get: () => attached,
        set: (value: unknown) => {
          attached = value;
        },
      });
      HTMLMediaElement.prototype.play = function () {
        return Promise.resolve();
      };
      const stream = {};
      const track = {
        get readyState() {
          return ended ? 'ended' : 'live';
        },
        stop() {
          stops++;
          ended = true;
          document.documentElement.dataset['cameraStops'] = String(stops);
        },
      };
      Object.defineProperties(stream, {
        getTracks: { value: () => [track] },
        getVideoTracks: { value: () => [track] },
      });
      const media = {};
      Object.defineProperty(media, 'getUserMedia', {
        configurable: true,
        value: async (constraints: MediaStreamConstraints) => {
          calls++;
          ended = false;
          document.documentElement.dataset['cameraCalls'] = String(calls);
          document.documentElement.dataset['cameraConstraints'] =
            JSON.stringify(constraints);
          await image.decode();
          if (mode === 'pending')
            await new Promise<void>((resolve) => {
              document.addEventListener(
                'camera-fixture-release',
                () => {
                  resolve();
                },
                { once: true },
              );
            });
          return stream;
        },
      });
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: media,
      });
      Object.defineProperty(window, '__cameraFixtureMode', {
        configurable: true,
        value: mode,
      });
      const acquire: unknown = Reflect.get(media, 'getUserMedia');
      Object.defineProperty(window, '__cameraFixtureAcquire', {
        configurable: true,
        value: acquire,
      });
    },
    { bytes: [...png], mode },
  );
}
async function start(page: Page, lang = 'vi') {
  await page.goto(app.url + (lang === 'en' ? 'en/' : ''));
  expect(
    await page.evaluate(() => {
      const acquire: unknown = Reflect.get(window, '__cameraFixtureAcquire');
      return (
        Object.hasOwn(window, '__cameraFixtureMode') &&
        Object.hasOwn(navigator, 'mediaDevices') &&
        navigator.mediaDevices.getUserMedia === acquire
      );
    }),
  ).toBe(true);
  await page.locator('#qr-import summary').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-camera-calls');
  await page.locator('#qr-camera').click();
  await expect(page.locator('html')).toHaveAttribute('data-camera-calls', '1');
}
async function stopped(page: Page) {
  await expect
    .poll(() => page.locator('html').getAttribute('data-camera-stops'))
    .not.toBeNull();
  await expect(page.locator('#qr-camera-panel')).toBeHidden();
  expect(
    await page
      .locator('#qr-video')
      .evaluate((video: HTMLVideoElement) => video.srcObject),
  ).toBeNull();
}
for (const lang of ['vi', 'en'])
  for (const theme of ['light', 'dark'] as const)
    test(`camera imports RFC QR locally and releases tracks ${lang} ${theme}`, async ({
      page,
    }, info) => {
      await cameraFixture(page);
      await page.emulateMedia({ colorScheme: theme });
      await page.clock.install({ time: new Date(58000) });
      await page.clock.pauseAt(new Date(59000));
      const requests: string[] = [];
      page.on('request', (request) => requests.push(request.url()));
      await start(page, lang);
      await expect(page.locator('#code')).toHaveText('94287082');
      await expect(page.locator('#secret')).toHaveValue(uri);
      await stopped(page);
      const constraints = JSON.parse(
        (await page.locator('html').getAttribute('data-camera-constraints')) ??
          '{}',
      ) as MediaStreamConstraints;
      expect(constraints.audio).toBe(false);
      expect(constraints.video).toMatchObject({
        facingMode: { ideal: 'environment' },
      });
      expect(
        requests.every(
          (url) =>
            (url.startsWith(app.url) || url.startsWith('blob:' + app.url)) &&
            !url.includes(secret),
        ),
      ).toBe(true);
      expect(await page.evaluate(inspectInterface)).toEqual([]);
      expect(await page.evaluate(inspectControlSurfaces)).toEqual([]);
      await mkdir('output/responsive/qr-camera/' + info.project.name, {
        recursive: true,
      });
      await page.screenshot({
        path: `output/responsive/qr-camera/${info.project.name}/${lang}-${theme}-success.png`,
        fullPage: true,
      });
    });

test('camera errors are local and preserve the manual key', async ({
  page,
}, info) => {
  for (const name of ['NotAllowedError', 'NotFoundError', 'NotReadableError']) {
    await page.goto(app.url);
    await page.locator('#secret').fill(secret);
    await expect(page.locator('#result')).toBeVisible();
    await page.evaluate((name) => {
      if (typeof Reflect.get(navigator, 'mediaDevices') !== 'object')
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {},
          configurable: true,
        });
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        value: () => Promise.reject(new DOMException('', name)),
      });
    }, name);
    await page.locator('#qr-import summary').click();
    await page.locator('#qr-camera').click();
    await expect(page.locator('#qr-camera-error')).toBeVisible();
    await expect(page.locator('#secret')).toHaveValue(secret);
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#qr-cancel')).toBeHidden();
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  expect(await page.evaluate(inspectInterface)).toEqual([]);
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  await mkdir('output/responsive/qr-camera/' + info.project.name, {
    recursive: true,
  });
  await page.screenshot({
    path: `output/responsive/qr-camera/${info.project.name}/vi-denied-320-enlarged.png`,
    fullPage: true,
  });
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined }),
  );
  await page.locator('#qr-camera').click();
  await expect(page.locator('#qr-camera-error')).toContainText('chưa hỗ trợ');
});

test('camera cancel, reset, edit, disclosure close and background release tracks', async ({
  page,
}, info) => {
  await cameraFixture(page, 'blank');
  for (const action of ['cancel', 'reset', 'edit', 'close', 'background']) {
    await start(page);
    await expect(page.locator('#qr-status')).toContainText('Đang quét');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(inspectInterface)).toEqual([]);
    if (action === 'cancel') {
      await mkdir('output/responsive/qr-camera/' + info.project.name, {
        recursive: true,
      });
      await page.screenshot({
        path: `output/responsive/qr-camera/${info.project.name}/vi-scanning-390.png`,
        fullPage: true,
      });
      await page.locator('#qr-cancel').click();
    } else if (action === 'reset') await page.locator('#clear').click();
    else if (action === 'edit') await page.locator('#secret').fill(secret);
    else if (action === 'close')
      await page.locator('#qr-import summary').click();
    else
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
          value: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    await stopped(page);
    await expect(page.locator('#secret')).toHaveValue(
      action === 'edit' ? secret : '',
    );
  }
});

test('late camera permission after cancellation cannot retain tracks or import a key', async ({
  page,
}) => {
  await cameraFixture(page, 'pending');
  await start(page);
  await expect(page.locator('html')).toHaveAttribute('data-camera-calls', '1');
  await page.locator('#qr-cancel').click();
  await page.evaluate(() =>
    document.dispatchEvent(new Event('camera-fixture-release')),
  );
  await stopped(page);
  await expect(page.locator('#secret')).toHaveValue('');
  await expect(page.locator('#result')).toBeHidden();
});

test('camera disconnect and scanning deadline stop without a guessed key', async ({
  page,
}) => {
  await cameraFixture(page, 'blank');
  for (const event of ['camera-fixture-disconnect', 'camera-fixture-timeout']) {
    await start(page);
    await expect(page.locator('#qr-status')).toContainText('Đang quét');
    await page.evaluate(
      (event) => document.dispatchEvent(new Event(event)),
      event,
    );
    await expect(page.locator('#qr-camera-error')).toContainText(
      event.endsWith('disconnect') ? 'bị ngắt' : '2 phút',
    );
    await stopped(page);
    await expect(page.locator('#secret')).toHaveValue('');
  }
});

test('camera does not navigate non-TOTP QR payloads', async ({ page }) => {
  await cameraFixture(page, 'invalid');
  await start(page);
  await expect(page.locator('#qr-camera-error')).toContainText('TOTP');
  await stopped(page);
  expect(page.url()).toBe(app.url);
  await expect(page.locator('#secret')).toHaveValue('');
});

test('QR paste area is styled for image intake and accepts a dropped image', async ({
  page,
}) => {
  await page.goto(app.url);
  await page.locator('#qr-import summary').click();
  await expect(page.locator('#qr-paste')).toHaveJSProperty(
    'tagName',
    'TEXTAREA',
  );
  expect(
    await page
      .locator('#qr-dropzone')
      .evaluate((node) => getComputedStyle(node).borderStyle),
  ).toBe('dashed');
  const image = await QRCode.toBuffer(uri, { width: 480 });
  await page.locator('#qr-dropzone').evaluate(
    (node, bytes) => {
      const data = new DataTransfer();
      data.items.add(
        new File([new Uint8Array(bytes)], 'public-rfc.png', {
          type: 'image/png',
        }),
      );
      node.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
        }),
      );
    },
    [...image],
  );
  await expect(page.locator('#secret')).toHaveValue(uri);
  await expect(page.locator('#result')).toBeVisible();
});
