import path from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import QRCode from 'qrcode';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { startServer } from '../../scripts/serve.ts';
import { assertNoPageOverflow } from '../../.vinasig/standards/templates/web/responsive.mjs';

const totp = path.basename(process.cwd()) === 'totp-generator';
const pasteButton = totp ? '#qr-paste-button' : '#paste';
const cameraButton = totp ? '#qr-camera' : '#start-camera';
const error = totp ? '#qr-paste-error' : '#image-error';
const uri =
  'otpauth://totp/Example?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&digits=8&period=30';
let app: Awaited<ReturnType<typeof startServer>>;
let image: Buffer;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
  image = await QRCode.toBuffer(uri, { width: 480, margin: 4 });
});
test.afterAll(async () => {
  await app.close();
});

async function open(
  page: Page,
  lang = 'vi',
  theme: 'light' | 'dark' = 'light',
) {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.goto(new URL(lang === 'en' ? 'en/' : '', app.url).href);
  if (totp) await page.locator('#qr-import summary').click();
  await expect(page.locator('[data-qr-intake] button')).toHaveCount(3);
  await expect(page.locator(pasteButton)).toBeEnabled();
}

test('QR intake sources match the reviewed shared component pin', async () => {
  const record = JSON.parse(
    await readFile('docs/qr-intake-source.json', 'utf8'),
  ) as {
    designSourceCommit: string;
    files: Record<string, string>;
  };
  expect(record.designSourceCommit).toMatch(/^[a-f0-9]{40}$/u);
  for (const [name, digest] of Object.entries(record.files))
    expect(
      createHash('sha256')
        .update(await readFile(name))
        .digest('hex'),
    ).toBe(digest);
  expect(Object.keys(record.files)).toEqual([
    'src/components/QrImageIntake.astro',
    'src/styles/qr-image-intake.css',
  ]);
});

