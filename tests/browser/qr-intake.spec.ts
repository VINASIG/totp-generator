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
