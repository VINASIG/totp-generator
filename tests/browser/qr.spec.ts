import path from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import QRCode from 'qrcode';
import { PNG } from 'pngjs';
import AxeBuilder from '@axe-core/playwright';
import { startServer } from '../../scripts/serve.ts';
import {
  inspectInterface,
  inspectControlSurfaces,
} from '../../.vinasig/standards/templates/web/interface.mjs';
let app: Awaited<ReturnType<typeof startServer>>;
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const uri =
  'otpauth://totp/Example%3Aalice?secret=' +
  secret +
  '&issuer=Example&digits=8&period=30';
let image: Buffer;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
  image = await QRCode.toBuffer(uri, { width: 480, margin: 4 });
});
test.afterAll(async () => {
  await app.close();
});
const file = (buffer: Buffer) => ({
  name: 'public-rfc-fixture.png',
  mimeType: 'image/png',
  buffer,
});
async function capture(page: Page, name: string, engine: string) {
  await mkdir('output/responsive/qr/' + engine, { recursive: true });
  await page.screenshot({
    path: `output/responsive/qr/${engine}/${name}.png`,
    fullPage: true,
  });
}
for (const lang of ['vi', 'en'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`local QR RFC result, settings, reset and no upload ${lang} ${theme}`, async ({
      page,
    }, info) => {
      const requests: string[] = [];
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ colorScheme: theme });
      await page.clock.install({ time: new Date(58000) });
      await page.clock.pauseAt(new Date(59000));
      await page.goto(app.url + (lang === 'en' ? 'en/' : ''));
      await page.locator('#qr-import summary').click();
      page.on('request', (request) => requests.push(request.url()));
      await page.locator('#qr-file').setInputFiles(file(image));
      await expect(page.locator('#code')).toHaveText('94287082');
      await expect(page.locator('#secret')).toHaveValue(uri);
      await expect(page.locator('#secret')).toHaveAttribute(
        'data-masked',
        'true',
      );
      await expect(page.locator('#qr-status')).toContainText(
        lang === 'vi' ? 'Đã đọc' : 'Key and settings',
      );
      await page.locator('#advanced summary').click();
      await expect(page.locator('input[name=digits][value="8"]')).toBeChecked();
      await expect(page.locator('#offset')).toHaveValue('0');
      expect(
        requests.every(
          (url) =>
            (url.startsWith(app.url) || url.startsWith('blob:' + app.url)) &&
            !url.includes('otpauth') &&
            !url.includes(secret),
        ),
      ).toBe(true);
      expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual(
        [],
      );
      await capture(page, `${lang}-${theme}-success`, info.project.name);
      await page.locator('#clear').click();
      await expect(page.locator('#secret')).toHaveValue('');
      await expect(page.locator('#qr-paste')).toHaveValue('');
      await expect(page.locator('#qr-status')).toHaveText('');
      await expect(page.locator('#result')).toBeHidden();
      expect(errors).toEqual([]);
    });
    test(`QR disclosure reflow and local error ${lang} ${theme}`, async ({
      page,
    }, info) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(app.url + (lang === 'en' ? 'en/' : ''));
      await page.locator('#qr-import summary').click();
      for (const width of [
        320, 360, 390, 600, 759, 760, 761, 768, 1024, 1440,
      ]) {
        await page.setViewportSize({
          width,
          height: width === 768 ? 1024 : 900,
        });
        expect(await page.evaluate(inspectInterface)).toEqual([]);
        expect(await page.evaluate(inspectControlSurfaces)).toEqual([]);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
        await capture(
          page,
          `${lang}-${theme}-${String(width)}-open`,
          info.project.name,
        );
      }
      await page.locator('#qr-file').setInputFiles({
        name: 'bad.png',
        mimeType: 'image/png',
        buffer: Buffer.from('<svg/>'),
      });
      await expect(page.locator('#qr-file-error')).toBeVisible();
      await expect(page.locator('#qr-upload')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await capture(page, `${lang}-${theme}-file-error`, info.project.name);
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await page.setViewportSize({ width: 320, height: 800 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await capture(page, `${lang}-${theme}-320-enlarged`, info.project.name);
    });
  }
test('reject other QR payloads, unreadable images and multiple symbols', async ({
  page,
}) => {
  await page.goto(app.url);
  await page.locator('#qr-import summary').click();
  for (const payload of [
    'https://example.com/?secret=do-not-fetch',
    'otpauth-migration://offline?data=abc',
    uri.replace('/totp/', '/hotp/'),
    uri + '&digits=6',
  ]) {
    await page
      .locator('#qr-file')
      .setInputFiles(file(await QRCode.toBuffer(payload, { width: 400 })));
    await expect(page.locator('#qr-file-error')).toContainText('TOTP');
    await expect(page.locator('#secret')).toHaveValue('');
    await expect(page.locator('#copy')).toBeDisabled();
  }
  const blank = new PNG({ width: 100, height: 100 });
  blank.data.fill(255);
  await page.locator('#qr-file').setInputFiles(file(PNG.sync.write(blank)));
  await expect(page.locator('#qr-file-error')).toContainText('Không tìm thấy');
  const one = PNG.sync.read(image);
  const combined = new PNG({ width: 1000, height: 500 });
  combined.data.fill(255);
  PNG.bitblt(one, combined, 0, 0, one.width, one.height, 0, 0);
  PNG.bitblt(one, combined, 0, 0, one.width, one.height, 500, 0);
  await page.locator('#qr-file').setInputFiles(file(PNG.sync.write(combined)));
  await expect(page.locator('#qr-file-error')).toContainText('nhiều mã');
});
test('QR imports all RFC algorithms and uses URI defaults', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(58000) });
  await page.clock.pauseAt(new Date(59000));
  await page.goto(app.url);
  await page.locator('#qr-import summary').click();
  for (const [algorithm, seed, expected] of [
    ['SHA1', secret, '94287082'],
    [
      'SHA256',
      'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA',
      '46119246',
    ],
    [
      'SHA512',
      'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA',
      '90693936',
    ],
  ]) {
    const payload = `otpauth://totp/Public?secret=${seed ?? ''}&algorithm=${algorithm ?? ''}&digits=8&period=30`;
    await page
      .locator('#qr-file')
      .setInputFiles(file(await QRCode.toBuffer(payload, { width: 640 })));
    await expect(page.locator('#secret')).toHaveValue(payload);
    await expect(page.locator('#code')).toHaveText(expected ?? '');
  }
  await page
    .locator('#qr-file')
    .setInputFiles(
      file(await QRCode.toBuffer('otpauth://totp/Public?secret=' + secret)),
    );
  await expect(page.locator('#code')).toHaveText('287082');
});