for (const lang of ['vi', 'en'])
  for (const theme of ['light', 'dark'] as const)
    test(`QR intake is compact with adjacent actions ${lang} ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await open(page, lang, theme);
      const intake = page.locator('[data-qr-intake]');
      const buttons = await intake.locator('button').all();
      const boxes = await Promise.all(
        buttons.map((button) => button.boundingBox()),
      );
      for (const box of boxes) {
        if (!box || !boxes[0]) throw new Error('Missing action bounds');
        expect(Math.abs(box.y - boxes[0].y)).toBeLessThan(1);
      }
      await expect(
        page.locator(totp ? '#qr-camera-panel' : '#camera-section'),
      ).toBeHidden();
      await expect(intake.locator('.qr-image-intake-target svg')).toHaveCount(
        0,
      );
      expect(
        await intake
          .locator('textarea')
          .evaluate((field) => getComputedStyle(field).borderWidth),
      ).toBe('0px');
      await page.setViewportSize({ width: 390, height: 844 });
      const box = await intake.boundingBox();
      if (!box) throw new Error('Missing intake bounds');
      expect(box.height).toBeLessThanOrEqual(260);
    });

for (const lang of ['vi', 'en'])
  test(`QR camera cancellation remains available while permission is pending ${lang}`, async ({
    page,
  }, info) => {
    await page.addInitScript(() => {
      Reflect.set(window, 'qrCameraCalls', 0);
      Reflect.set(window, 'qrCameraStops', 0);
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => {
            Reflect.set(
              window,
              'qrCameraCalls',
              Number(Reflect.get(window, 'qrCameraCalls')) + 1,
            );
            return new Promise((resolve) => {
              Reflect.set(window, 'releasePendingQrCamera', () => {
                resolve({
                  getTracks: () => [
                    {
                      stop: () =>
                        Reflect.set(
                          window,
                          'qrCameraStops',
                          Number(Reflect.get(window, 'qrCameraStops')) + 1,
                        ),
                    },
                  ],
                });
              });
            });
          },
        },
      });
    });
    await open(page, lang);
    expect(
      await page.evaluate(
        () => Reflect.get(window, 'qrCameraCalls') as unknown,
      ),
    ).toBe(0);
    await page.locator(cameraButton).click();
    const stop = page.locator(totp ? '#qr-cancel' : '#stop-camera');
    await expect(stop).toBeEnabled();
    await expect(stop).toHaveText(lang === 'vi' ? 'Hủy' : 'Cancel');
    const directory = path.resolve(
      'output/responsive/qr-intake-states',
      info.project.name,
    );
    await mkdir(directory, { recursive: true });
    await page
      .locator(totp ? '#qr-import' : '.input-pane')
      .screenshot({ path: path.join(directory, `${lang}-camera-pending.png`) });
    await expect
      .poll(() =>
        page.evaluate(
          () => typeof Reflect.get(window, 'releasePendingQrCamera'),
        ),
      )
      .toBe('function');
    await stop.click();
    await page.evaluate(() => {
      const release: unknown = Reflect.get(window, 'releasePendingQrCamera');
      if (typeof release === 'function') (release as () => void)();
    });
    await expect
      .poll(() =>
        page.evaluate(() => Reflect.get(window, 'qrCameraStops') as unknown),
      )
      .toBe(1);
    await expect(
      page.locator(totp ? '#qr-camera-panel' : '#camera-section'),
    ).toBeHidden();
    await expect(page.locator(cameraButton)).toBeFocused();
  });

async function cameraDevices(page: Page, late = false) {
  await page.addInitScript((late) => {
    const state = {
      calls: [] as MediaStreamConstraints[],
      enumerations: 0,
      stops: 0,
    };
    Reflect.set(window, 'qrDeviceFixture', state);
    let attached: unknown = null;
    Object.defineProperties(HTMLVideoElement.prototype, {
      srcObject: {
        configurable: true,
        get: () => attached,
        set: (value: unknown) => {
          attached = value;
        },
      },
      readyState: { configurable: true, get: () => 2 },
      videoWidth: { configurable: true, get: () => 480 },
      videoHeight: { configurable: true, get: () => 480 },
    });
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => {};
    const draw = Reflect.get<CanvasRenderingContext2D, 'drawImage'>(
      CanvasRenderingContext2D.prototype,
      'drawImage',
    );
    CanvasRenderingContext2D.prototype.drawImage = function (
      source: CanvasImageSource,
      ...coordinates: number[]
    ) {
      if (source instanceof HTMLVideoElement) {
        this.fillStyle = '#fff';
        this.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else Reflect.apply(draw, this, [source, ...coordinates]);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices: () => {
          state.enumerations++;
          return Promise.resolve([
            { kind: 'videoinput', deviceId: 'rear' },
            { kind: 'videoinput', deviceId: 'front' },
          ]);
        },
        getUserMedia: async (constraints: MediaStreamConstraints) => {
          state.calls.push(constraints);
          const selection =
            typeof constraints.video === 'object'
              ? constraints.video.deviceId
              : undefined;
          const id =
            selection && typeof selection === 'object' && 'exact' in selection
              ? String(selection.exact)
              : 'rear';
          let ended = false;
          const track = {
            label: 'Fixture camera',
            getSettings: () => ({ deviceId: id }),
            get readyState() {
              return ended ? 'ended' : 'live';
            },
            stop: () => {
              if (!ended) state.stops++;
              ended = true;
            },
          };
          if (late && state.calls.length === 1)
            await new Promise<void>((resolve) => {
              Reflect.set(window, 'releaseFirstQrCamera', resolve);
            });
          return { getTracks: () => [track], getVideoTracks: () => [track] };
        },
      },
    });
  }, late);
}

test('QR camera switches devices only after permission and releases the previous camera', async ({
  page,
}, info) => {
  await cameraDevices(page);
  await open(page, 'en', 'dark');
  expect(
    await page.evaluate(
      () => Reflect.get(window, 'qrDeviceFixture') as unknown,
    ),
  ).toEqual({ calls: [], enumerations: 0, stops: 0 });
  await page.locator(cameraButton).click();
  const change = page.locator(totp ? '#qr-switch-camera' : '#switch-camera');
  await expect(change).toBeVisible();
  await expect(change).toBeEnabled();
  const directory = path.resolve(
    'output/responsive/qr-intake-states',
    info.project.name,
  );
  await mkdir(directory, { recursive: true });
  await page
    .locator(totp ? '#qr-import' : '.input-pane')
    .screenshot({ path: path.join(directory, 'en-dark-camera-active.png') });
  await change.click();
  await expect(change).toBeVisible();
  const state = await page.evaluate(
    () =>
      Reflect.get(window, 'qrDeviceFixture') as {
        calls: MediaStreamConstraints[];
        enumerations: number;
        stops: number;
      },
  );
  expect(state.calls).toEqual([
    expect.objectContaining({
      audio: false,
      video: expect.objectContaining({ facingMode: { ideal: 'environment' } }),
    }),
    expect.objectContaining({
      audio: false,
      video: expect.objectContaining({ deviceId: { exact: 'front' } }),
    }),
  ]);
  expect(state.enumerations).toBe(2);
  expect(state.stops).toBe(1);
  await page.locator(totp ? '#qr-cancel' : '#stop-camera').click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (Reflect.get(window, 'qrDeviceFixture') as { stops: number }).stops,
      ),
    )
    .toBe(2);
});

test('QR permission granted after cancellation cannot detach a newer camera', async ({
  page,
}) => {
  await cameraDevices(page, true);
  await open(page);
  await page.locator(cameraButton).click();
  await expect
    .poll(() =>
      page.evaluate(() => typeof Reflect.get(window, 'releaseFirstQrCamera')),
    )
    .toBe('function');
  await page.locator(totp ? '#qr-cancel' : '#stop-camera').click();
  await page.locator(cameraButton).click();
  await expect(
    page.locator(totp ? '#qr-switch-camera' : '#switch-camera'),
  ).toBeVisible();
  await page.evaluate(() => {
    (Reflect.get(window, 'releaseFirstQrCamera') as () => void)();
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (Reflect.get(window, 'qrDeviceFixture') as { stops: number }).stops,
      ),
    )
    .toBe(1);
  await expect(page.locator(totp ? '#qr-video' : '#video')).toBeVisible();
  expect(
    await page
      .locator(totp ? '#qr-video' : '#video')
      .evaluate((video: HTMLVideoElement) => video.srcObject !== null),
  ).toBe(true);
  await page.locator(totp ? '#qr-cancel' : '#stop-camera').click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (Reflect.get(window, 'qrDeviceFixture') as { stops: number }).stops,
      ),
    )
    .toBe(2);
});

for (const lang of ['vi', 'en'])
  for (const theme of ['light', 'dark'] as const)
    test(`QR intake fits every responsive size ${lang} ${theme}`, async ({
      page,
    }, info) => {
      test.setTimeout(180000);
      await open(page, lang, theme);
      const widths = [320, 360, 390, 600, 759, 760, 761, 768, 1024, 1440];
      const directory = path.resolve(
        'output/responsive/qr-intake',
        info.project.name,
      );
      await mkdir(directory, { recursive: true });
      for (const width of widths) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(() => document.fonts.ready);
        await assertNoPageOverflow(page);
        const intake = page.locator('[data-qr-intake]');
        const bounds = await intake.boundingBox();
        expect(bounds).not.toBeNull();
        if (!bounds) throw new Error('Missing intake bounds');
        for (const button of await intake.locator('button').all()) {
          const box = await button.boundingBox();
          expect(box).not.toBeNull();
          if (!box) throw new Error('Missing action bounds');
          expect(box.height).toBeGreaterThanOrEqual(48);
          expect(box.x).toBeGreaterThanOrEqual(bounds.x);
          expect(box.x + box.width).toBeLessThanOrEqual(
            bounds.x + bounds.width + 0.5,
          );
          const icon = await button.locator('svg').boundingBox();
          const label = await button.locator('span').boundingBox();
          if (!icon || !label) throw new Error('Missing action icon or label');
          expect(
            Math.abs(icon.y + icon.height / 2 - label.y - label.height / 2),
          ).toBeLessThan(1);
        }
        await intake.screenshot({
          path: path.join(directory, `${lang}-${theme}-${String(width)}.png`),
        });
      }
      await page.setViewportSize({ width: 320, height: 844 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await assertNoPageOverflow(page);
      const enlarged = await page.locator('[data-qr-intake]').evaluate((el) => {
        const brokenWords: string[] = [];
        for (const label of el.querySelectorAll('button span')) {
          const node = label.firstChild;
          if (!node) throw new Error('Missing action label text');
          for (const match of (node.textContent ?? '').matchAll(/\S+/gu)) {
            const lines = new Set<number>();
            for (let i = match.index; i < match.index + match[0].length; i++) {
              const range = document.createRange();
              range.setStart(node, i);
              range.setEnd(node, i + 1);
              lines.add(Math.round(range.getBoundingClientRect().y));
            }
            if (lines.size > 1) brokenWords.push(match[0]);
          }
        }
        const field = el.querySelector('textarea');
        if (!field) throw new Error('Missing native paste field');
        return {
          brokenWords,
          fieldHeight: field.clientHeight,
          scrollHeight: field.scrollHeight,
        };
      });
      expect(enlarged.brokenWords).toEqual([]);
      expect(enlarged.scrollHeight).toBeLessThanOrEqual(
        enlarged.fieldHeight + 1,
      );
      await page.locator('[data-qr-intake]').screenshot({
        path: path.join(directory, `${lang}-${theme}-320-enlarged.png`),
      });
      await page.emulateMedia({ forcedColors: 'active' });
      await page.locator('[data-qr-paste]').focus();
      await expect(page.locator('[data-qr-paste]')).toBeFocused();
      await page.locator('[data-qr-intake]').screenshot({
        path: path.join(directory, `${lang}-${theme}-forced-colors.png`),
      });
    });

async function clipboard(page: Page, mode: 'image' | 'denied' | 'late') {
  await page.addInitScript(
    ({ bytes, mode }) => {
      Date.now = () => 59000;
      document.addEventListener('DOMContentLoaded', () => {
        document.body.dataset['clipboardReads'] = '0';
        document.body.dataset['clipboardTypes'] = '0';
      });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          read: async () => {
            document.body.dataset['clipboardReads'] = String(
              Number(document.body.dataset['clipboardReads']) + 1,
            );
            if (mode === 'denied')
              throw new DOMException('Denied', 'NotAllowedError');
            if (mode === 'late')
              await new Promise<void>((resolve) => {
                Reflect.set(window, 'releaseQrClipboard', resolve);
              });
            return [
              {
                types: ['image/png'],
                getType: () => {
                  document.body.dataset['clipboardTypes'] = String(
                    Number(document.body.dataset['clipboardTypes']) + 1,
                  );
                  return Promise.resolve(
                    new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
                  );
                },
              },
            ];
          },
        },
      });
    },
    { bytes: [...image], mode },
  );
}

for (const lang of ['vi', 'en']) {
  test(`QR intake clipboard is explicit and decodes a real image ${lang}`, async ({
    page,
  }) => {
    await clipboard(page, 'image');
    await open(page, lang);
    await expect(page.locator('body')).toHaveAttribute(
      'data-clipboard-reads',
      '0',
    );
    await page.locator(pasteButton).click();
    await expect(page.locator('body')).toHaveAttribute(
      'data-clipboard-reads',
      '1',
    );
    if (totp)
      await expect(page.locator('#code')).toHaveJSProperty('value', '94287082');
    else await expect(page.locator('#download-results')).toBeEnabled();
    await expect(page.locator('[data-qr-paste]')).toHaveValue('');
  });

  test(`QR intake clipboard denial has a local keyboard and file fallback ${lang}`, async ({
    page,
  }) => {
    await clipboard(page, 'denied');
    await open(page, lang);
    await page.locator(pasteButton).click();
    await expect(page.locator(error)).toBeVisible();
    await expect(page.locator('[data-qr-paste]')).toBeEnabled();
    await expect(page.locator('[data-qr-intake] button').first()).toBeEnabled();
    await expect(page.locator('body')).toHaveAttribute(
      'data-clipboard-reads',
      '1',
    );
  });

  test(`QR intake rejects a late clipboard response after clear ${lang}`, async ({
    page,
  }) => {
    await clipboard(page, 'late');
    await open(page, lang);
    await page.locator(pasteButton).click();
    await expect(page.locator('body')).toHaveAttribute(
      'data-clipboard-reads',
      '1',
    );
    await page.locator('#clear').click();
    await page.evaluate(async () => {
      const release: unknown = Reflect.get(window, 'releaseQrClipboard');
      if (typeof release !== 'function')
        throw new Error('Missing pending clipboard read');
      Reflect.apply(release, window, []);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        }),
      );
    });
    await expect(page.locator('body')).toHaveAttribute(
      'data-clipboard-types',
      '0',
    );
    if (totp) await expect(page.locator('#secret')).toHaveValue('');
    else await expect(page.locator('#results')).toBeEmpty();
  });

  test(`QR intake camera failure is shown beside the requested scan ${lang}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () =>
            Promise.reject(new DOMException('Denied', 'NotAllowedError')),
        },
      });
    });
    await open(page, lang);
    await page.locator(cameraButton).click();
    await expect(
      page.locator(totp ? '#qr-camera-error' : '#camera-error'),
    ).toBeVisible();
    await expect(page.locator('[data-qr-intake] button').first()).toBeEnabled();
  });
}
