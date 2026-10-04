import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startServer } from '../../scripts/serve.ts';
import {
  inspectInterface,
  inspectControlSurfaces,
  inspectHeaderBrand,
} from '../../.vinasig/standards/templates/web/interface.mjs';
let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
async function inspect(page: Page) {
  expect(await page.evaluate(inspectInterface)).toEqual([]);
  expect(await page.evaluate(inspectControlSurfaces)).toEqual([]);
  expect(await page.evaluate(inspectHeaderBrand)).toEqual([]);
  expect(await page.locator('input[type=radio]').count()).toBe(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
for (const lang of ['vi', 'en'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`code, errors, clear, options and privacy ${lang} ${theme}`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.clock.install({ time: new Date(58000) });
      await page.clock.pauseAt(new Date(59000));
      await page.goto(app.url + (lang === 'en' ? 'en/' : ''));
      await expect(page.locator('#secret')).toBeEnabled();
      await page.locator('#secret').fill(secret);
      await page.clock.runFor(250);
      await expect(page.locator('#code')).toHaveText('287082');
      await expect(page.locator('#remaining')).toHaveText('1');
      await expect(page.locator('#countdown-unit')).toHaveText(
        lang === 'en' ? 'second' : 'giây',
      );
      await page.clock.runFor(1000);
      await expect(page.locator('#code')).toHaveText('359152');
      await expect(page.locator('#countdown-unit')).toHaveText(
        lang === 'en' ? 'seconds' : 'giây',
      );
      await expect(page.locator('#secret')).toBeFocused();
      await page.locator('#secret').fill('invalid1');
      await expect(page.locator('#result')).toBeHidden();
      await expect(page.locator('#copy')).toBeDisabled();
      await page.locator('#clear').scrollIntoViewIfNeeded();
      const immediateBox = await page.locator('#clear').boundingBox();
      if (!immediateBox) throw new Error('Clear button has no pointer target');
      await page.mouse.move(
        immediateBox.x + immediateBox.width / 2,
        immediateBox.y + immediateBox.height / 2,
      );
      await page.mouse.down();
      await page.clock.runFor(250);
      await page.mouse.up();
      await expect(page.locator('#secret')).toHaveValue('');
      await expect(page.locator('#secret-error')).toBeHidden();
      await page.locator('#secret').fill('invalid1');
      await page.clock.runFor(250);
      await page.locator('#secret').press('Enter');
      await expect(page.locator('#secret-error')).toBeVisible();
      await page.locator('#clear').scrollIntoViewIfNeeded();
      const clearBox = await page.locator('#clear').boundingBox();
      if (!clearBox) throw new Error('Clear button has no pointer target');
      await page.mouse.move(
        clearBox.x + clearBox.width / 2,
        clearBox.y + clearBox.height / 2,
      );
      await page.mouse.down();
      await page.clock.runFor(50);
      await page.mouse.up();
      await expect(page.locator('#secret')).toHaveValue('');
      await expect(page.locator('#secret-error')).toBeHidden();
      await page.locator('#secret').fill('invalid1');
      await page.clock.runFor(250);
      await page.locator('#reveal').click();
      await page.clock.runFor(10);
      await expect(page.locator('#secret-error')).toBeVisible();
      expect(
        await page.locator('#secret').getAttribute('aria-describedby'),
      ).toContain('secret-error');
      await page.locator('#clear').click();
      await expect(page.locator('#secret')).toHaveValue('');
      await expect(page.locator('#secret-error')).toBeHidden();
      await expect(page.locator('#secret')).toHaveAttribute('type', 'password');
      await page
        .locator('#secret')
        .fill(
          'otpauth://totp/Example%3Aalice?secret=' +
            secret +
            '&issuer=Example&algorithm=SHA1&digits=8&period=30',
        );
      await page.clock.runFor(250);
      await expect(page.locator('#code')).toHaveText('37359152');
      await page.locator('#advanced summary').click();
      await expect(page.locator('input[name=digits][value="8"]')).toBeChecked();
      await page.locator('#period').fill('0');
      await page.clock.runFor(250);
      await page.locator('#offset').focus();
      await page.clock.runFor(10);
      await expect(page.locator('#period-error')).toBeVisible();
      await page.locator('#period').fill('30');
      await page.clock.runFor(250);
      await expect(page.locator('#result')).toBeVisible();
      await page.locator('#technical summary').click();
      await expect(page.locator('#account')).toHaveText('Example:alice');
      await inspect(page);
      const requests: string[] = [];
      page.on('request', (request) => requests.push(request.url()));
      await page.locator('#secret').fill(secret);
      await page.clock.runFor(400);
      await expect(page.locator('#result')).toBeVisible();
      expect(requests).toEqual([]);
      expect(
        await page.evaluate(() =>
          Object.keys(localStorage).filter((k) => k !== 'vinasig-theme'),
        ),
      ).toEqual([]);
      expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual(
        [],
      );
      expect(await page.evaluate(() => document.cookie)).toBe('');
      await page.context().setOffline(true);
      await page.clock.runFor(30000);
      await expect(page.locator('#code')).toHaveText('26969429');
      await page.context().setOffline(false);
      await page.reload();
      await expect(page.locator('#secret')).toHaveValue('');
      await expect(page.locator('#result')).toBeHidden();
      expect(errors).toEqual([]);
      await mkdir(`output/responsive/${info.project.name}`, {
        recursive: true,
      });
      await page.screenshot({
        path: `output/responsive/${info.project.name}/${lang}-${theme}-initial.png`,
        fullPage: true,
      });
    });
  }
for (const lang of ['vi', 'en'] as const)
  for (const theme of ['light', 'dark'] as const)
    for (const width of [320, 360, 390, 600, 759, 760, 761, 768, 1024, 1440]) {
      test(`responsive ${lang} ${theme} ${String(width)}`, async ({
        page,
      }, info) => {
        await page.setViewportSize({
          width,
          height: width === 768 ? 1024 : 900,
        });
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        await page.goto(app.url + (lang === 'en' ? 'en/' : ''));
        await expect(page.locator('#secret')).toBeEnabled();
        if (width === 320)
          await page.evaluate(() => {
            document.styleSheets[0]?.insertRule('html {font-size:200%}');
          });
        await inspect(page);
        await page
          .locator('#secret')
          .fill('otpauth://totp/Test?secret=' + secret + '&digits=8');
        await expect(page.locator('#result')).toBeVisible();
        const codeBox = await page.locator('#code').evaluate((node) => ({
          height: node.getBoundingClientRect().height,
          lineHeight: Number.parseFloat(getComputedStyle(node).lineHeight),
        }));
        expect(codeBox.height).toBeLessThanOrEqual(codeBox.lineHeight + 1);
        await page.locator('#advanced summary').click();
        await page.locator('#technical summary').click();
        const overlappingRows = await page
          .locator('#technical dl div')
          .evaluateAll((rows) =>
            rows
              .filter((row) => {
                if (!(row instanceof HTMLElement) || row.hidden) return false;
                const label = row.querySelector('dt');
                const value = row.querySelector('dd');
                if (!label || !value) return true;
                const labelRange = document.createRange();
                const valueRange = document.createRange();
                labelRange.selectNodeContents(label);
                valueRange.selectNodeContents(value);
                return [...labelRange.getClientRects()].some((a) =>
                  [...valueRange.getClientRects()].some(
                    (b) =>
                      a.left < b.right &&
                      a.right > b.left &&
                      a.top < b.bottom &&
                      a.bottom > b.top,
                  ),
                );
              })
              .map((row) => row.textContent),
          );
        expect(overlappingRows).toEqual([]);
        for (const time of await page.locator('#technical time').all()) {
          const box = await time.evaluate((node) => ({
            height: node.getBoundingClientRect().height,
            lineHeight: Number.parseFloat(getComputedStyle(node).lineHeight),
          }));
          expect(box.height).toBeLessThanOrEqual(box.lineHeight + 1);
        }
        await inspect(page);
        await page.locator('.site-footer').scrollIntoViewIfNeeded();
        await inspect(page);
        await page.locator('#secret').scrollIntoViewIfNeeded();
        await mkdir(`output/responsive/${info.project.name}`, {
          recursive: true,
        });
        await page.screenshot({
          path: `output/responsive/${info.project.name}/${lang}-${theme}-${String(width)}-open.png`,
          fullPage: true,
        });
        if (width === 390 || width === 1440) {
          const audit = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(audit.violations).toEqual([]);
        }
      });
    }
test('clear by touch after validation', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await page.goto(app.url);
    await expect(page.locator('#secret')).toBeEnabled();
    await page.locator('#secret').fill('invalid1');
    await page.locator('#secret').press('Enter');
    await expect(page.locator('#secret-error')).toBeVisible();
    await page.locator('#clear').tap();
    await expect(page.locator('#secret')).toHaveValue('');
    await expect(page.locator('#secret-error')).toBeHidden();
  } finally {
    await context.close();
  }
});