test('raster formats, rotation, inversion and offline calculation', async ({
  page,
  context,
}) => {
  await page.goto(app.url);
  await page.locator('#qr-import summary').click();
  const data = 'data:image/png;base64,' + image.toString('base64');
  for (const [format, rotation, inverted] of [
    ['image/jpeg', true, false],
    ['image/webp', false, false],
    ['image/png', false, true],
  ] as const) {
    const bytes = await page.evaluate(
      async ({ data, format, rotation, inverted }) => {
        const image = new window.Image();
        image.src = data;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Fixture canvas');
        if (rotation) {
          ctx.translate(canvas.width, 0);
          ctx.rotate(Math.PI / 2);
        }
        ctx.drawImage(image, 0, 0);
        if (inverted) {
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < pixels.data.length; i += 4)
            for (let channel = 0; channel < 3; channel++)
              pixels.data[i + channel] = 255 - (pixels.data[i + channel] ?? 0);
          ctx.putImageData(pixels, 0, 0);
        }
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (value) => {
              if (value) resolve(value);
              else reject(new Error('Fixture export'));
            },
            format,
            0.95,
          );
        });
        return [...new Uint8Array(await blob.arrayBuffer())];
      },
      { data, format, rotation, inverted },
    );
    await page.locator('#qr-file').setInputFiles({
      name: 'public-rfc-image',
      mimeType: format,
      buffer: Buffer.from(bytes),
    });
    await expect(page.locator('#secret')).toHaveValue(uri);
    await expect(page.locator('#result')).toBeVisible();
  }
  await context.setOffline(true);
  await page.locator('#secret').press('Enter');
  await expect(page.locator('#result')).toBeVisible();
});

