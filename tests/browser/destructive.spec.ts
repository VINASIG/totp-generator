import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { startServer } from '../../scripts/serve.ts';
import { inspectDestructiveActions } from '../../.vinasig/standards/templates/web/destructive-actions.mjs';

const product = path.basename(process.cwd());
const image = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAI3RFWHRPd25lcgBQUklWQVRFX0RFVklDRV9TRVJJQUxfR1BTXzEyM4yiulIAAABEZVhJZklJKgAIAAAAAgASAQMAAQAAAAYAAAAPAQIAHgAAACYAAAAAAAAAUFJJVkFURV9ERVZJQ0VfU0VSSUFMX0dQU18xMjMAWPd1AQAAAA1JREFUeJxj+M/A8B8ABQAB/4mZPR0AAAAASUVORK5CYIJQUklWQVRFX0RFVklDRV9TRVJJQUxfR1BTXzEyMw==',
  'base64',
);
const actions = [
  { selector: '#clear', count: 1 },
  ...(product === 'metadata-editor'
    ? [{ selector: '#reset-edits', count: 1 }]
    : []),
];
let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});

async function inspect(page: Page): Promise<void> {
  expect(await page.evaluate(inspectDestructiveActions, actions)).toEqual([]);
}

test('destructive action CSS matches its reviewed source pin', async () => {
  const record = JSON.parse(
    await readFile('docs/destructive-actions.json', 'utf8'),
  ) as { cssSha256: string; designSourceCommit: string };
  expect(record.designSourceCommit).toMatch(/^[a-f0-9]{40}$/u);
  expect(
    createHash('sha256')
      .update(await readFile('src/styles/destructive-actions.css'))
      .digest('hex'),
  ).toBe(record.cssSha256);
});

for (const locale of ['vi', 'en']) {
  test.describe(locale, () => {
    test.use({ locale: locale === 'vi' ? 'vi-VN' : 'en-US' });
    for (const theme of ['light', 'dark'] as const) {
      test(`destructive ${locale} ${theme} enabled, interaction and clear behavior`, async ({
        page,
      }, info) => {
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        const route =
          product === 'qr-generator'
            ? locale === 'en'
              ? '/'
              : '/vi/'
            : locale === 'vi'
              ? '/'
              : '/en/';
        expect((await page.goto(new URL(route, app.url).href))?.status()).toBe(
          200,
        );
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await inspect(page);
        if (product === 'totp-generator') {
          await page.locator('#secret').fill('JBSWY3DPEHPK3PXP');
          await expect(page.locator('#code')).toHaveText(/^\d{6}$/u);
          await expect(page.locator('#share')).toBeEnabled();
        } else if (product.includes('bmi-calculator')) {
          await page.locator('#height').fill('170');
          await page.locator('#weight').fill('65');
        } else if (product === 'qr-generator')
          await page.locator('#content').fill('synthetic-clear-regression');
        else
          await page.locator('input[type=file]').setInputFiles({
            name: 'synthetic.png',
            mimeType: 'image/png',
            buffer: image,
          });
        await expect(page.locator('#clear')).toBeEnabled();
        if (product === 'qr-scanner')
          await expect(page.locator('#preview')).toBeVisible();
        if (product === 'metadata-editor') {
          await expect(page.locator('#editor-workspace')).toBeVisible();
          await page.locator('#value-title').fill('Synthetic unsaved edit');
        }
        await inspect(page);
        for (const action of actions) {
          const button = page.locator(action.selector);
          await button.hover();
          await inspect(page);
          await page.mouse.down();
          await inspect(page);
          await page.mouse.move(0, 0);
          await page.mouse.up();
          await button.focus();
          await expect(button).toBeFocused();
          await page.keyboard.press('Tab');
          await page.keyboard.press('Shift+Tab');
          await expect
            .poll(() =>
              button.evaluate(
                (node) =>
                  node === document.activeElement &&
                  node.matches(':focus-visible'),
              ),
            )
            .toBe(true);
          await expect(button).toBeFocused();
          await inspect(page);
        }
        await page.mouse.move(0, 0);
        await page.screenshot({
          path: info.outputPath('destructive-ready.png'),
          fullPage: true,
        });
        if (product === 'metadata-editor') {
          await page.locator('#reset-edits').click();
          await expect(page.locator('#value-title')).toHaveValue('');
        }
        await page.emulateMedia({ forcedColors: 'active' });
        await inspect(page);
        for (const action of actions) {
          const button = page.locator(action.selector);
          await button.hover();
          await inspect(page);
          await page.mouse.down();
          await inspect(page);
          await page.mouse.move(0, 0);
          await page.mouse.up();
          await button.focus();
          await expect(button).toBeFocused();
          await page.keyboard.press('Tab');
          await page.keyboard.press('Shift+Tab');
          await expect(button).toBeFocused();
          await expect
            .poll(() =>
              button.evaluate(
                (node) =>
                  node === document.activeElement &&
                  node.matches(':focus-visible'),
              ),
            )
            .toBe(true);
          await inspect(page);
        }
        await page.emulateMedia({ forcedColors: 'none' });
        await page.locator('#clear').evaluate((node) => {
          node.style.setProperty('color', '#21497b', 'important');
          node.style.setProperty('border-color', '#21497b', 'important');
        });
        expect(
          (await page.evaluate(inspectDestructiveActions, actions)).map(
            (finding) => finding.kind,
          ),
        ).toContain('destructive-color');
        await page.locator('#clear').click();
        if (product === 'totp-generator')
          await expect(page.locator('#secret')).toHaveValue('');
        else if (product.includes('bmi-calculator')) {
          await expect(page.locator('#height')).toHaveValue('');
          await expect(page.locator('#weight')).toHaveValue('');
          await expect(page.locator('#result')).toBeHidden();
        } else if (product === 'qr-generator')
          await expect(page.locator('#content')).toHaveValue('');
        else {
          await expect(page.locator('input[type=file]')).toHaveValue('');
          if (product === 'qr-scanner') {
            await expect(page.locator('#preview')).toBeHidden();
            await expect(page.locator('#results')).toBeEmpty();
            await expect(page.locator('#download-results')).toBeHidden();
          } else await expect(page.locator('#clear')).toBeDisabled();
        }
      });
    }
  });
}
