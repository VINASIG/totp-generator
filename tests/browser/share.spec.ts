import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startServer } from '../../scripts/serve.ts';
import {
  inspectInterface,
  inspectControlSurfaces,
} from '../../.vinasig/standards/templates/web/interface.mjs';

let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const capsule = (options = 'algorithm=SHA1&digits=6&period=30') =>
  '#totp=1&secret=' + secret + '&' + options;

async function clipboardFixture(page: Page, reject = false) {
  await page.evaluate((deny) => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (value: string) => {
          if (deny) return Promise.reject(new Error('Denied fixture'));
          document.body.dataset['clipboardFixture'] = value;
          return Promise.resolve();
        },
      },
    });
  }, reject);
}

for (const lang of ['vi', 'en'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`share valid keys explicitly and clear obsolete links ${lang} ${theme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(app.url + (lang === 'en' ? 'en/' : ''));
      await expect(page.locator('#secret')).toBeEnabled();
      await expect(page.locator('#share')).toBeDisabled();
      await expect(page.locator('#share-panel')).toBeHidden();
      await page.locator('#secret').fill('invalid1');
      await page.locator('#secret').press('Enter');
      await expect(page.locator('#share')).toBeDisabled();
      await page
        .locator('#secret')
        .fill(
          'otpauth://totp/Private%3Aperson?secret=' +
            secret +
            '&issuer=Private&algorithm=SHA256&digits=8&period=60',
        );
      await page.locator('#secret').press('Enter');
      await expect(page.locator('#share')).toBeEnabled();
      await expect(page.locator('#share-panel')).toBeHidden();
      await page.locator('#advanced summary').click();
      await page.locator('#offset').fill('15');
      await page.locator('#offset').press('Enter');
      await expect(page.locator('#share')).toBeEnabled();
      await page.locator('#share').click();
      await expect(page.locator('#share-panel')).toBeVisible();
      await expect(page.locator('#share')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      await expect(page.locator('#share-warning')).toContainText(
        lang === 'vi' ? 'Ai có liên kết' : 'Anyone with this link',
      );
      const url = new URL(await page.locator('#share-link').inputValue());
      expect(url.search).toBe('');
      expect(url.pathname).toBe(lang === 'en' ? '/en/' : '/');
      expect(url.hash).toBe(capsule('algorithm=SHA256&digits=8&period=60'));
      expect(url.href).not.toContain('Private');
      expect(url.href).not.toContain('person');
      expect(url.href).not.toContain('offset');
      expect(
        await page.locator('body').getAttribute('data-clipboard-fixture'),
      ).toBeNull();
      await clipboardFixture(page);
      await page.locator('#share-copy').click();
      await expect(page.locator('body')).toHaveAttribute(
        'data-clipboard-fixture',
        url.href,
      );
      await expect(page.locator('#share-status')).toContainText(
        lang === 'vi' ? 'Đã sao chép' : 'copied',
      );
      await page.locator('#period').fill('300');
      await expect(page.locator('#share-panel')).toBeHidden();
      await expect(page.locator('#share-link')).toHaveValue('');
      await expect(page.locator('#share')).toBeDisabled();
      await page.locator('#period').press('Enter');
      await expect(page.locator('#share')).toBeEnabled();
      await page.locator('#share').click();
      await expect(page.locator('#share-link')).toHaveValue(
        new RegExp('period=300$'),
      );
      await page.locator('#clear').click();
      await expect(page.locator('#share-link')).toHaveValue('');
      await expect(page.locator('#share')).toBeDisabled();
      await expect(page.locator('#share-copy')).toBeDisabled();
      await expect(page.locator('#share-panel')).toBeHidden();
    });
  }

for (const algorithm of ['SHA1', 'SHA256', 'SHA512'] as const)
  test(`share import produces independent reference codes for ${algorithm}`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date(58000) });
    await page.clock.pauseAt(new Date(59000));
    const requestUrls: string[] = [];
    page.on('request', (request) => requestUrls.push(request.url()));
    await page.goto(
      app.url + capsule(`algorithm=${algorithm}&digits=8&period=60`),
    );
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(0n);
    const mac = createHmac(algorithm.toLowerCase(), '12345678901234567890')
      .update(counter)
      .digest();
    const last = mac.at(-1);
    if (last === undefined) throw new Error('Missing reference MAC');
    const expected = String(
      (mac.readUInt32BE(last & 15) & 0x7fffffff) % 100000000,
    ).padStart(8, '0');
    await expect(page.locator('#code')).toHaveText(expected);
    await expect(page).toHaveURL(app.url);
    await expect(page.locator('#secret')).toHaveValue(secret);
    await expect(page.locator('#secret')).toHaveAttribute('type', 'text');
    await expect(page.locator('#secret')).toHaveAttribute(
      'data-masked',
      'true',
    );
    await expect(page.locator('#offset')).toHaveValue('0');
    await expect(page.locator('#share-link')).toHaveValue('');
    await expect(page.locator('.language-switch')).not.toHaveAttribute(
      'href',
      new RegExp('totp=|secret='),
    );
    expect(
      requestUrls.every(
        (url) =>
          !url.includes(secret) && !url.includes('#') && !new URL(url).search,
      ),
    ).toBe(true);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe('');
    const loaded = requestUrls.length;
    await page.context().setOffline(true);
    await page.clock.runFor(61000);
    await expect(page.locator('#code')).not.toHaveText(expected);
    expect(requestUrls.length).toBe(loaded);
    await page.context().setOffline(false);
    await page.reload();
    await expect(page.locator('#secret')).toHaveValue('');
    await expect(page.locator('#result')).toBeHidden();
  });

test('system and manual locale redirects retain a capsule before consuming it', async ({
  browser,
}) => {
  for (const manual of [false, true]) {
    const context = await browser.newContext({
      locale: manual ? 'vi-VN' : 'en-US',
    });
    const page = await context.newPage();
    try {
      if (manual) {
        await page.goto(app.url);
        await page.locator('.language-switch').click();
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      }
      await page.goto(app.url + capsule());
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('#result')).toBeVisible();
      await expect(page).toHaveURL(app.url + 'en/');
      await expect(page.locator('#secret')).toHaveValue(secret);
      await expect(page.locator('.language-switch')).not.toHaveAttribute(
        'href',
        new RegExp('secret='),
      );
      await page.locator('.language-switch').click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
      await expect(page).toHaveURL(app.url);
      await expect(page.locator('#secret')).toHaveValue('');
      await expect(page.locator('#result')).toBeHidden();
    } finally {
      await context.close();
    }
  }
});

test('corrupted and future capsules clear old output and are removed from the address', async ({
  page,
}) => {
  await page.goto(app.url + capsule());
  await expect(page.locator('#result')).toBeVisible();
  for (const fragment of [
    capsule() + '&digits=8',
    capsule().replace('totp=1', 'totp=2'),
    capsule().replace(secret, 'invalid1'),
    '#totp=1' + 'A'.repeat(2400),
  ]) {
    await page.evaluate((hash) => {
      location.hash = hash;
    }, fragment);
    await expect(page.locator('#share-import-error')).toBeVisible();
    await expect(page).toHaveURL(app.url);
    await expect(page.locator('#secret')).toHaveValue('');
    await expect(page.locator('#code')).toHaveText('');
    await expect(page.locator('#copy')).toBeDisabled();
    await expect(page.locator('#share')).toBeDisabled();
    await expect(page.locator('.language-switch')).not.toHaveAttribute(
      'href',
      new RegExp('totp='),
    );
  }
  await page.locator('#secret').fill(secret);
  await page.locator('#secret').press('Enter');
  await expect(page.locator('#share-import-error')).toBeHidden();
  await expect(page.locator('#result')).toBeVisible();
});

test('reveal stays a text field without new-password autocomplete', async ({
  page,
}) => {
  await page.goto(app.url);
  const input = page.locator('#secret');
  await expect(input).toBeEnabled();
  await input.fill(secret);
  await expect(input).toHaveAttribute('autocomplete', 'off');
  await expect(input).toHaveAttribute('type', 'text');
  await expect(input).toHaveCSS('-webkit-text-security', 'disc');
  await page.locator('#reveal').focus();
  await page.keyboard.press('Space');
  await expect(input).toHaveAttribute('data-masked', 'false');
  await expect(input).toHaveAttribute('type', 'text');
  await expect(input).toHaveCSS('-webkit-text-security', 'none');
  await page.keyboard.press('Enter');
  await expect(input).toHaveCSS('-webkit-text-security', 'disc');
  await expect(input).toHaveValue(secret);
});

test('unavailable clipboard and stale share operations fail without restoring exports', async ({
  page,
}) => {
  await page.goto(app.url + capsule());
  await expect(page.locator('#share')).toBeEnabled();
  await page.locator('#share').click();
  await clipboardFixture(page, true);
  await page.locator('#share-copy').click();
  await expect(page.locator('#share-status')).toContainText(
    'Không sao chép được',
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
  });
  await page.locator('#share-copy').click();
  await expect(page.locator('#share-copy')).toBeEnabled();
  await expect(page.locator('#share-status')).toContainText(
    'Không sao chép được',
  );
  await page.clock.install();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            setTimeout(resolve, 1000);
          }),
      },
    });
  });
  await page.locator('#share-copy').click();
  await page.locator('#clear').click();
  await page.clock.runFor(1500);
  await expect(page.locator('#share-status')).toHaveText('');
  await expect(page.locator('#share-link')).toHaveValue('');
  await expect(page.locator('#share')).toBeDisabled();
});

test('hidden pages drop exports and cannot restore a stale clipboard message', async ({
  page,
}) => {
  await page.goto(app.url + capsule());
  await expect(page.locator('#share')).toBeEnabled();
  await page.locator('#share').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#share-panel')).toBeHidden();
  await expect(page.locator('#share-link')).toHaveValue('');
  await expect(page.locator('#share')).toBeDisabled();
  await expect(page.locator('#code')).toHaveText('');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#secret')).toHaveValue(secret);
  await expect(page.locator('#share-panel')).toBeHidden();
});

for (const lang of ['vi', 'en'] as const)
  for (const theme of ['light', 'dark'] as const)
    test(`share panel reflow and accessibility ${lang} ${theme}`, async ({
      page,
    }, info) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(app.url + (lang === 'en' ? 'en/' : '') + capsule());
      await expect(page.locator('#share')).toBeEnabled();
      await page.locator('#share').click();
      for (const width of [320, 360, 390, 768, 1024, 1440]) {
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
        if (width === 320 || width === 1440) {
          await mkdir(`output/responsive/share/${info.project.name}`, {
            recursive: true,
          });
          await page.screenshot({
            path: `output/responsive/share/${info.project.name}/${lang}-${theme}-${String(width)}-share.png`,
            fullPage: true,
          });
        }
      }
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
      await page.setViewportSize({ width: 320, height: 800 });
      await page.evaluate(() => {
        document.styleSheets[0]?.insertRule('html {font-size:200%}');
      });
      expect(await page.evaluate(inspectInterface)).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `output/responsive/share/${info.project.name}/${lang}-${theme}-enlarged-share.png`,
        fullPage: true,
      });
      await page.emulateMedia({ forcedColors: 'active' });
      await page.locator('#share-copy').focus();
      await expect(page.locator('#share-copy')).toBeFocused();
      await page.locator('#share').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#share-panel')).toBeHidden();
      await expect(page.locator('#share-link')).toHaveValue('');
    });

test('scripts unavailable keep sharing disabled', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    locale: 'vi-VN',
  });
  try {
    const page = await context.newPage();
    await page.goto(app.url + capsule());
    await expect(page.locator('#share')).toBeDisabled();
    await expect(page.locator('#share-panel')).toBeHidden();
    await expect(page.locator('#share-copy')).toBeDisabled();
    await expect(page.locator('#status')).toContainText('JavaScript');
  } finally {
    await context.close();
  }
});

test('minimum and maximum key sizes export bounded links and import after reload', async ({
  page,
}) => {
  await page.goto(app.url);
  await expect(page.locator('#secret')).toBeEnabled();
  for (const key of ['MY', 'A'.repeat(2048)]) {
    await page.locator('#secret').fill(key);
    await page.locator('#secret').press('Enter');
    await expect(page.locator('#share')).toBeEnabled();
    await page.locator('#share').click();
    const link = await page.locator('#share-link').inputValue();
    expect(new URL(link).hash.length).toBeLessThanOrEqual(2304);
    await page.goto(link);
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#secret')).toHaveValue(key);
    await expect(page).toHaveURL(app.url);
  }
});

test('unavailable crypto still scrubs recognized links without enabling sharing', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: { subtle: undefined },
    });
  });
  await page.goto(app.url + capsule());
  await expect(page).toHaveURL(app.url);
  await expect(page.locator('#secret')).toHaveValue('');
  await expect(page.locator('#secret')).toBeDisabled();
  await expect(page.locator('#share')).toBeDisabled();
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('#status')).toContainText(
    'Hãy dùng trình duyệt mới',
  );
});

test('failed address cleanup never imports the credential', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(history, 'replaceState', {
      value: () => {
        throw new Error('Denied fixture');
      },
    });
  });
  await page.goto(app.url + capsule());
  await expect(page.locator('#share-import-error')).toBeVisible();
  await expect(page.locator('#secret')).toHaveValue('');
  await expect(page.locator('#share')).toBeDisabled();
  await expect(page.locator('#result')).toBeHidden();
});

test('native masking fallback does not request a new password', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS);
    Object.defineProperty(CSS, 'supports', {
      value: (property: string, value?: string): boolean =>
        property === '-webkit-text-security'
          ? false
          : value === undefined
            ? supports(property)
            : supports(property, value),
    });
  });
  await page.goto(app.url);
  await expect(page.locator('#secret')).toBeEnabled();
  await expect(page.locator('#secret')).toHaveAttribute('type', 'password');
  await expect(page.locator('#secret')).toHaveAttribute('autocomplete', 'off');
  await page.locator('#reveal').click();
  await expect(page.locator('#secret')).toHaveAttribute('type', 'text');
  await page.locator('#clear').click();
  await expect(page.locator('#secret')).toHaveAttribute('type', 'password');
});