test('decoder unavailable fails locally and preserves the manual key', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*.wasm', (route) => route.abort());
  await page.goto(app.url);
  await page.locator('#secret').fill(secret);
  await expect(page.locator('#result')).toBeVisible();
  await page.locator('#qr-import summary').click();
  await page.locator('#qr-file').setInputFiles(file(image));
  await expect(page.locator('#qr-file-error')).toBeVisible();
  await expect(page.locator('#qr-file-error')).toContainText('bộ đọc QR');
  await expect(page.locator('#secret')).toHaveValue(secret);
  await expect(page.locator('#result')).toBeVisible();
  expect(errors).toEqual([]);
});

for (const lang of ['vi', 'en'] as const)
  test(`paste an otpauth setup URL locally ${lang}`, async ({ page }) => {
    await page.clock.install({ time: new Date(58000) });
    await page.clock.pauseAt(new Date(59000));
    await page.goto(app.url + (lang === 'en' ? 'en/' : ''));
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await expect(page.locator('#secret-hint')).toContainText('otpauth://totp/');
    await page.locator('#secret').fill(uri);
    await page.locator('#secret').press('Enter');
    await expect(page.locator('#code')).toHaveText('94287082');
    await page.locator('#advanced summary').click();
    await expect(page.locator('input[name=digits][value="8"]')).toBeChecked();
    await page
      .locator('#secret')
      .fill('otpauth://totp/Public?secret=' + secret);
    await page.locator('#secret').press('Enter');
    await expect(page.locator('#code')).toHaveText('287082');
    await expect(page.locator('input[name=digits][value="6"]')).toBeChecked();
    await page.locator('#secret').fill('https://example.com/setup.png');
    await page.locator('#secret').press('Enter');
    await expect(page.locator('#secret-error')).toBeVisible();
    await expect(page.locator('#result')).toBeHidden();
    expect(requests).toEqual([]);
  });