test('clipboard success, failure, expiration and stale async work', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(58000) });
  await page.clock.pauseAt(new Date(59000));
  await page.goto(app.url);
  await expect(page.locator('#secret')).toBeEnabled();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (value: string) => {
          document.body.dataset['clipboardFixture'] = value;
          return Promise.resolve();
        },
      },
    });
  });
  await page.locator('#secret').fill(secret);
  await page.clock.runFor(250);
  await expect(page.locator('#copy')).toBeEnabled();
  await page.locator('#copy').click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-clipboard-fixture',
    '287082',
  );
  await page.clock.runFor(1000);
  await page.locator('#copy').click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-clipboard-fixture',
    '359152',
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('Denied fixture')) },
    });
  });
  await page.locator('#copy').click();
  await expect(page.locator('#copy-status')).toContainText(
    'Không sao chép được',
  );
  await page.evaluate(() => {
    const original = crypto.subtle.sign.bind(crypto.subtle);
    Object.defineProperty(crypto.subtle, 'sign', {
      value: (...args: Parameters<typeof crypto.subtle.sign>) =>
        new Promise<ArrayBuffer>((resolve, reject) => {
          setTimeout(() => {
            void original(...args).then(resolve, reject);
          }, 1000);
        }),
    });
  });
  await page.locator('#secret').fill('JBSWY3DPEHPK3PXP');
  await page.clock.runFor(250);
  await page.locator('#clear').click();
  await page.clock.runFor(1500);
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('#code')).toHaveText('');
  await expect(page.locator('#copy')).toBeDisabled();
});
test('script unavailable, keyboard, forced colors and theme controls', async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const initial = await context.newPage();
  await initial.goto(app.url);
  await expect(initial.locator('#secret')).toBeDisabled();
  await expect(initial.locator('#status')).toContainText('JavaScript');
  await initial.locator('#advanced summary').click();
  expect(await initial.evaluate(inspectControlSurfaces)).toEqual([]);
  await initial
    .getByRole('link', { name: 'Đọc trang này bằng tiếng Anh' })
    .click();
  await expect(initial.locator('html')).toHaveAttribute('lang', 'en');
  await context.close();
  await page.goto(app.url);
  await expect(page.locator('#secret')).toBeEnabled();
  const assertThemeIcon = async () => {
    const theme = await page.locator('html').getAttribute('data-theme');
    await expect(
      page.locator(theme === 'dark' ? '.theme-sun' : '.theme-moon'),
    ).toBeVisible();
    await expect(
      page.locator(theme === 'dark' ? '.theme-moon' : '.theme-sun'),
    ).toBeHidden();
  };
  await assertThemeIcon();
  await page.emulateMedia({ forcedColors: 'active' });
  await page.locator('#advanced summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#advanced')).toHaveAttribute('open', '');
  await page.locator('input[name=algorithm][value=SHA1]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.locator('input[name=algorithm][value=SHA256]'),
  ).toBeChecked();
  await page.emulateMedia({ forcedColors: 'none' });
  const oldTheme = await page.locator('html').getAttribute('data-theme');
  await page.locator('[data-theme-toggle]').click();
  expect(await page.locator('html').getAttribute('data-theme')).not.toBe(
    oldTheme,
  );
  await assertThemeIcon();
  await page.reload();
  expect(await page.locator('html').getAttribute('data-theme')).not.toBe(
    oldTheme,
  );
  await assertThemeIcon();
  await page.locator('#secret').fill('invalid1');
  await page.locator('#secret').press('Enter');
  await expect(page.locator('#secret-error')).toBeVisible();
  await page.locator('#clear').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#secret')).toHaveValue('');
});