test('cancel, edit, clear, background and timeout cannot apply a stale QR', async ({
  page,
}, info) => {
  const held: Route[] = [];
  const wasm = await readFile(
    'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm',
  );
  await page.route('**/*.wasm', (route) => {
    held.push(route);
  });
  await page.goto(app.url);
  await page.locator('#secret').fill(secret);
  await expect(page.locator('#result')).toBeVisible();
  for (const action of ['cancel', 'edit', 'clear', 'background']) {
    await page.locator('#qr-import').evaluate((node: HTMLDetailsElement) => {
      node.open = true;
    });
    const before = held.length;
    await page.locator('#qr-file').setInputFiles(file(image));
    await expect.poll(() => held.length).toBe(before + 1);
    await expect(page.locator('#qr-cancel')).toBeVisible();
    if (action === 'cancel') {
      await capture(page, 'vi-loading', info.project.name);
      await page.locator('#qr-cancel').click();
      await expect(page.locator('#qr-status')).toContainText('Đã hủy');
    } else if (action === 'edit') {
      await page.locator('#secret').fill('JBSWY3DPEHPK3PXP');
    } else if (action === 'clear') {
      await page.locator('#clear').click();
    } else {
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    await held[before]?.fulfill({
      body: wasm,
      contentType: 'application/wasm',
    });
    await page.waitForTimeout(200);
    const expected =
      action === 'edit' ? 'JBSWY3DPEHPK3PXP' : action === 'clear' ? '' : secret;
    await expect(page.locator('#secret')).toHaveValue(expected);
    await expect(page.locator('#qr-cancel')).toBeHidden();
    if (action === 'background') {
      await expect(page.locator('#result')).toBeHidden();
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          value: false,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    await page.locator('#secret').fill(secret);
    await expect(page.locator('#result')).toBeVisible();
  }
  await page.clock.install({ time: new Date(58000) });
  await page.clock.pauseAt(new Date(59000));
  await page.locator('#qr-import').evaluate((node: HTMLDetailsElement) => {
    node.open = true;
  });
  const before = held.length;
  await page.locator('#qr-file').setInputFiles(file(image));
  await expect.poll(() => held.length).toBe(before + 1);
  await page.clock.runFor(16000);
  await expect(page.locator('#qr-file-error')).toContainText('quá lâu');
  await expect(page.locator('#qr-cancel')).toBeHidden();
  await expect(page.locator('#secret')).toHaveValue(secret);
  await expect(page.locator('#result')).toBeVisible();
  await held[before]?.fulfill({ body: wasm, contentType: 'application/wasm' });
});

for (const lang of ['vi', 'en'] as const)
  test(`paste QR images and setup URLs without reading clipboard ${lang}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install({ time: new Date(58000) });
    await page.clock.pauseAt(new Date(59000));
    await page.addInitScript(() => {
      for (const name of ['read', 'readText']) {
        Object.defineProperty(navigator.clipboard, name, {
          configurable: true,
          value: () => {
            throw new Error('Unsolicited clipboard read');
          },
        });
      }
    });
    await page.goto(app.url + (lang === 'en' ? 'en/' : ''));
    await page.locator('#qr-import summary').click();
    const input = page.locator('#qr-paste');
    await input.focus();
    await input.evaluate(
      (node, bytes) => {
        const data = new DataTransfer();
        data.items.add(
          new File([new Uint8Array(bytes)], 'public-rfc.png', {
            type: 'image/png',
          }),
        );
        const event = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, 'clipboardData', { value: data });
        node.dispatchEvent(event);
      },
      [...image],
    );
    await expect(page.locator('#code')).toHaveText('94287082');
    await expect(input).toHaveValue('');
    await page.locator('#clear').click();
    await page.locator('#qr-import summary').click();
    await input.evaluate((node, text) => {
      const data = new DataTransfer();
      data.setData('text/plain', text);
      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'clipboardData', { value: data });
      node.dispatchEvent(event);
    }, uri);
    await expect(page.locator('#code')).toHaveText('94287082');
    // Some phone keyboards deliver text through input rather than ClipboardEvent.
    await input.fill('otpauth://totp/Public?secret=' + secret);
    await page.clock.runFor(250);
    await expect(page.locator('#code')).toHaveText('287082');
    await expect(input).toHaveValue('');
    await input.evaluate((node) => {
      const data = new DataTransfer();
      data.setData('text/plain', 'https://example.com/qr.png');
      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'clipboardData', { value: data });
      node.dispatchEvent(event);
    });
    await expect(page.locator('#qr-paste-error')).toBeVisible();
    await expect(page.locator('#secret')).toHaveValue(
      'otpauth://totp/Public?secret=' + secret,
    );
    await expect(page.locator('#code')).toHaveText('287082');
    await input.evaluate((node) => {
      const data = new DataTransfer();
      for (let i = 0; i < 2; i++)
        data.items.add(new File(['bad'], 'bad.png', { type: 'image/png' }));
      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'clipboardData', { value: data });
      node.dispatchEvent(event);
    });
    await expect(page.locator('#qr-paste-error')).toContainText(
      lang === 'vi' ? 'mỗi lần' : 'at a time',
    );
    await page.locator('#clear').click();
    await expect(page.locator('#qr-paste-error')).toBeHidden();
    await expect(input).toHaveValue('');
  });
